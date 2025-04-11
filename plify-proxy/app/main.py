from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from typing import List, Optional

from .routers import openai

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Reddit Insight LLM Proxy",
    description="OpenAI-compatible API proxy for Reddit Insight Chrome extension",
    version="0.1.0",
    root_path="/oai"
)

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
origins.append("http://localhost:8000")  # Add FastAPI docs origin

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key validation
def validate_api_key(api_key: str = Header(..., description="API key for authentication")):
    valid_keys = os.getenv("PROXY_API_KEYS", "").split(",")
    if not valid_keys or api_key not in valid_keys:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    return api_key

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Reddit Insight LLM Proxy Server",
        "status": "online"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(
    openai.router,
    prefix="/v1",
    dependencies=[Depends(validate_api_key)]
)

# Error handler
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": {"message": str(exc), "type": "internal_server_error"}}
    ) 