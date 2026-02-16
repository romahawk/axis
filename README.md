# Axis

Personal execution control-plane app (single dashboard + review drawer).

## Repo structure

```text
axis/
  frontend/   # Vite + React + TypeScript + Tailwind
  backend/    # FastAPI
  docs/
  shared/
```

## Prerequisites

- Node.js (LTS) + npm
- Python 3.10+ (3.11 recommended)

## Run locally

Run backend and frontend in two terminals.

### 1) Backend (FastAPI)

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Quick checks:

- `http://localhost:8000/health`
- `http://localhost:8000/api/v1/auth/me`
- `http://localhost:8000/api/v1/views/dashboard`

### 2) Frontend (Vite)

From `frontend/`:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:5173`

Note:

- Current app is a single dashboard shell (no `/today` or `/week` routes).

## Environment variables

Frontend uses `VITE_API_BASE_URL`:

- Dev default: `http://localhost:8000`
- Production: must be set (for example in Vercel project settings)

Backend persistence:

- Data directory defaults to `/data`
- Can be overridden with `DATA_DIR`

## Deployment notes

- Frontend can be deployed on Vercel.
- Backend is deployed on Fly (`backend-summer-dawn-9746`).
- Vercel must point `VITE_API_BASE_URL` to the active backend URL.

If production shows stale backend behavior, redeploy Fly backend:

```bash
cd backend
flyctl deploy --remote-only
```

## Troubleshooting

### Frontend shows `API error`

- Confirm backend is running/reachable.
- Verify frontend `VITE_API_BASE_URL` points to correct backend.

### Console shows `Maximum update depth exceeded`

- Ensure latest frontend commit is deployed (includes Projects Router loop fix).

### Browser console noise like `Could not establish connection...`

- Often extension/browser-injected script noise, not app runtime.

## Backend tests

From `backend/`:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest tests -q
```
