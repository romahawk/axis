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

@app.get("/api/v1/views/week")
def week_view(week: str | None = None):
    # MVP v0: hardcoded payload
    # week format: "YYYY-Www" (optional). If omitted, return a placeholder current-week value.
    current_week = date.today().isocalendar()
    default_week = f"{current_week.year}-W{current_week.week:02d}"

    return {
        "week": week or default_week,
        "focus": [
            {"id": "f1", "text": "Use Axis daily (Today + Week)"},
            {"id": "f2", "text": "Ship Week view v0"},
        ],
        "commitments": [
            {
                "id": "c1",
                "text": "Plan Sprint 1 tasks",
                "domain": "product",
                "status": "doing",
                "trello": {"url": "https://trello.com/"},
            },
            {"id": "c2", "text": "2 gym sessions", "domain": "health", "status": "planned"},
        ],
        "constraints": [
            {"id": "k1", "text": "German lesson — Mon 18:15"},
            {"id": "k2", "text": "Basketball — Fri 20:30"},
        ],
        "notes": "Keep load realistic; no new side quests.",
    }
