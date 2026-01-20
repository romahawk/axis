# backend/main.py (FULL UPDATED)
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
    allow_origins=[
    "http://localhost:5173",
    "https://axis-personal.vercel.app",
    "https://axis-dev.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Persistence paths (MVP)
# -------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data"
TODAY_STATE_PATH = DATA_DIR / "today_state.json"

WEEK_STATE_PATH = DATA_DIR / "week_state.json"
PROJECTS_PATH = DATA_DIR / "projects.json"
RESOURCES_PATH = DATA_DIR / "resources.json"
REALITY_PATH = DATA_DIR / "reality.json"


def save_json(path: Path, data: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def load_json(path: Path, default: dict) -> dict:
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


def _ensure_3_texts(values: list[str], placeholder: str = "—") -> list[str]:
    cleaned: list[str] = []
    for v in values[:3]:
        s = str(v).strip()
        cleaned.append(s if s else placeholder)
    while len(cleaned) < 3:
        cleaned.append(placeholder)
    return cleaned


def _ensure_3_items(items: list[dict], prefix: str, placeholder: str = "—") -> list[dict]:
    """
    Normalize list of dict items to exactly 3 items with stable ids and text fields.
    Keeps existing ids if present; creates if missing.
    """
    out: list[dict] = []
    for i, raw in enumerate(items[:3]):
        if not isinstance(raw, dict):
            raw = {}
        _id = str(raw.get("id") or f"{prefix}{i+1}")
        text = str(raw.get("text", "")).strip() or placeholder
        done = bool(raw.get("done", False))
        out.append({"id": _id, "text": text, "done": done})
    while len(out) < 3:
        i = len(out)
        out.append({"id": f"{prefix}{i+1}", "text": placeholder, "done": False})
    return out


# -------------------------------------------------------------------
# Defaults
# -------------------------------------------------------------------
def _default_today_state() -> dict:
    # v1 canonical structure: { date, top3: [ {id,text,done} x3 ] }
    return {
        "date": date.today().isoformat(),
        "top3": [
            {"id": "t1", "text": "Hardest task first", "done": False},
            {"id": "t2", "text": "Second needle-mover", "done": False},
            {"id": "t3", "text": "Third needle-mover", "done": False},
        ],
        # keep legacy keys optional for backward-compat (not used by dashboard)
        "outcomes": [],
        "actions": [],
        "blockers": [],
    }


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
            {"id": "b2", "text": "—"},
            {"id": "b3", "text": "—"},
        ],
        "anchors": {
            "sleep_5_nights": False,
            "training_4_sessions": False,
            "daily_top3_5_days": False,
            "ai_daily_exposure": False,
        },
    }


def _default_projects() -> dict:
    return {
        "projects": [
            {
                "key": "career",
                "name": "Career / Job Search",
                "is_active": False,
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
                "is_active": False,
                "links": [
                    {"label": "Trello", "url": "https://trello.com/"},
                    {"label": "GitHub", "url": "https://github.com/"},
                ],
            },
            {
                "key": "trading",
                "name": "Trading",
                "is_active": False,
                "links": [{"label": "TradingView", "url": "https://tradingview.com/"}],
            },
        ]
    }


def _default_resources() -> dict:
    return {
        "sections": [
            {"title": "AI", "links": [{"label": "ChatGPT", "url": "https://chat.openai.com/"}]},
            {"title": "Trading", "links": [{"label": "TradingView", "url": "https://tradingview.com/"}]},
            {"title": "Career", "links": [{"label": "LinkedIn", "url": "https://linkedin.com/"}]},
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


# -------------------------------------------------------------------
# Normalizers (manual-first, minimal)
# -------------------------------------------------------------------
def normalize_projects(doc: dict) -> dict:
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


def normalize_week_state(doc: dict) -> dict:
    """
    Ensures:
    - outcomes: exactly 3 {id,text}
    - blockers: exactly 3 {id,text}
    """
    iso = date.today().isocalendar()
    default_week_id = f"{iso.year}-W{iso.week:02d}"

    week_id = str(doc.get("week_id") or default_week_id)
    mode = str(doc.get("mode") or "OFF")

    raw_outcomes = doc.get("outcomes", [])
    if not isinstance(raw_outcomes, list):
        raw_outcomes = []
    outcomes = []
    for i, o in enumerate(raw_outcomes[:3]):
        if not isinstance(o, dict):
            o = {}
        oid = str(o.get("id") or f"w{i+1}")
        text = str(o.get("text", "")).strip() or "—"
        outcomes.append({"id": oid, "text": text})
    while len(outcomes) < 3:
        i = len(outcomes)
        outcomes.append({"id": f"w{i+1}", "text": "—"})

    raw_blockers = doc.get("blockers", [])
    if not isinstance(raw_blockers, list):
        raw_blockers = []
    blockers = []
    for i, b in enumerate(raw_blockers[:3]):
        if not isinstance(b, dict):
            b = {}
        bid = str(b.get("id") or f"b{i+1}")
        text = str(b.get("text", "")).strip() or "—"
        blockers.append({"id": bid, "text": text})
    while len(blockers) < 3:
        i = len(blockers)
        blockers.append({"id": f"b{i+1}", "text": "—"})

    anchors = doc.get("anchors", {})
    if not isinstance(anchors, dict):
        anchors = {}

    return {
        "week_id": week_id,
        "mode": mode,
        "outcomes": outcomes,
        "blockers": blockers,
        "anchors": {
            "sleep_5_nights": bool(anchors.get("sleep_5_nights", False)),
            "training_4_sessions": bool(anchors.get("training_4_sessions", False)),
            "daily_top3_5_days": bool(anchors.get("daily_top3_5_days", False)),
            "ai_daily_exposure": bool(anchors.get("ai_daily_exposure", False)),
        },
    }


def normalize_today_state(doc: dict) -> dict:
    """
    Backward-compatible migration:
    - v1 canonical: { date, top3:[{id,text,done}x3] }
    - if legacy { outcomes:[{id,text,done}...] } exists and top3 missing -> map outcomes -> top3
    - resets done flags when date changes (keeps texts)
    """
    today = date.today().isoformat()
    stored_date = str(doc.get("date") or "")

    # Determine source list for top3
    top3 = doc.get("top3", None)
    if not isinstance(top3, list):
        top3 = None

    if top3 is None:
        legacy_outcomes = doc.get("outcomes", [])
        if isinstance(legacy_outcomes, list) and legacy_outcomes:
            top3_items = _ensure_3_items(legacy_outcomes, prefix="t", placeholder="—")
        else:
            top3_items = _ensure_3_items(_default_today_state()["top3"], prefix="t", placeholder="—")
    else:
        top3_items = _ensure_3_items(top3, prefix="t", placeholder="—")

    # Date rollover: keep texts, reset done=false
    if stored_date != today:
        for it in top3_items:
            it["done"] = False

    # Keep legacy keys (optional)
    actions = doc.get("actions", [])
    blockers = doc.get("blockers", [])
    if not isinstance(actions, list):
        actions = []
    if not isinstance(blockers, list):
        blockers = []

    return {
        "date": today,
        "top3": top3_items,
        # legacy-compatible fields (not required by dashboard)
        "outcomes": doc.get("outcomes", []) if isinstance(doc.get("outcomes", []), list) else [],
        "actions": actions,
        "blockers": blockers,
    }


# -------------------------------------------------------------------
# Load state (and persist normalized)
# -------------------------------------------------------------------
TODAY_STATE = normalize_today_state(load_json(TODAY_STATE_PATH, _default_today_state()))
save_json(TODAY_STATE_PATH, TODAY_STATE)

WEEK_STATE = normalize_week_state(load_json(WEEK_STATE_PATH, _default_week_state()))
save_json(WEEK_STATE_PATH, WEEK_STATE)

PROJECTS = normalize_projects(load_json(PROJECTS_PATH, _default_projects()))
save_json(PROJECTS_PATH, PROJECTS)

RESOURCES = normalize_resources(load_json(RESOURCES_PATH, _default_resources()))
save_json(RESOURCES_PATH, RESOURCES)

REALITY = load_json(REALITY_PATH, _default_reality())


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

    # Axis constraint: max 3 active projects
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
# Week central-column CRUD (Outcomes + Blockers)
# -------------------------------------------------------------------
class WeekOutcomesPut(BaseModel):
    outcomes: list[str]


@app.put("/api/v1/week/outcomes")
def put_week_outcomes(payload: WeekOutcomesPut):
    global WEEK_STATE
    texts = _ensure_3_texts(payload.outcomes, placeholder="—")
    WEEK_STATE["outcomes"] = [
        {"id": "w1", "text": texts[0]},
        {"id": "w2", "text": texts[1]},
        {"id": "w3", "text": texts[2]},
    ]
    save_json(WEEK_STATE_PATH, WEEK_STATE)
    return WEEK_STATE


class WeekBlockersPut(BaseModel):
    blockers: list[str]


@app.put("/api/v1/week/blockers")
def put_week_blockers(payload: WeekBlockersPut):
    global WEEK_STATE
    texts = _ensure_3_texts(payload.blockers, placeholder="—")
    WEEK_STATE["blockers"] = [
        {"id": "b1", "text": texts[0]},
        {"id": "b2", "text": texts[1]},
        {"id": "b3", "text": texts[2]},
    ]
    save_json(WEEK_STATE_PATH, WEEK_STATE)
    return WEEK_STATE


# -------------------------------------------------------------------
# Today central-column CRUD (Top 3)
# -------------------------------------------------------------------
class TodayTop3Put(BaseModel):
    items: list[str]


@app.put("/api/v1/today/top3")
def put_today_top3(payload: TodayTop3Put):
    """
    Sets texts for today's Top 3 (exactly 3 slots).
    Done flags are reset to false for edited slots (simple, predictable).
    """
    global TODAY_STATE
    texts = _ensure_3_texts(payload.items, placeholder="—")

    # Keep ids stable; reset done=false for any update (v1 simplicity)
    TODAY_STATE = normalize_today_state(TODAY_STATE)  # ensure date + structure
    TODAY_STATE["top3"] = [
        {"id": "t1", "text": texts[0], "done": False},
        {"id": "t2", "text": texts[1], "done": False},
        {"id": "t3", "text": texts[2], "done": False},
    ]
    save_json(TODAY_STATE_PATH, TODAY_STATE)
    return TODAY_STATE


class ToggleDone(BaseModel):
    done: bool


@app.patch("/api/v1/today/top3/{item_id}")
def toggle_today_top3(item_id: str, payload: ToggleDone):
    global TODAY_STATE
    TODAY_STATE = normalize_today_state(TODAY_STATE)

    for it in TODAY_STATE.get("top3", []):
        if it.get("id") == item_id:
            it["done"] = payload.done
            save_json(TODAY_STATE_PATH, TODAY_STATE)
            return it

    raise HTTPException(status_code=404, detail="item not found")


# -------------------------------------------------------------------
# Views: Dashboard (Axis v1 one-screen)
# -------------------------------------------------------------------
@app.get("/api/v1/views/dashboard")
def dashboard_view():
    global TODAY_STATE, WEEK_STATE

    # Normalize on read (handles day rollover without extra jobs)
    TODAY_STATE = normalize_today_state(TODAY_STATE)
    WEEK_STATE = normalize_week_state(WEEK_STATE)

    projects = PROJECTS.get("projects", [])
    active = [p for p in projects if p.get("is_active") is True][:3]
    week_active_projects = [
        {
            "id": f"ap_{p.get('key')}",
            "key": p.get("key"),
            "focus": p.get("focus", ""),
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
            "date": TODAY_STATE.get("date", date.today().isoformat()),
            "top3": TODAY_STATE.get("top3", [])[:3],
        },
        "reality": {"commitments": REALITY.get("commitments", [])},
        "projects": projects,
        "resources": RESOURCES.get("sections", [])[:3],
        "drift": drift,
    }


# -------------------------------------------------------------------
# Legacy v0 endpoints (keep for backward compatibility)
# -------------------------------------------------------------------
@app.get("/api/v1/views/today")
def today_view():
    # Return both canonical + legacy keys (safe)
    global TODAY_STATE
    TODAY_STATE = normalize_today_state(TODAY_STATE)
    return TODAY_STATE


@app.patch("/api/v1/views/today/{kind}/{item_id}")
def toggle_today_item(kind: str, item_id: str, payload: ToggleDone):
    """
    Backward-compatible toggle:
    - If kind == "outcomes": toggles Top 3 item (t1/t2/t3) by id match fallback
    - If old outcomes ids are used, we try both top3 and legacy outcomes.
    """
    global TODAY_STATE
    TODAY_STATE = normalize_today_state(TODAY_STATE)

    if kind == "outcomes":
        # Prefer canonical Top 3
        for it in TODAY_STATE.get("top3", []):
            if it.get("id") == item_id:
                it["done"] = payload.done
                save_json(TODAY_STATE_PATH, TODAY_STATE)
                return it

        # Fallback legacy outcomes list (if you still have it)
        legacy = TODAY_STATE.get("outcomes", [])
        if isinstance(legacy, list):
            for it in legacy:
                if isinstance(it, dict) and it.get("id") == item_id:
                    it["done"] = payload.done
                    save_json(TODAY_STATE_PATH, TODAY_STATE)
                    return it

        raise HTTPException(status_code=404, detail="item not found")

    if kind == "actions":
        actions = TODAY_STATE.get("actions", [])
        if isinstance(actions, list):
            for it in actions:
                if isinstance(it, dict) and it.get("id") == item_id:
                    it["done"] = payload.done
                    save_json(TODAY_STATE_PATH, TODAY_STATE)
                    return it
        raise HTTPException(status_code=404, detail="item not found")

    raise HTTPException(status_code=400, detail="kind must be outcomes or actions")
