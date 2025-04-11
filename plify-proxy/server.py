import os
import logging
import uvicorn
from dotenv import load_dotenv
from app import logger

# Load environment variables
load_dotenv()

# Configure uvicorn logging
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)

if __name__ == "__main__":
    # Get config from environment or use defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    env = os.getenv("ENVIRONMENT", "development")
    
    # Log startup information
    logger.info(f"Starting server in {env} mode on {host}:{port}")
    
    # Run server with minimal logging
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        access_log=False
    )
    
    # This won't be reached, but for completeness
    logger.info("Server shutdown") 