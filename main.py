import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.api import router
from backend.api.websocket_routes import router as ws_router
from backend.api.auth_routes import router as auth_router
from backend.api.template_routes import router as template_router
from backend.api.sharing_routes import router as sharing_router
from backend.api.marketplace_routes import router as marketplace_router
from backend.api.debug_routes import router as debug_router
from backend.api.import_export_routes import router as import_export_router
from backend.api.settings_routes import router as settings_router
from backend.api.workflow_chat_routes import router as workflow_chat_router
from backend.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    # Startup: Initialize database
    await init_db()
    print("Database initialized")
    yield
    # Shutdown: cleanup if needed
    print("Shutting down")


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        host="0.0.0.0",
        port=8000,
        reload=True
    )

