import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.seed import seed_database

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("problems_ap.api")

# Max request body size (5 MB)
MAX_REQUEST_BODY_BYTES = 5 * 1024 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan context."""
    logger.info("Initializing database schema and seed data...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session)
    logger.info("Database initialized successfully.")

    yield

    logger.info("Disposing database connections...")
    await engine.dispose()
    logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Public grievance and citizen problem reporting platform for Andhra Pradesh across 175 assembly constituencies and 57 ministries.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies OWASP-recommended defensive security headers to all HTTP responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        return response


class RequestCorrelationAndTimingMiddleware(BaseHTTPMiddleware):
    """Injects correlation IDs, measures processing duration, and structured logs request metrics."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.perf_counter()

        response: Response = await call_next(request)

        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(process_time_ms)

        logger.info(
            "%s %s -> %d in %sms [req_id=%s]",
            request.method,
            request.url.path,
            response.status_code,
            process_time_ms,
            request_id,
        )
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Guards endpoints against excessively large request payloads."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "error": {
                        "code": "PAYLOAD_TOO_LARGE",
                        "message": f"Request body exceeds max limit of {MAX_REQUEST_BODY_BYTES // (1024*1024)}MB",
                    }
                },
            )
        return await call_next(request)


# Register middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestCorrelationAndTimingMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Safe global error handler preventing internal leakage in production."""
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": str(exc),
                    "type": type(exc).__name__,
                }
            },
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
            }
        },
    )


# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    """Root metadata and API service status."""
    return {
        "service": "Problems@AP API",
        "version": settings.VERSION,
        "docs": "/docs",
        "endpoints": {
            "health": f"{settings.API_V1_STR}/health",
            "taxonomy": f"{settings.API_V1_STR}/taxonomy",
            "problems": f"{settings.API_V1_STR}/problems",
            "statistics": f"{settings.API_V1_STR}/statistics",
        },
    }
