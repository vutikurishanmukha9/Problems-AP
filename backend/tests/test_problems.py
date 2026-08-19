import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_problems(client: AsyncClient):
    response = await client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5
    # Verify enriched fields (MLA, District HQ, timeline)
    first = data["items"][0]
    assert "id" in first
    assert "title" in first
    assert "timeline" in first


@pytest.mark.asyncio
async def test_filter_problems_by_category(client: AsyncClient):
    response = await client.get("/api/v1/problems?category=roads")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"] == "roads"


@pytest.mark.asyncio
async def test_search_problems_by_keyword(client: AsyncClient):
    response = await client.get("/api/v1/problems?q=waterlogging")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "waterlogging" in data["items"][0]["title"].lower() or "waterlogging" in data["items"][0]["description"].lower()


@pytest.mark.asyncio
async def test_get_single_problem_by_id(client: AsyncClient):
    response = await client.get("/api/v1/problems/AP-2026-0842")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "AP-2026-0842"
    assert data["constituency"] == "Vijayawada East"
    assert data["mla"] == "Gadde Rama Mohan"
    assert data["district"] == "NTR"
    assert data["district_hq"] == "Vijayawada"
    assert len(data["timeline"]) >= 1


@pytest.mark.asyncio
async def test_get_nonexistent_problem_returns_404(client: AsyncClient):
    response = await client.get("/api/v1/problems/AP-NONEXISTENT")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_anonymous_problem_submission(client: AsyncClient):
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
    assert prob_data["mla"] == "Arani Srinivasulu"
    assert prob_data["department"] == "Municipal Administration & Urban Development"
    assert len(prob_data["timeline"]) == 1
    assert prob_data["timeline"][0]["status"] == "reported"


@pytest.mark.asyncio
async def test_problem_upvote_signal(client: AsyncClient):
    response = await client.post("/api/v1/problems/AP-2026-0842/signal")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["upvotes_count"] == 49  # Initial was 48
