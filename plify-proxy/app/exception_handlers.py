from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app import logger

def setup_exception_handlers(app: FastAPI):
    """Configure exception handlers for the FastAPI app"""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        """Handle validation errors with standard error format"""
        errors = exc.errors()
        error_detail = errors[0] if errors else {"msg": "Validation error"}
        error_msg = error_detail.get("msg", "Validation error")
        
        # Add more details to the error message for debugging
        if errors:
            error_loc = ".".join(str(loc) for loc in error_detail.get("loc", []))
            error_type = error_detail.get("type", "unknown")
            error_msg = f"{error_msg} at {error_loc} (type: {error_type})"
        
        logger.error(f"Validation error: {error_msg}")
        logger.debug(f"Full validation error details: {errors}")
        
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "code": "validation_error",
                "message": error_msg
            }
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        """Handle HTTP exceptions with standard error format"""
        logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "code": str(exc.status_code),
                "message": str(exc.detail)
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc):
        logger.critical(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "code": "internal_error",
                "message": str(exc)
            }
        ) 