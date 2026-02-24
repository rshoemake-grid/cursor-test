import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback

from backend.api import router
from backend.api.websocket_routes import router as ws_router
from backend.api.auth_routes import router as auth_router
from backend.api.template_routes import router as template_router
from backend.api.sharing_routes import router as sharing_router
from backend.api.marketplace_routes import router as marketplace_router
from backend.api.debug_routes import router as debug_router
from backend.api.import_export_routes import router as import_export_router
from backend.api.settings_routes import router as settings_router
from backend.services.settings_service import SettingsService
from backend.api.workflow_chat_routes import router as workflow_chat_router
from backend.database import init_db
from backend.database.db import AsyncSessionLocal
from backend.config import settings
from backend.utils.logger import setup_logging, get_logger

# Set up logging
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    # Startup: Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Load settings into cache
    async with AsyncSessionLocal() as db:
        settings_service = SettingsService()
        await settings_service.load_settings_into_cache(db)
    
    logger.info("Application startup complete")
    yield
    # Shutdown: cleanup if needed
    logger.info("Application shutting down")


# Create FastAPI app
app = FastAPI(
    title="Agentic Workflow Engine",
    description="API for building and executing agentic workflows with collaboration features",
    version="2.0.0 (Phase 4)",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed logging"""
    import json
    errors = exc.errors()
    error_details = []
    for error in errors:
        error_details.append({
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
            "input": str(error.get("input", ""))[:200]  # Truncate long inputs
        })
    
    logger.warning(f"Validation error on {request.method} {request.url.path}: {json.dumps(error_details, indent=2)}")
    
    # Try to get request body if available
    try:
        body = await request.body()
        if body:
            body_str = body.decode('utf-8')[:1000]  # First 1000 chars
            logger.debug(f"Request body preview: {body_str}")
    except Exception as e:
        logger.debug(f"Could not read request body: {e}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": error_details,
            "message": "Validation error - check detail field for specifics"
        }
    )

# Include API routes
app.include_router(router, prefix="/api")  # Main workflow routes (add /api prefix)
app.include_router(ws_router, prefix="/api")  # WebSocket routes

# Phase 4: Authentication & Collaboration routes (already have /api in their prefix)
app.include_router(auth_router)
app.include_router(template_router)
app.include_router(sharing_router)
app.include_router(marketplace_router)
app.include_router(debug_router)
app.include_router(import_export_router)
app.include_router(settings_router)
app.include_router(workflow_chat_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Agentic Workflow Engine API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    )

