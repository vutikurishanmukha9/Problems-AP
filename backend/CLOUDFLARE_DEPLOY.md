# Cloudflare Backend Deployment Guide

This guide describes how to deploy the **Problems@AP FastAPI Backend** to **Cloudflare** alongside your existing Render deployment without disturbing Render or Vercel.

---

## Method 1: Cloudflare Python Workers (Serverless Edge)

Cloudflare natively supports Python Workers. The project includes [`wrangler.toml`](./wrangler.toml) and [`entrypoint_cloudflare.py`](./entrypoint_cloudflare.py).

### 1. Prerequisites
Ensure you have Node.js and Wrangler installed:
```bash
npx wrangler login
```

### 2. Set Production Secrets on Cloudflare
From the `backend/` directory, set your secrets (matching your Neon DB and Cloudinary keys):

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put PLATFORM_SECRET_KEY
```

### 3. Deploy to Cloudflare Workers
```bash
npx wrangler deploy
```

Once deployed, Cloudflare will output your live URL (e.g., `https://problems-ap-backend.<your-subdomain>.workers.dev`).

---

## Method 2: Cloudflare Tunnel (`cloudflared`) + Docker Container

If running the container on a VPS, server, or cloud host with Cloudflare edge protection:

### 1. Build and Run Container
```bash
docker build -t problems-ap-backend .
docker run -d -p 8000:8000 --env-file .env --name problems-ap problems-ap-backend
```

### 2. Expose via Cloudflare Tunnel
```bash
cloudflared tunnel run <your-tunnel-name>
```

---

## Note on Architecture
- **Render deployment**: Remains 100% active and untouched at `https://problems-ap.onrender.com`.
- **Vercel frontend**: Remains 100% active and untouched at `https://ap-problems.vercel.app`.
- **Cloudflare deployment**: Operates independently as an additional or fallback backend edge target.
