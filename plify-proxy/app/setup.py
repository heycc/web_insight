from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app import logger

def setup_cors(app: FastAPI):
    """Configure CORS middleware for the FastAPI app"""
    origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    origins.append("http://localhost:8000")  # Add FastAPI docs origin

    logger.info(f"Configuring CORS with origins: {origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ) 