from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Any, Dict, List, Optional
import httpx
import json
from pydantic import BaseModel, Field

from app.config import PROXY_MODELS, PROVIDER_CONFIGS
from app import logger

# Initialize router
router = APIRouter(tags=["OpenAI Compatible API"])

# Models for request/response validation
class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

class ModelListResponse(BaseModel):
    object: str = "list"
    data: List[Dict[str, Any]]

@router.get("/models", response_model=ModelListResponse)
@logger.with_trace_id
async def list_models(request: Request):
    """List available models."""
    trace_id = logger.get_trace_id()

    try:
        # Only return proxy models from config
        proxy_models = [
            {"id": model_id, "object": "model", "owned_by": "system"}
            for model_id in PROXY_MODELS.keys()
        ]
        
        # Detailed log about the operation without repeating URI
        logger.debug(f"Returning {len(proxy_models)} proxy models")
        
        response_data = {
            "object": "list",
            "data": proxy_models
        }
        
        return JSONResponse(
            content=response_data,
            headers={"X-Trace-ID": trace_id}
        )
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list models: {str(e)}"
        )

def map_real_model_to_proxy_model(response_data: dict, proxy_model: str):
    """Map real model in response back to proxy model."""
    if 'model' in response_data:
        response_data['model'] = proxy_model
    
    # Handle streaming responses that may have nested model fields
    if 'choices' in response_data:
        for choice in response_data['choices']:
            if isinstance(choice, dict) and 'message' in choice:
                if isinstance(choice['message'], dict) and 'model' in choice['message']:
                    choice['message']['model'] = proxy_model
                    
    return response_data

@router.post("/chat/completions")
@logger.with_trace_id
async def create_chat_completion(request: Request):
    """Create a chat completion by forwarding to the appropriate provider."""
    trace_id = logger.get_trace_id()
    # We don't need to set request context with URI here as middleware already did it
    
    try:
        # Parse request body
        body = await request.json()
        request_data = ChatCompletionRequest(**body)
        
        # Get model from request
        proxy_model = request_data.model
        
        # Check if the model is in our proxy models
        if proxy_model not in PROXY_MODELS:
            logger.error(f"Unsupported model: {proxy_model}")
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model: {proxy_model}"
            )
        
        # Get provider details from config
        provider_type, provider_name, real_model = PROXY_MODELS[proxy_model]
        provider_config = PROVIDER_CONFIGS[provider_type][provider_name]
        
        if not provider_config.available:
            logger.error(f"Provider {provider_name} is not available")
            raise HTTPException(
                status_code=503,
                detail=f"Provider {provider_name} is not available"
            )
        
        # Replace proxy model with real model
        request_data.model = real_model
        
        logger.info(f"Forwarding request to '{provider_name}' with model '{real_model}'")
        
        # Prepare request for forwarding
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {provider_config.api_key}",
            "X-Trace-ID": trace_id  # Forward trace ID to downstream services
        }
        
        # Forward request to provider
        endpoint = f"{provider_config.api_endpoint}/chat/completions"
        
        # Handle streaming requests
        if request_data.stream:
            logger.debug(f"Handling streaming request for model '{real_model}'")
            return await handle_streaming_request(
                endpoint=endpoint,
                headers=headers,
                request_data=request_data,
                proxy_model=proxy_model,
                trace_id=trace_id
            )
        else:
            # Handle regular non-streaming requests
            logger.debug(f"Handling regular request for model '{real_model}'")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint,
                    headers=headers,
                    json=request_data.dict(exclude_none=True),
                    timeout=60
                )
                
                # Regular response - map model name back
                response_data = response.json()
                response_data = map_real_model_to_proxy_model(response_data, proxy_model)
                logger.debug(f"Received response from '{provider_name}' for model '{real_model}'")
                return JSONResponse(content=response_data)
            
    except Exception as e:
        logger.error(f"[{trace_id}] Error creating chat completion: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat completion: {str(e)}"
        )

async def handle_streaming_request(endpoint, headers, request_data, proxy_model, trace_id):
    """Handle streaming requests with proper model name mapping."""
    
    async def stream_generator():
        # Use direct connection to prevent buffering
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                endpoint,
                headers=headers,
                json=request_data.dict(exclude_none=True),
                timeout=None
            ) as response:
                # Process each line as it's received
                async for line in response.aiter_lines():
                    if not line.strip():
                        # Pass empty lines for proper SSE formatting
                        yield "\n"
                        continue
                    
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            logger.debug(f"Stream complete, sending [DONE]")
                            yield "data: [DONE]\n\n"
                        else:
                            try:
                                data = json.loads(data_str)
                                if 'model' in data:
                                    data['model'] = proxy_model
                                yield f"data: {json.dumps(data)}\n\n"
                            except json.JSONDecodeError:
                                # Pass through unchanged if not valid JSON
                                logger.warning(f"Received non-JSON data in stream: {data_str[:20]}...")
                                yield f"{line}\n"
                    else:
                        # Pass through other lines unchanged
                        yield f"{line}\n"
    
    return StreamingResponse(
        content=stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked",
            "X-Trace-ID": trace_id
        }
    )