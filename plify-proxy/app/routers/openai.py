from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Any, Dict, List, Optional
import logging
import httpx
import json
from pydantic import BaseModel, Field

from ..config import PROXY_MODELS, PROVIDER_CONFIGS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    top_p: Optional[float] = 1.0
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
    user: Optional[str] = None

class ModelListResponse(BaseModel):
    object: str = "list"
    data: List[Dict[str, Any]]

@router.get("/models", response_model=ModelListResponse)
async def list_models():
    """List available models."""
    try:
        # Only return proxy models from config
        proxy_models = [
            {"id": model_id, "object": "model", "owned_by": "Reddit-Insight-Proxy"}
            for model_id in PROXY_MODELS.keys()
        ]
        
        return {
            "object": "list",
            "data": proxy_models
        }
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to list models: {str(e)}"}
        )

@router.post("/chat/completions")
async def create_chat_completion(request: Request):
    """Create a chat completion by forwarding to the appropriate provider."""
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
                detail={"message": f"Unsupported model: {proxy_model}"}
            )
        
        # Get provider details from config
        provider_type, provider_name, real_model = PROXY_MODELS[proxy_model]
        provider_config = PROVIDER_CONFIGS[provider_type][provider_name]
        
        if not provider_config.available:
            logger.error(f"Provider {provider_name} is not available")
            raise HTTPException(
                status_code=503,
                detail={"message": f"Provider {provider_name} is not available"}
            )
        
        # Replace proxy model with real model
        request_data.model = real_model
        
        # Prepare request for forwarding
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {provider_config.api_key}"
        }
        
        # Forward request to provider
        endpoint = f"{provider_config.api_endpoint}/chat/completions"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                headers=headers,
                json=request_data.dict(exclude_none=True),
                timeout=60
            )
            
            # Handle streaming response if requested
            if request_data.stream:
                return StreamingResponse(
                    content=response.aiter_bytes(),
                    media_type="text/event-stream"
                )
            
            # Return regular response
            return JSONResponse(content=response.json())
            
    except Exception as e:
        logger.error(f"Error creating chat completion: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": f"Failed to create chat completion: {str(e)}"}
        )