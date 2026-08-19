import asyncio
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_empty_problems_list(client: AsyncClient):
    response = await client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


@pytest.mark.asyncio
async def test_anonymous_problem_submission_and_retrieval(client: AsyncClient):
    payload = {
        "title": "Severe street light blackout near Bus Station",
        "description": "All 12 LED street lights along the RTC Bus Depot link road have failed for two weeks causing safety issues.",
        "category": "street-lights",
        "constituency": "Tirupati",
        "district": "Tirupati",
        "area": "RTC Central Bus Station Link Road",
        "latitude": 13.6288,
        "longitude": 79.4192,
    }
    response = await client.post("/api/v1/problems", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["problem_id"].startswith("AP-2026-")
    assert "confirmation_token" in data

    # Verify problem was created in database and can be queried
    fetch_resp = await client.get(f"/api/v1/problems/{data['problem_id']}")
    assert fetch_resp.status_code == 200
    prob_data = fetch_resp.json()
    assert prob_data["title"] == payload["title"]
    assert prob_data["mla"] == "Arani Srinivasulu Garu"
    assert prob_data["department"] == "Municipal Administration & Urban Development"
    assert len(prob_data["timeline"]) == 1
    assert prob_data["timeline"][0]["status"] == "reported"


@pytest.mark.asyncio
async def test_filter_problems_by_category(client: AsyncClient):
    # Create a road problem
    await client.post(
        "/api/v1/problems",
        json={
            "title": "Road damage on Highway junction",
            "description": "Large potholes near the flyover ramp.",
            "category": "roads",
            "constituency": "Vijayawada East",
            "district": "NTR",
            "area": "Benz Circle",
        },
    )

    response = await client.get("/api/v1/problems?category=roads")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"] == "roads"


@pytest.mark.asyncio
async def test_search_problems_by_keyword(client: AsyncClient):
    await client.post(
        "/api/v1/problems",
        json={
            "title": "Severe waterlogging on Bandar Road junction",
            "description": "Continuous water stagnation near circle.",
            "category": "roads",
            "constituency": "Vijayawada East",
            "district": "NTR",
            "area": "Bandar Road",
        },
    )

    response = await client.get("/api/v1/problems?q=waterlogging")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "waterlogging" in data["items"][0]["title"].lower() or "waterlogging" in data["items"][0]["description"].lower()


@pytest.mark.asyncio
async def test_get_nonexistent_problem_returns_404(client: AsyncClient):
    response = await client.get("/api/v1/problems/AP-NONEXISTENT")
    assert response.status_code == 404
    body = response.json()
    detail = body.get("detail") or str(body)
    assert "not found" in detail.lower()


@pytest.mark.asyncio
async def test_problem_upvote_signal(client: AsyncClient):
    post_res = await client.post(
        "/api/v1/problems",
        json={
            "title": "Transformer spark hazard in Danavaipeta",
            "description": "Frequent sparking causing voltage drop.",
            "category": "power",
            "constituency": "Rajahmundry City",
            "district": "East Godavari",
            "area": "Danavaipeta",
        },
    )
    prob_id = post_res.json()["problem_id"]

    response = await client.post(f"/api/v1/problems/{prob_id}/signal")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["upvotes_count"] == 2  # Initial 1 + 1 = 2


@pytest.mark.asyncio
async def test_concurrent_upvotes_are_atomic(client: AsyncClient):
    post_res = await client.post(
        "/api/v1/problems",
        json={
            "title": "Low voltage in Danavaipeta area",
            "description": "Continuous low voltage across 40 houses.",
            "category": "power",
            "constituency": "Rajahmundry City",
            "district": "East Godavari",
            "area": "Danavaipeta",
        },
    )
    prob_id = post_res.json()["problem_id"]

    # Send 5 concurrent upvotes to the problem
    tasks = [client.post(f"/api/v1/problems/{prob_id}/signal") for _ in range(5)]
    responses = await asyncio.gather(*tasks)

    for resp in responses:
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    # Check final upvote count (initial 1 + 5 = 6)
    fetch_resp = await client.get(f"/api/v1/problems/{prob_id}")
    assert fetch_resp.status_code == 200
    assert fetch_resp.json()["upvotes_count"] == 6
