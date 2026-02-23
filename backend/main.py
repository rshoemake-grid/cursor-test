"""
Main FastAPI application entry point.
Apigee-ready API with standardized error handling and security headers.
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import time
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

# Create FastAPI app with Apigee-friendly metadata
app = FastAPI(
    title="Agentic Workflow Builder API",
    description="API for the Agentic Workflow Builder application",
    version="1.0.0",
    contact={
        "name": "API Support",
        "email": "api-support@yourdomain.com"
    },
    servers=[
        {"url": "https://api.yourdomain.com/api/v1", "description": "Production"},
        {"url": "http://localhost:8000/api/v1", "description": "Development"}
    ],
    openapi_tags=[
        {"name": "workflows", "description": "Workflow management operations"},
        {"name": "executions", "description": "Workflow execution operations"},
        {"name": "Authentication", "description": "User authentication and authorization"},
        {"name": "settings", "description": "LLM provider settings"},
        {"name": "Marketplace", "description": "Workflow marketplace and discovery"},
        {"name": "Templates", "description": "Workflow templates"},
        {"name": "Sharing & Collaboration", "description": "Workflow sharing and versioning"},
        {"name": "Import/Export", "description": "Workflow import and export"},
        {"name": "Workflow Chat", "description": "AI-powered workflow generation"},
        {"name": "debug", "description": "Debug and diagnostic endpoints"}
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and Apigee-compatible headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers and Apigee-compatible headers"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Rate limit headers (Apigee will override with actual values)
    response.headers["X-RateLimit-Limit"] = "1000"
    response.headers["X-RateLimit-Remaining"] = "999"
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 3600)
    
    # Request ID for tracing (preserve if Apigee adds it)
    request_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID")
    if request_id:
        response.headers["X-Request-ID"] = request_id
    
    return response

# Standardized error handler for Apigee compatibility
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standardized error response format for Apigee"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": str(exc.status_code),
                "message": str(exc.detail),
                "path": request.url.path,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes and Apigee"""
    return {
        "status": "healthy",
        "service": "workflow-builder-backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include routers with API versioning for Apigee compatibility
# Version prefix: /api/v1
API_VERSION = "/api/v1"

app.include_router(api_router, prefix=API_VERSION)
app.include_router(auth_router, prefix=API_VERSION)
app.include_router(websocket_router)  # WebSocket doesn't need version prefix
app.include_router(settings_router, prefix=API_VERSION)
app.include_router(marketplace_router, prefix=API_VERSION)
app.include_router(template_router, prefix=API_VERSION)
app.include_router(sharing_router, prefix=API_VERSION)
app.include_router(import_export_router, prefix=API_VERSION)
app.include_router(workflow_chat_router, prefix=API_VERSION)
app.include_router(debug_router, prefix=f"{API_VERSION}/debug")

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
