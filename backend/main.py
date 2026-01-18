from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Axis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Persistence paths (MVP v0)
# -------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data"
TODAY_STATE_PATH = DATA_DIR / "today_state.json"


def _default_today_state() -> dict:
    return {
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


def load_today_state() -> dict:
    """
    Load TODAY_STATE from disk if present; otherwise create it from defaults.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if TODAY_STATE_PATH.exists():
        try:
            with TODAY_STATE_PATH.open("r", encoding="utf-8") as f:
                data = json.load(f)

            # Minimal validation / fallback (v0)
            if not isinstance(data, dict):
                raise ValueError("today_state.json is not an object")

            data.setdefault("outcomes", [])
            data.setdefault("actions", [])
            data.setdefault("blockers", [])
            return data
        except Exception:
            # If file is corrupted, fall back safely
            data = _default_today_state()
            save_today_state(data)
            return data

    data = _default_today_state()
    save_today_state(data)
    return data


def save_today_state(state: dict) -> None:
    """
    Write TODAY_STATE to disk atomically (best-effort for v0).
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    tmp_path = TODAY_STATE_PATH.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    tmp_path.replace(TODAY_STATE_PATH)


# -------------------------------------------------------------------
# In-memory storage (MVP v0)
# -------------------------------------------------------------------
INBOX_ITEMS = [
    {
        "id": "i1",
        "text": "Idea: add toggles + persistence for Today",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "manual",
    }
]

TODAY_STATE = load_today_state()

# -------------------------------------------------------------------
# Health + Auth
# -------------------------------------------------------------------
@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/v1/auth/me")
def me():
    return {"id": "user_1", "name": "RM", "role": "primary"}


# -------------------------------------------------------------------
# Views: Today / Week
# -------------------------------------------------------------------
@app.get("/api/v1/views/today")
def today_view():
    return {
        "date": date.today().isoformat(),
        "outcomes": TODAY_STATE.get("outcomes", []),
        "actions": TODAY_STATE.get("actions", []),
        "blockers": TODAY_STATE.get("blockers", []),
    }


class ToggleDone(BaseModel):
    done: bool


@app.patch("/api/v1/views/today/{kind}/{item_id}")
def toggle_today_item(kind: str, item_id: str, payload: ToggleDone):
    if kind not in ("outcomes", "actions"):
        return {"error": "kind must be outcomes or actions"}

    items = TODAY_STATE.get(kind, [])
    for it in items:
        if it.get("id") == item_id:
            it["done"] = payload.done
            save_today_state(TODAY_STATE)
            return it

    return {"error": "item not found"}


@app.get("/api/v1/views/week")
def week_view(week: str | None = None):
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


# -------------------------------------------------------------------
# Views: Inbox (GET + POST)
# -------------------------------------------------------------------
@app.get("/api/v1/views/inbox")
def inbox_view():
    items = sorted(INBOX_ITEMS, key=lambda x: x.get("created_at", ""), reverse=True)
    return {"items": items}


class InboxLink(BaseModel):
    url: str
    title: Optional[str] = None


class InboxCreate(BaseModel):
    text: str
    source: Optional[str] = "manual"  # "manual" | "import"
    link: Optional[InboxLink] = None


@app.post("/api/v1/views/inbox", status_code=201)
def inbox_create(payload: InboxCreate):
    text = payload.text.strip()
    item = {
        "id": f"i_{uuid4().hex[:10]}",
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": payload.source or "manual",
    }

    if payload.link:
        item["link"] = {"url": payload.link.url, "title": payload.link.title}

    INBOX_ITEMS.append(item)
    return item
