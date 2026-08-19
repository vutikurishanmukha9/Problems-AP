# Problems@AP Backend API

High-performance, asynchronous REST API for the **Problems@AP** citizen grievance and public problem tracking platform across 175 assembly constituencies, 57 ministries, and 28 districts in Andhra Pradesh.

## Features

- **FastAPI 0.115+** with native async support and automatic OpenAPI documentation (`/docs`, `/redoc`).
- **SQLAlchemy 2.0 Async** ORM with SQLite (development) and PostgreSQL ready.
- **Reference Data Pre-seeded**:
  - All 175 Andhra Pradesh Assembly Constituencies & MLA names.
  - All 57 Ministries / Portfolios & Responsible Ministers.
  - All 28 Districts & Official Headquarters.
- **Anonymous Reporting**:
  - No authentication required for citizens to submit grievances.
  - Anonymous tracking token generation.
- **Aggregated Statistics**:
  - State overview, department grievance backlogs, constituency rankings, and district summaries.
- **Automated Test Suite**:
  - Full async pytest test suite verifying health, taxonomy, CRUD, search, filter, and analytics.

## Running Locally

```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Run FastAPI server with auto-reload
python run.py
# Or with uvicorn directly
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation will be accessible at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Running Tests

```bash
pytest -v
```
