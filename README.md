# Axis

A lightweight personal control-plane app (Today + Week) with a React frontend and FastAPI backend.

## Repo structure

```
axis/
  frontend/   # Vite + React + TypeScript + Tailwind (v3)
  backend/    # FastAPI (Python) + venv
  docs/
  shared/
```

## Prerequisites

- **Node.js** (LTS recommended) + npm
- **Python 3.10+** (3.11+ recommended)
- Windows: Git Bash or PowerShell are both OK (commands below include Git Bash variants)

---

## Run the app locally

You will run **two processes** in **two terminals**:

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### 1) Start the backend (FastAPI)

Open a terminal in `axis/backend`.

#### Git Bash (recommended)
```bash
cd /d/WORK/IT_Projects/axis/backend
python -m venv .venv
source .venv/Scripts/activate

python -m pip install --upgrade pip
python -m pip install fastapi uvicorn

uvicorn main:app --reload --port 8000
```

#### PowerShell
```powershell
cd D:\WORK\IT_Projects\axis\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
python -m pip install fastapi uvicorn

uvicorn main:app --reload --port 8000
```

✅ Quick backend checks:
- http://localhost:8000/health
- http://localhost:8000/api/v1/auth/me
- http://localhost:8000/api/v1/views/today
- http://localhost:8000/api/v1/views/week

---

### 2) Start the frontend (Vite)

Open a **second** terminal in `axis/frontend`.

```bash
cd /d/WORK/IT_Projects/axis/frontend
npm install
npm run dev
```

Open:
- http://localhost:5173/today
- http://localhost:5173/week

You should see the header show your user (e.g., `RM · primary`) when the backend is running.

---

## Common issues

### Frontend shows “API error”
Backend is not running or not reachable on `http://localhost:8000`.

- Confirm backend terminal shows: `Uvicorn running on http://127.0.0.1:8000`
- Open http://localhost:8000/health

### VS Code shows Pylance “fastapi could not be resolved”
Select the backend venv interpreter:
- `D:\WORK\IT_Projects\axis\backend\.venv\Scripts\python.exe`

### Browser console: “Could not establish connection. Receiving end does not exist.”
Usually caused by a browser extension. Confirm by trying Incognito (extensions off).

---

## Scripts (frontend)

- `npm run dev` — run dev server
- `npm run build` — build production bundle
- `npm run preview` — preview build
