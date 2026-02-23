"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database.db import init_db
from backend.api import router as api_router
from backend.api.auth_routes import router as auth_router
from backend.api.websocket_routes import router as websocket_router
from backend.api.settings_routes import router as settings_router
from backend.api.marketplace_routes import router as marketplace_router
from backend.api.template_routes import router as template_router
from backend.api.sharing_routes import router as sharing_router
from backend.api.import_export_routes import router as import_export_router
from backend.api.workflow_chat_routes import router as workflow_chat_router
from backend.api.debug_routes import router as debug_router

# Create FastAPI app
app = FastAPI(
    title="Agentic Workflow Builder API",
    description="API for the Agentic Workflow Builder application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes"""
    return {
        "status": "healthy",
        "service": "workflow-builder-backend",
        "version": "1.0.0"
    }

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(auth_router)
app.include_router(websocket_router)
app.include_router(settings_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(template_router, prefix="/api")
app.include_router(sharing_router, prefix="/api")
app.include_router(import_export_router, prefix="/api")
app.include_router(workflow_chat_router, prefix="/api")
app.include_router(debug_router, prefix="/api/debug")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    await init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
