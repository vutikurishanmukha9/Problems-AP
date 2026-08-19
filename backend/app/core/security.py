import html
import logging
import re
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger("problems_ap.security")

# Rate limit buckets: ip -> list of timestamps
_request_history: Dict[str, List[float]] = defaultdict(list)
_write_history: Dict[str, List[float]] = defaultdict(list)

# Limits per minute (60 seconds window)
MAX_READS_PER_MINUTE = 120
MAX_WRITES_PER_MINUTE = 15


def clean_stale_history(history: Dict[str, List[float]], now: float, window_seconds: float = 60.0) -> None:
    """Prunes timestamps older than the sliding window to prevent memory leaks."""
    cutoff = now - window_seconds
    for ip in list(history.keys()):
        valid_ts = [t for t in history[ip] if t > cutoff]
        if valid_ts:
            history[ip] = valid_ts
        else:
            del history[ip]


def sanitize_input(text: str) -> str:
    """Sanitizes text by escaping HTML special characters to prevent Stored XSS injection."""
    if not text:
        return ""
    # Strip dangerous HTML tags
    cleaned = re.sub(r"<(script|iframe|object|embed|style)[^>]*>.*?</\1>", "", text, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    return html.escape(cleaned.strip())


class RateLimiterAndOriginGuardMiddleware(BaseHTTPMiddleware):
    """Enforces strict per-IP rate limiting, payload security, and CORS/Origin enforcement."""

    async def dispatch(self, request: Request, call_next):
        # 1. Skip rate limits for health checks and OPTIONS preflight
        if request.url.path in ["/api/v1/health", "/health", "/"] or request.method == "OPTIONS":
            return await call_next(request)

        # 2. Extract Client IP
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

        now = time.time()

        # 3. Check Write Rate Limits (POST, PUT, DELETE, PATCH)
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            clean_stale_history(_write_history, now, window_seconds=60.0)
            user_writes = _write_history[client_ip]

            if len(user_writes) >= MAX_WRITES_PER_MINUTE:
                logger.warning("Write rate limit exceeded for IP %s on %s %s", client_ip, request.method, request.url.path)
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests. Please wait a minute before submitting again.",
                        }
                    },
                    headers={"Retry-After": "60"},
                )
            _write_history[client_ip].append(now)

        # 4. Check General Request Rate Limits
        clean_stale_history(_request_history, now, window_seconds=60.0)
        user_requests = _request_history[client_ip]

        if len(user_requests) >= MAX_READS_PER_MINUTE:
            logger.warning("General rate limit exceeded for IP %s on %s %s", client_ip, request.method, request.url.path)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Request rate limit exceeded. Please slow down.",
                    }
                },
                headers={"Retry-After": "30"},
            )
        _request_history[client_ip].append(now)

        # 5. Production Origin Validation for write requests
        if settings.ENVIRONMENT == "production" and request.method in ["POST", "PUT", "DELETE"]:
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            
            allowed_origins = [o.rstrip("/") for o in settings.CORS_ORIGINS if o != "*"]
            
            is_valid_origin = (
                (origin and any(origin.rstrip("/").startswith(ao) for ao in allowed_origins))
                or (referer and any(referer.rstrip("/").startswith(ao) for ao in allowed_origins))
                or request.headers.get("x-ap-platform-key") == settings.PLATFORM_SECRET_KEY
            )
            
            if not is_valid_origin:
                logger.warning("Blocked untrusted cross-site write request from origin: %s, referer: %s", origin, referer)
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": {
                            "code": "FORBIDDEN_ORIGIN",
                            "message": "Access denied. Request originated from an untrusted client domain.",
                        }
                    },
                )

        response: Response = await call_next(request)

        # 6. Strip identifying server information
        if "server" in response.headers:
            del response.headers["server"]

        return response
