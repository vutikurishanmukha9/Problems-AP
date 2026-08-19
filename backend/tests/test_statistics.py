import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_state_overview_statistics(client: AsyncClient):
    # Submit one problem
    await client.post(
        "/api/v1/problems",
        json={
            "title": "Road damage test",
            "description": "Potholes on main stretch.",
            "category": "roads",
            "constituency": "Vijayawada East",
            "district": "NTR",
            "area": "Benz Circle",
        },
    )

    response = await client.get("/api/v1/statistics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_problems"] >= 1
    assert data["open_problems"] >= 1
    assert "top_departments_by_load" in data
    assert len(data["top_departments_by_load"]) >= 1


@pytest.mark.asyncio
async def test_departments_statistics_ranking(client: AsyncClient):
    response = await client.get("/api/v1/statistics/departments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 57  # Covers all 57 ministries
    top = data[0]
    assert "department" in top
    assert "minister" in top
    assert "total_problems" in top
    assert "open_problems" in top
    assert "resolved_problems" in top
    assert "resolution_rate_percent" in top


@pytest.mark.asyncio
async def test_constituencies_statistics(client: AsyncClient):
    response = await client.get("/api/v1/statistics/constituencies")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 175  # Covers all 175 constituencies
    first = data[0]
    assert "constituency" in first
    assert "mla" in first
    assert "total_problems" in first


@pytest.mark.asyncio
async def test_districts_statistics(client: AsyncClient):
    response = await client.get("/api/v1/statistics/districts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 28  # Covers all 28 districts
    first = data[0]
    assert "district" in first
    assert "headquarters" in first
    assert "total_problems" in first
