from fastapi import FastAPI
import logging
from dotenv import load_dotenv

# Configure uvicorn and other third-party loggers to be less verbose
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)

from app.middleware import setup_middleware
from app.exception_handlers import setup_exception_handlers
from app.setup import setup_cors
from app.api import setup_routers
from app import logger

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Reddit Insight LLM Proxy",
    description="OpenAI-compatible API proxy for Reddit Insight Chrome extension",
    version="0.1.0"
)

# Setup application components
setup_middleware(app)
setup_cors(app)
setup_exception_handlers(app)

# Include our API router in the main app
app.include_router(setup_routers())

# Log application startup
@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")

# Log application shutdown
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down") 