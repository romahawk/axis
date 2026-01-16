from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date

app = FastAPI(title="Axis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/v1/auth/me")
def me():
    return {
        "id": "user_1",
        "name": "RM",
        "role": "primary",
    }

@app.get("/api/v1/views/today")
def today_view():
    # MVP v0: hardcoded payload (no DB yet)
    return {
        "date": date.today().isoformat(),
        "outcomes": [
            {"id": "o1", "text": "Run Axis daily (Today + Week)", "done": False},
            {"id": "o2", "text": "Ship Today view vertical slice", "done": True},
            {"id": "o3", "text": "Plan next sprint (Week view)", "done": False},
        ],
        "actions": [
            {"id": "a1", "text": "Start backend (FastAPI) + CORS", "done": True},
            {"id": "a2", "text": "Connect frontend to /auth/me", "done": True},
            {"id": "a3", "text": "Render Today view from API", "done": False},
        ],
        "blockers": [
            {"id": "b1", "text": "None (baseline stable)"},
        ],
    }