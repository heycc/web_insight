import json
import logging
import time
from typing import Any, Dict, List, Optional, AsyncGenerator
import httpx
from fastapi import HTTPException

from ..utils import make_request, get_provider_headers
from ..config import PROVIDER_CONFIGS, ProviderType, REQUEST_TIMEOUT
from .provider import BaseProvider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIProvider(BaseProvider):
    """OpenAI provider implementation."""
    
    def __init__(self):
        self.config = PROVIDER_CONFIGS[ProviderType.OPENAI]
        self.api_key = self.config.api_key
        self.api_endpoint = self.config.api_endpoint
        
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float = 0.7,
        stream: bool = False,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate a chat completion using OpenAI API."""
        if stream:
            return await self.create_streaming_response(
                self.stream_chat_completion(
                    messages, model, temperature, max_tokens, **kwargs
                )
            )
        
        url = f"{self.api_endpoint}/chat/completions"
        headers = get_provider_headers(ProviderType.OPENAI)
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": False
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
            
        # Add any additional parameters
        for key, value in kwargs.items():
            if key not in payload:
                payload[key] = value
        
        response = await make_request(
            url=url,
            headers=headers,
            json_data=payload,
            timeout=REQUEST_TIMEOUT
        )
        
        return response
    
    async def stream_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming chat completion using OpenAI API."""
        url = f"{self.api_endpoint}/chat/completions"
        headers = get_provider_headers(ProviderType.OPENAI)
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
            
        # Add any additional parameters
        for key, value in kwargs.items():
            if key not in payload:
                payload[key] = value
        
        response = await make_request(
            url=url,
            headers=headers,
            json_data=payload,
            timeout=REQUEST_TIMEOUT,
            stream=True
        )
        
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                if line.strip() == "data: [DONE]":
                    break
                    
                yield line
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models from OpenAI."""
        url = f"{self.api_endpoint}/models"
        headers = get_provider_headers(ProviderType.OPENAI)
        
        try:
            response = await make_request(
                url=url,
                method="GET",
                headers=headers,
                timeout=REQUEST_TIMEOUT
            )
            
            return response.get("data", [])
        except Exception as e:
            logger.error(f"Error listing OpenAI models: {str(e)}")
            # Return default models if API call fails
            return [
                {"id": model, "object": "model", "owned_by": "OpenAI"}
                for model in self.config.models
            ]
    
    def format_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Format messages for the OpenAI API (pass-through)."""
        return messages
    
    def format_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Format the OpenAI response (pass-through)."""
        return response 