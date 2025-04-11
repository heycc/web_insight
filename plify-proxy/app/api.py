from fastapi import APIRouter, Depends, Header, HTTPException
import os
from app.routers import openai
from app import logger

# Create API router for all endpoints
api_router = APIRouter(prefix="/oai")

# API key validation
def validate_api_key(api_key: str = Header(..., description="API key for authentication", alias="X-API-KEY")):
    valid_keys = os.getenv("PROXY_API_KEYS", "").split(",")
    if not valid_keys or api_key not in valid_keys:
        logger.warning(f"Invalid API key attempt: {api_key[:5]}...")
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key"
        )
    return api_key

# Root endpoint
@api_router.get("/")
async def root():
    logger.debug("Root endpoint called")
    return {
        "status": "ok",
        "code": "online",
        "message": "Reddit Insight LLM Proxy Server"
    }

# Health check endpoint
@api_router.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    return {
        "status": "ok",
        "code": "healthy",
        "message": "Service is running normally"
    }

def setup_routers():
    """Configure and return the main API router with all subrouters"""
    # Include OpenAI router under our API router
    api_router.include_router(
        openai.router,
        prefix="/v1",
        dependencies=[Depends(validate_api_key)]
    )
    
    return api_router 