import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation" in headers.get("Permissions-Policy", "")


@pytest.mark.asyncio
async def test_request_id_and_timing_headers(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time-Ms" in response.headers


@pytest.mark.asyncio
async def test_custom_request_id_propagated(client: AsyncClient):
    custom_id = "test-custom-req-id-12345"
    response = await client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
