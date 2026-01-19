from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
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
# Persistence paths (MVP)
# -------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data"
TODAY_STATE_PATH = DATA_DIR / "today_state.json"

# Axis v1 dashboard persistence (simple JSON, manual-first)
WEEK_STATE_PATH = DATA_DIR / "week_state.json"
PROJECTS_PATH = DATA_DIR / "projects.json"
RESOURCES_PATH = DATA_DIR / "resources.json"
REALITY_PATH = DATA_DIR / "reality.json"


def save_json(path: Path, data: dict) -> None:
    """
    Write JSON to disk atomically (best-effort for MVP).
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def load_json(path: Path, default: dict) -> dict:
    """
    Load JSON from disk; if missing/corrupt, write default and return it.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if path.exists():
        try:
            with path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    save_json(path, default)
    return default


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

            if not isinstance(data, dict):
                raise ValueError("today_state.json is not an object")

            data.setdefault("outcomes", [])
            data.setdefault("actions", [])
            data.setdefault("blockers", [])
            return data
        except Exception:
            data = _default_today_state()
            save_today_state(data)
            return data

    data = _default_today_state()
    save_today_state(data)
    return data


def save_today_state(state: dict) -> None:
    save_json(TODAY_STATE_PATH, state)


def _default_week_state() -> dict:
    iso = date.today().isocalendar()
    default_week_id = f"{iso.year}-W{iso.week:02d}"

    return {
        "week_id": default_week_id,
        "mode": "OFF",  # "LOCKED IN" | "OFF"
        "outcomes": [
            {"id": "w1", "text": "Income/Career: ______"},
            {"id": "w2", "text": "AI/Leverage: ______"},
            {"id": "w3", "text": "Health/Stability: ______"},
        ],
        "blockers": [
            {"id": "b1", "text": "—"},
        ],
        "anchors": {
            "sleep_5_nights": False,
            "training_4_sessions": False,
            "daily_top3_5_days": False,
            "ai_daily_exposure": False,
        },
    }


def _default_projects() -> dict:
    # is_active is the single source of truth for "active projects" in v1
    return {
        "projects": [
            {
                "key": "career",
                "name": "Career / Job Search",
                "is_active": True,
                "links": [
                    {"label": "Trello", "url": "https://trello.com/"},
                    {"label": "Docs", "url": "https://docs.google.com/"},
                    {"label": "Gmail", "url": "https://mail.google.com/"},
                    {"label": "Calendar", "url": "https://calendar.google.com/"},
                ],
            },
            {
                "key": "flowlogix",
                "name": "FlowLogix",
                "is_active": True,
                "links": [
                    {"label": "Trello", "url": "https://trello.com/"},
                    {"label": "GitHub", "url": "https://github.com/"},
                ],
            },
            {
                "key": "trading",
                "name": "Trading",
                "is_active": True,
                "links": [
                    {"label": "TradingView", "url": "https://tradingview.com/"},
                ],
            },
        ]
    }


def _default_resources() -> dict:
    return {
        "sections": [
            {
                "title": "AI",
                "links": [{"label": "ChatGPT", "url": "https://chat.openai.com/"}],
            },
            {
                "title": "Trading",
                "links": [{"label": "TradingView", "url": "https://tradingview.com/"}],
            },
            {
                "title": "Career",
                "links": [{"label": "LinkedIn", "url": "https://linkedin.com/"}],
            },
        ]
    }


def _default_reality() -> dict:
    return {
        "commitments": [
            {"id": "c1", "text": "Mon/Wed: Training", "day": "Mon/Wed"},
            {"id": "c2", "text": "Tue: Language class", "day": "Tue"},
            {"id": "c3", "text": "Fri: Family/Admin", "day": "Fri"},
        ]
    }


def normalize_projects(doc: dict) -> dict:
    """
    Minimal normalization:
    - Ensure "projects" is list
    - Ensure each project has key/name/links/is_active
    - Ensure unique keys
    - Keep unknown extra fields as-is (manual-first)
    """
    projects = doc.get("projects", [])
    if not isinstance(projects, list):
        raise ValueError("'projects' must be a list")

    seen = set()
    normalized = []
    for p in projects:
        if not isinstance(p, dict):
            continue
        key = str(p.get("key", "")).strip()
        name = str(p.get("name", "")).strip()
        if not key or not name:
            continue

        if key in seen:
            continue
        seen.add(key)

        links = p.get("links", [])
        if not isinstance(links, list):
            links = []

        norm_links = []
        for l in links:
            if not isinstance(l, dict):
                continue
            label = str(l.get("label", "")).strip()
            url = str(l.get("url", "")).strip()
            if label and url:
                norm_links.append({"label": label, "url": url})

        is_active = bool(p.get("is_active", False))

        # Keep any extra fields but overwrite normalized keys
        pp = dict(p)
        pp["key"] = key
        pp["name"] = name
        pp["links"] = norm_links
        pp["is_active"] = is_active
        normalized.append(pp)

    return {"projects": normalized}


def normalize_resources(doc: dict) -> dict:
    sections = doc.get("sections", [])
    if not isinstance(sections, list):
        raise ValueError("'sections' must be a list")

    norm_sections = []
    for s in sections:
        if not isinstance(s, dict):
            continue
        title = str(s.get("title", "")).strip()
        if not title:
            continue
        links = s.get("links", [])
        if not isinstance(links, list):
            links = []
        norm_links = []
        for l in links:
            if not isinstance(l, dict):
                continue
            label = str(l.get("label", "")).strip()
            url = str(l.get("url", "")).strip()
            if label and url:
                norm_links.append({"label": label, "url": url})
        norm_sections.append({"title": title, "links": norm_links})

    return {"sections": norm_sections}


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

# Dashboard state (Axis v1)
WEEK_STATE = load_json(WEEK_STATE_PATH, _default_week_state())
PROJECTS = normalize_projects(load_json(PROJECTS_PATH, _default_projects()))
RESOURCES = normalize_resources(load_json(RESOURCES_PATH, _default_resources()))
REALITY = load_json(REALITY_PATH, _default_reality())

# Persist normalized docs back (so old projects.json gets upgraded with is_active)
save_json(PROJECTS_PATH, PROJECTS)
save_json(RESOURCES_PATH, RESOURCES)


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
# Projects / Resources (editable)
# -------------------------------------------------------------------
class ProjectsDoc(BaseModel):
    projects: list[dict]


@app.get("/api/v1/projects")
def get_projects():
    return PROJECTS


@app.put("/api/v1/projects")
def put_projects(payload: ProjectsDoc):
    global PROJECTS
    try:
        normalized = normalize_projects({"projects": payload.projects})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Enforce Axis constraint: max 3 active projects (not selector size)
    active_count = sum(1 for p in normalized["projects"] if p.get("is_active"))
    if active_count > 3:
        raise HTTPException(status_code=400, detail="Max 3 active projects allowed")

    PROJECTS = normalized
    save_json(PROJECTS_PATH, PROJECTS)
    return PROJECTS


class ResourcesDoc(BaseModel):
    sections: list[dict]


@app.get("/api/v1/resources")
def get_resources():
    return RESOURCES


@app.put("/api/v1/resources")
def put_resources(payload: ResourcesDoc):
    global RESOURCES
    try:
        normalized = normalize_resources({"sections": payload.sections})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    RESOURCES = normalized
    save_json(RESOURCES_PATH, RESOURCES)
    return RESOURCES


# -------------------------------------------------------------------
# Views: Dashboard (Axis v1 one-screen)
# -------------------------------------------------------------------
@app.get("/api/v1/views/dashboard")
def dashboard_view():
    projects = PROJECTS.get("projects", [])

    # Derive active projects from projects.json (single source of truth)
    active = [p for p in projects if p.get("is_active") is True][:3]
    week_active_projects = [
        {
            "id": f"ap_{p.get('key')}",
            "key": p.get("key"),
            "focus": p.get("focus", ""),  # optional if you later add it
            "url": next((l.get("url") for l in p.get("links", []) if l.get("url")), ""),
        }
        for p in active
    ]

    drift = {
        "too_many_outcomes": len(WEEK_STATE.get("outcomes", [])) > 3,
        "too_many_projects": len([p for p in projects if p.get("is_active")]) > 3,
        "consuming_gt_creating": False,
        "low_energy_3_days": False,
        "tool_tinkering": False,
    }

    return {
        "week": {
            "week_id": WEEK_STATE.get("week_id"),
            "mode": WEEK_STATE.get("mode", "OFF"),
            "outcomes": WEEK_STATE.get("outcomes", [])[:3],
            "active_projects": week_active_projects,
            "blockers": WEEK_STATE.get("blockers", [])[:3],
            "anchors": WEEK_STATE.get("anchors", {}),
        },
        "today": {
            "date": date.today().isoformat(),
            "top3": TODAY_STATE.get("outcomes", [])[:3],
        },
        "reality": {
            "commitments": REALITY.get("commitments", []),
        },
        # NOTE: no explicit cap here; selector can show many
        "projects": projects,
        "resources": RESOURCES.get("sections", [])[:3],
        "drift": drift,
    }


# -------------------------------------------------------------------
# Views: Today / Week (legacy v0 pages; keep for now)
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
