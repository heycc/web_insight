from fastapi import FastAPI, Request as FastAPIRequest
from starlette.middleware.base import BaseHTTPMiddleware
from app import logger
import inspect

class TraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: FastAPIRequest, call_next):
        # Get trace ID from header or generate a new one
        trace_id = request.headers.get("X-Trace-ID")
        trace_id = logger.set_trace_id(trace_id)
        
        # Set request context with method and client info (but not URI)
        logger.set_request_context(
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else "-",
            module=self.__class__.__name__
        )
        
        # Log incoming request with URI in the message and component
        logger.info(f"Request {request.method} {request.url.path}", component=f"{self.__class__.__name__}:Request")
        
        # Process the request and get the response
        try:
            response = await call_next(request)
            # Log response status with URI in the message and component
            logger.info(f"Response {request.method} {request.url.path} - {response.status_code}", 
                       component=f"{self.__class__.__name__}:Response")
        except Exception as e:
            # Log any unhandled exceptions with URI in the message and component
            logger.error(f"Error processing {request.method} {request.url.path}: {str(e)}", 
                        component=f"{self.__class__.__name__}:Error", 
                        exc_info=True)
            raise
        
        # Add trace ID to response headers
        response.headers["X-Trace-ID"] = trace_id
        return response

def setup_middleware(app: FastAPI):
    """Add all middleware to the FastAPI app"""
    app.add_middleware(TraceMiddleware) 