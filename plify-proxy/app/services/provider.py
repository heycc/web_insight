from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, AsyncGenerator
import httpx
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

class BaseProvider(ABC):
    """Base class for LLM providers."""
    
    @abstractmethod
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float = 0.7,
        stream: bool = False,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate a chat completion."""
        pass
    
    @abstractmethod
    async def stream_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming chat completion."""
        pass
    
    @abstractmethod
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models."""
        pass
    
    @abstractmethod
    def format_messages(self, messages: List[Dict[str, str]]) -> Any:
        """Format messages for the provider's API."""
        pass
    
    @abstractmethod
    def format_response(self, response: Any) -> Dict[str, Any]:
        """Format the provider's response to OpenAI-compatible format."""
        pass
    
    async def create_streaming_response(self, generator: AsyncGenerator[str, None]) -> StreamingResponse:
        """Create a streaming response from an async generator."""
        async def stream_generator():
            try:
                async for chunk in generator:
                    yield chunk
            except Exception as e:
                yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            finally:
                yield "data: [DONE]\n\n"
                
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream"
        ) 