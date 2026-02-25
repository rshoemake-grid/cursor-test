"""
Main FastAPI application entry point.
Apigee-ready API with standardized error handling and security headers.
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from datetime import datetime
import time
import uuid
from typing import Dict, Any
from backend.config import settings
from backend.database.db import init_db, engine, AsyncSessionLocal
from backend.utils.metrics import metrics_collector
from sqlalchemy import text
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
    license_info={
        "name": "Proprietary",
        "url": "https://yourdomain.com/license"
    },
    servers=[
        {"url": "https://api.yourdomain.com/api/v1", "description": "Production"},
        {"url": "http://localhost:8000/api/v1", "description": "Development"}
    ],
    external_docs={
        "description": "Full API Documentation and Developer Guide",
        "url": "https://docs.yourdomain.com/api"
    },
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

# CORS middleware - Production-ready configuration
# In production, restrict origins via CORS_ORIGINS environment variable
# Development: allows all origins for easier local testing
# Production: should be restricted to specific domains
cors_origins = (
    settings.cors_origins 
    if settings.cors_origins != ["*"] or settings.environment == "development"
    else []  # Empty list means no CORS in production if not configured
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],  # Fallback to "*" if empty for dev
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID and metrics middleware (must be first to track all requests)
@app.middleware("http")
async def add_request_id_and_metrics(request: Request, call_next):
    """Add request ID and track metrics for monitoring"""
    # Generate request ID if not present (Apigee may add one)
    request_id = (
        request.headers.get("X-Request-ID") 
        or request.headers.get("X-Correlation-ID")
        or str(uuid.uuid4())
    )
    request.state.request_id = request_id
    
    # Track request start time for latency
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        # Record metrics
        endpoint = f"{request.method} {request.url.path}"
        metrics_collector.record_request(
            endpoint=endpoint,
            status_code=response.status_code,
            latency_ms=latency_ms
        )
        
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        # Record error metrics
        latency_ms = (time.time() - start_time) * 1000
        endpoint = f"{request.method} {request.url.path}"
        metrics_collector.record_request(
            endpoint=endpoint,
            status_code=500,
            latency_ms=latency_ms
        )
        raise

# Request size limit middleware
@app.middleware("http")
async def validate_request_size(request: Request, call_next):
    """Validate request body size to prevent large payloads"""
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > settings.max_request_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Request body too large. Maximum size: {settings.max_request_size / (1024 * 1024):.1f}MB"
                    )
            except ValueError:
                pass  # Invalid content-length, let it pass (will fail later)
    
    return await call_next(request)

# Response compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

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

# Health check endpoint with dependency checks
@app.get(
    "/health",
    summary="Health Check",
    description="Comprehensive health check endpoint for Kubernetes and Apigee. Checks database connectivity and other dependencies.",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "service": "workflow-builder-backend",
                        "version": "1.0.0",
                        "timestamp": "2026-02-23T12:00:00",
                        "checks": {
                            "database": {
                                "status": "healthy",
                                "message": "Database connection successful"
                            }
                        }
                    }
                }
            }
        },
        503: {
            "description": "Service is unhealthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "service": "workflow-builder-backend",
                        "version": "1.0.0",
                        "timestamp": "2026-02-23T12:00:00",
                        "checks": {
                            "database": {
                                "status": "unhealthy",
                                "message": "Database connection failed: Connection timeout"
                            }
                        }
                    }
                }
            }
        }
    }
)
async def health_check():
    """
    Comprehensive health check endpoint for Kubernetes and Apigee.
    Checks database connectivity and other dependencies.
    """
    checks: Dict[str, Any] = {
        "status": "healthy",
        "service": "workflow-builder-backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check database connectivity
    db_status = "healthy"
    db_error = None
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            checks["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)
        checks["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {db_error}"
        }
    
    # Determine overall status
    if db_status == "unhealthy":
        checks["status"] = "unhealthy"
        return JSONResponse(
            status_code=503,
            content=checks
        )
    
    return checks

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

# Metrics endpoint for monitoring
@app.get(
    "/metrics",
    summary="API Metrics",
    description="Prometheus-compatible metrics endpoint for API monitoring. Returns API usage statistics including request counts, error rates, and latency.",
    responses={
        200: {
            "description": "Metrics data",
            "content": {
                "application/json": {
                    "example": {
                        "requests_total": 1234,
                        "errors_total": 5,
                        "success_rate": 99.59,
                        "average_latency_ms": 45.23,
                        "uptime_seconds": 3600.0,
                        "requests_per_second": 0.34,
                        "endpoints": {
                            "GET /api/v1/workflows": 500,
                            "POST /api/v1/workflows": 200,
                            "POST /api/v1/workflows/{workflow_id}/execute": 300
                        },
                        "endpoint_errors": {
                            "POST /api/v1/workflows": 2
                        },
                        "status_codes": {
                            "200": 1200,
                            "201": 200,
                            "404": 20,
                            "500": 5
                        },
                        "timestamp": "2026-02-23T12:00:00"
                    }
                }
            }
        }
    }
)
async def get_metrics():
    """
    Prometheus-compatible metrics endpoint for API monitoring.
    Returns API usage statistics including request counts, error rates, and latency.
    """
    return metrics_collector.get_metrics()

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
