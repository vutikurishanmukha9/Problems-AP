import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_all_175_constituencies(client: AsyncClient):
    response = await client.get("/api/v1/taxonomy/constituencies")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 175
    first = data[0]
    assert first["id"] == 1
    assert first["name"] == "Ichchapuram"
    assert first["mla"] == "Ashok Bendalam Garu"


@pytest.mark.asyncio
async def test_get_all_57_ministries(client: AsyncClient):
    response = await client.get("/api/v1/taxonomy/ministries")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 57
    first = data[0]
    assert first["id"] == 1
    assert first["name"] == "General Administration"
    assert first["minister"] == "N. Chandrababu Naidu Garu"


@pytest.mark.asyncio
async def test_get_all_28_districts(client: AsyncClient):
    response = await client.get("/api/v1/taxonomy/districts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 28
    first = data[0]
    assert first["id"] == 1
    assert first["name"] == "Alluri Sitharama Raju"
    assert first["headquarters"] == "Paderu"


@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient):
    response = await client.get("/api/v1/taxonomy/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10
    cat_ids = [c["id"] for c in data]
    assert "roads" in cat_ids
    assert "water" in cat_ids
    assert "electricity" in cat_ids
