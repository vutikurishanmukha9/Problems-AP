"""
Cloudflare Python Worker Entrypoint for Problems@AP Backend
Bridges incoming Cloudflare edge fetch events directly to the FastAPI ASGI application.
"""
from app.main import app

# Export the ASGI app as the primary fetch handler for Cloudflare Workers runtime
fetch = app
