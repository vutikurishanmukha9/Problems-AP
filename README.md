# Problems@AP

> **Citizen Problem Reporting & Public Grievance Tracking Platform for Andhra Pradesh**
> 
> An independent, open public platform built by citizens to voice, map, and explore public issues across all **175 Assembly Constituencies**, **57 State Ministries**, and **28 Districts** in Andhra Pradesh.

---

## Platform Purpose & Principles

**Problems@AP** is an independent citizen initiative created for ordinary people to share problems affecting their daily life and discover reported issues in their locality.

* **100% Anonymous & Account-Free**: No login, no password, no OTP, no phone number, and no Aadhaar required.
* **Strict 2-Feature Civic Scope**:
  1. **Report a Problem**: Submit public issues (roads, drinking water, drainage, electricity, sanitation, etc.) in under 1 minute with optional in-app GPS Camera evidence and coordinates. Automatically receives an anonymous Reference ID (e.g., `AP-2026-6870`).
  2. **See Reported Problems**: Explore, search, and filter public grievances across 175 assembly constituencies, 57 ministries, and 28 districts on an interactive OpenStreetMap and live rankings table.
* **In-App Civic GPS Camera**: Built-in camera with live WebRTC viewfinder HUD and HTML5 Canvas geotag watermarking. Stamped with accurate coordinates, landmark/mandal, district, and IST timestamp.
* **Respectful Representation**: All public representatives (Ministers and MLAs) are addressed with the respectful **"Garu"** suffix throughout the platform.
* **Transparent Civic Pulse**: Real-time aggregations calculating which ministries, constituencies, and districts have the highest volume of citizen reports.

---

## Key Features & Capabilities

### 1. In-App Civic GPS Camera & Live Geotag Watermarking
* **Hardware Rear-Camera Priority**: Opens directly in the device's back camera by default with camera-switch support.
* **Live Viewfinder Telemetry HUD**: Real-time display of GPS coordinates, signal quality pill, landmark/mandal detection, and live IST clock.
* **Dynamic Canvas Watermarking**: Burns an official translucent footer banner directly onto the photo:
  * **Line 1 (Location):** `[Landmark / Road], [Locality], [District] ([Constituency] A.C.)`
  * **Line 2 (GPS Telemetry):** `GPS: 17.686812° N, 83.218543° E (±4m accuracy)`
  * **Line 3 (Timestamp & Seal):** `28 Aug 2026, 05:15:00 PM IST  ·  Problems@AP Verified Evidence`
* **Clean Typography (Zero Emojis)**: Formal civic presentation suitable for official verification and public sharing.
* **Payload Compression**: Output automatically scales to max $1600\text{px}$ JPEG ($q=0.85$) for rapid mobile uploads ($\sim 300\text{KB}-600\text{KB}$).

### 2. High-Precision Geolocation & Statewide 28-District Matrix
* **Multi-Sample Satellite Lock Engine**: Uses `navigator.geolocation.watchPosition` with `enableHighAccuracy: true` and `maximumAge: 0` to continuously refine satellite accuracy down to $\le 10\text{m}$.
* **Nominatim Zoom-18 Reverse Geocoding**: Resolves exact landmarks, buildings, roads, villages, and mandals.
* **Statewide 28-District Coordinates Matrix**: Embedded official coordinates for all 28 districts with deterministic anti-collision micro-jitter.
* **Offline Resiliency**: Automatically resolves the nearest district mathematically if network geocoding is unavailable.
* **100% Optional Flow**: Citizens can skip GPS and select District and Constituency manually; issues anchor automatically to the district center.

### 3. OpenStreetMap Canvas & Interactive Visualizations
* **Container Lifecycle Management**: Automatic `map.invalidateSize()` calls and `ResizeObserver` lifecycle listeners to eliminate gray or blank tiles.
* **Multi-Subdomain Tile Loading**: Configured with `["a", "b", "c"]` subdomains for high-throughput tile rendering without rate limits.
* **Cluster Markers & Interactive Popups**: Live status badges, citizen voice counts, and direct links to problem details.

### 4. Timezone-Normalized Timestamps
* All timestamps stored in UTC (`datetime.now(timezone.utc)`) and parsed as UTC ISO strings on the client.
* Formatted in Indian Standard Time (`Asia/Kolkata`) with granular relative timestamps (`just now`, `5m ago`, `2h ago`).

---

## State Data & Taxonomy Coverage

The platform contains complete, accurate, 1:1 mapped reference data for Andhra Pradesh:

| Entity | Total Count | Details & Honorifics |
| :--- | :---: | :--- |
| **Assembly Constituencies** | **175** | All 175 assembly seats (Ichchapuram to Kuppam) mapped with elected MLAs (*... Garu*). |
| **State Ministries** | **57** | Complete portfolios mapped to responsible Ministers (*... Garu*). |
| **Districts** | **28** | All state districts mapped with official administrative headquarters and geographic coordinates. |
| **Civic Problem Categories** | **10+** | Direct intelligent routing to responsible government departments (Roads, Water, Drainage, Garbage, Electricity, Street Lights, Transport, Health, Land/Revenue, Education, Environment, etc.). |

---

## Architecture & Technology Stack

Problems@AP is built as a fullstack application with high-contrast civic typography, warm beige styling, and async database aggregations.

### Frontend
* **Framework**: [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router)
* **Build Tool**: [Vite](https://vitejs.dev/) + [Nitro](https://nitro.unjs.io/) (SSR + Cloudflare Worker prebuilt compatibility)
* **Camera & Media**: WebRTC `getUserMedia` + HTML5 Canvas 2D Watermark Burner
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Warm Beige Canvas (`#F5F2EB`), Deep Obsidian Type (`#1C1917`), and Andhra Terracotta (`#C2410C`)
* **Typography**: [`Plus Jakarta Sans`](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Headings/Body) + [`JetBrains Mono`](https://fonts.google.com/specimen/JetBrains+Mono) (Reference IDs, Stats, Coordinates)
* **Maps**: [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) + [OpenStreetMap](https://www.openstreetmap.org/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Quality & Linting**: [Oxlint](https://oxc-project.github.io/) (Anti-Slop Linter) + TypeScript strict mode

### Backend
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
* **Database & ORM**: SQLite with [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/) (`aiosqlite`)
* **File Storage**: [Cloudinary](https://cloudinary.com/) (non-blocking `asyncio.to_thread` uploads with automatic image optimization)
* **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) + `pydantic-settings`
* **Package Manager**: [uv](https://github.com/astral-sh/uv) (ultra-fast Python tooling)
* **Testing**: [Pytest](https://docs.pytest.org/) + `pytest-asyncio` + `httpx`

---

## Codebase Directory Structure

```text
Problems@AP/
├── backend/                        # FastAPI Backend Service
│   ├── app/
│   │   ├── api/v1/                # REST API Endpoints
│   │   │   ├── problems.py        # Problem submission, search & upvote signal
│   │   │   ├── statistics.py      # Real-time department & district rankings
│   │   │   └── taxonomy.py        # Constituencies, ministries & districts
│   │   ├── core/                  # Configuration & Database Seeder
│   │   │   ├── config.py          # CORS & environment settings
│   │   │   ├── database.py        # Async SQLAlchemy session engine
│   │   │   └── seed.py            # Complete 175 MLAs, 57 Ministers & 28 Districts
│   │   ├── models/                # SQLAlchemy ORM Models (Problem, Evidence, Timeline, Taxonomy)
│   │   ├── schemas/               # Pydantic Request/Response Models
│   │   ├── services/              # Cloudinary Storage & Image Processing
│   │   └── main.py                # FastAPI Application & Lifespan handler
│   ├── tests/                     # Automated Test Suite (21/21 passing)
│   ├── pyproject.toml             # Python Dependencies
│   ├── wrangler.toml              # Cloudflare Python Workers Configuration
│   └── README.md
│
├── frontend/                       # TanStack Start / React Application
│   ├── src/
│   │   ├── components/            # Reusable UI Components
│   │   │   ├── gps-camera-modal.tsx # In-App GPS Camera with HUD & Canvas Watermarking
│   │   │   ├── map-canvas.tsx     # Leaflet OpenStreetMap interactive canvas
│   │   │   ├── problem-card.tsx   # Problem card and row components
│   │   │   ├── problem-map.tsx    # SSR-safe dynamic map loader
│   │   │   ├── site-header.tsx    # Responsive navigation & notice bar
│   │   │   ├── site-footer.tsx    # Civic footer & platform disclosures
│   │   │   └── ui-kit.tsx         # Buttons, Cards, Sections design kit
│   │   ├── data/                  # Reference Datasets & Seed Data
│   │   │   ├── constituencies.ts  # 175 Constituencies with MLA Garu
│   │   │   ├── taxonomy.ts        # 57 Ministries, 28 Districts & Coordinates
│   │   │   └── problems.ts        # Problem types, UTC parser & seed dataset
│   │   ├── lib/                   # Utilities & API Client
│   │   │   ├── api-client.ts      # Typed API client for FastAPI backend
│   │   │   └── utils.ts           # CSS class merger (cn)
│   │   ├── routes/                # File-Based TanStack Routes
│   │   │   ├── __root.tsx         # Root layout with Google Fonts
│   │   │   ├── index.tsx          # Homepage with Hero, 2 Core Actions & Stats
│   │   │   ├── explore.tsx        # Search, filter by ministry/MLA/district
│   │   │   ├── report.tsx         # 5-step anonymous problem reporting wizard
│   │   │   ├── departments.tsx    # Complete 57 Ministries & 28 Districts Rankings
│   │   │   ├── map.tsx            # Fullscreen interactive OpenStreetMap view
│   │   │   └── problems.$id.tsx   # Detailed problem view with timeline & voices
│   │   └── styles.css             # High-contrast warm beige design system
│   ├── package.json
│   └── vite.config.ts
│
├── AGENTS.md                      # Platform constraints & specification
└── README.md                      # Project documentation
```

---

## API Endpoints Reference

The FastAPI backend exposes the following RESTful endpoints under `/api/v1`:

### Problems & Citizen Reporting
* `GET /api/v1/problems` — List and filter reported problems (supports `q`, `category`, `department`, `constituency`, `district`, `sort_by`, `page`, `page_size`).
* `POST /api/v1/problems` — Submit a new anonymous citizen problem with district geolocation resolution.
* `POST /api/v1/problems/upload-evidence` — Non-blocking evidence photo upload to Cloudinary storage.
* `GET /api/v1/problems/{problem_id}` — Retrieve detailed problem info, evidence photos, and timeline.
* `POST /api/v1/problems/{problem_id}/upvote` — Register citizen support ("I face this problem too").

### Statistics & Public Rankings
* `GET /api/v1/statistics/overview` — Statewide summary metrics (total problems shared, top ministries).
* `GET /api/v1/statistics/departments` — Live problem counts and load rankings for all 57 ministries.
* `GET /api/v1/statistics/districts` — Problem counts for all 28 districts.
* `GET /api/v1/statistics/constituencies` — Problem counts for all 175 assembly constituencies.

### Taxonomy & Master Data
* `GET /api/v1/taxonomy/constituencies` — Complete list of 175 assembly constituencies with MLA names.
* `GET /api/v1/taxonomy/ministries` — Complete list of 57 ministries with Minister names.
* `GET /api/v1/taxonomy/districts` — Complete list of 28 districts with headquarters and coordinates.

---

## Quickstart & Development Guide

### Prerequisites
* **Node.js**: `v20.0.0+`
* **Python**: `v3.12+`
* **uv**: `pip install uv` (or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

---

### 1. Running the Backend Server

```bash
cd backend

# Install dependencies and sync virtualenv
uv sync

# Run database migrations and seed taxonomy
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* API Base URL: `http://127.0.0.1:8000`
* Interactive OpenAPI Docs (Swagger): `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/api/v1/health`

---

### 2. Running the Frontend App

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

* Frontend Local URL: `http://localhost:8080` (or `http://localhost:8081`)

---

### 3. Running Quality Checks & Tests

```bash
# Run backend pytest suite (21/21 tests)
cd backend
uv run pytest

# Run frontend anti-slop linter (Oxlint)
cd frontend
npm run lint:oxlint

# Run frontend TypeScript type checking
npm run typecheck

# Build frontend for production
npm run build
```

---

## UI & Design Guidelines

Problems@AP adheres to strict civic design standards:
* **No AI Slop / Generic Gradients**: Eliminates distracting blue-purple gradients, artificial glow effects, and fake marketing cards.
* **Warm Beige Canvas (`#F5F2EB`)**: Warm, accessible background paired with pure white cards (`#FFFFFF`) and dark charcoal type (`#1C1917`) for superior legibility.
* **Restrained Andhra Terracotta (`#C2410C`)**: Used selectively on primary action buttons, metrics, and active tags.
* **Fully Responsive**: Mobile-first architecture tested across 320px, 375px, 768px, 1024px, and 1440px+ screens.

---

## Disclaimer

**Problems@AP** is an independent, community-driven civic problem sharing initiative created by normal citizens. It is **not** an official government portal and is **not** affiliated with any government department, political party, or official grievance agency. All public representative names and portfolios are sourced from public records for transparency and routing purposes.
