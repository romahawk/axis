# backend/main.py (FULL UPDATED) — adds Journal MVP endpoints + persistent storage
from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional, Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
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
# IMPORTANT:
# - In production (Fly), mount a volume at /data (recommended), or set DATA_DIR via env.
# - In dev, /data will be created locally if it doesn't exist.
DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
TODAY_STATE_PATH = DATA_DIR / "today_state.json"
WEEK_STATE_PATH = DATA_DIR / "week_state.json"
PROJECTS_PATH = DATA_DIR / "projects.json"
RESOURCES_PATH = DATA_DIR / "resources.json"
REALITY_PATH = DATA_DIR / "reality.json"
JOURNAL_PATH = DATA_DIR / "journal.json"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def save_json(path: Path, data: dict) -> None:
    _ensure_data_dir()
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def load_json_or_none(path: Path) -> Optional[dict]:
    _ensure_data_dir()
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else None
    except Exception:
        # CRITICAL: do NOT overwrite on read failure
        return None


def load_or_init(path: Path, default_factory) -> dict:
    """
    Load dict from json if present and readable; otherwise initialize with defaults and save once.
    """
    existing = load_json_or_none(path)
    if existing is not None:
        return existing
    doc = default_factory()
    save_json(path, doc)
    return doc


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


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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
        # legacy keys optional
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


def _default_journal() -> dict:
    return {"entries": []}


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
    today = date.today().isoformat()
    stored_date = str(doc.get("date") or "")

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

    if stored_date != today:
        for it in top3_items:
            it["done"] = False

    actions = doc.get("actions", [])
    blockers = doc.get("blockers", [])
    if not isinstance(actions, list):
        actions = []
    if not isinstance(blockers, list):
        blockers = []

    return {
        "date": today,
        "top3": top3_items,
        "outcomes": doc.get("outcomes", []) if isinstance(doc.get("outcomes", []), list) else [],
        "actions": actions,
        "blockers": blockers,
    }


def normalize_journal(doc: dict) -> dict:
    """
    Keeps only:
    - entries: list[dict]
    Does not validate deep schema (MVP). Ensures list type.
    """
    entries = doc.get("entries", [])
    if not isinstance(entries, list):
        entries = []
    # keep only dict entries
    entries = [e for e in entries if isinstance(e, dict)]
    return {"entries": entries}


# -------------------------------------------------------------------
# Load state (safe init)
# -------------------------------------------------------------------
TODAY_STATE = normalize_today_state(load_or_init(TODAY_STATE_PATH, _default_today_state))
WEEK_STATE = normalize_week_state(load_or_init(WEEK_STATE_PATH, _default_week_state))
PROJECTS = normalize_projects(load_or_init(PROJECTS_PATH, _default_projects))
RESOURCES = normalize_resources(load_or_init(RESOURCES_PATH, _default_resources))
REALITY = load_or_init(REALITY_PATH, _default_reality)
JOURNAL = normalize_journal(load_or_init(JOURNAL_PATH, _default_journal))


def _snapshot_now() -> dict:
    """
    Snapshot current state for journal entries.
    Keep it compact; frontend can render collapsible sections.
    """
    global TODAY_STATE, WEEK_STATE

    TODAY_STATE = normalize_today_state(TODAY_STATE)
    WEEK_STATE = normalize_week_state(WEEK_STATE)

    projects = PROJECTS.get("projects", [])
    active = [p for p in projects if p.get("is_active") is True][:3]

    return {
        "today": {
            "date": TODAY_STATE.get("date"),
            "top3": TODAY_STATE.get("top3", [])[:3],
        },
        "week": {
            "week_id": WEEK_STATE.get("week_id"),
            "mode": WEEK_STATE.get("mode", "OFF"),
            "outcomes": WEEK_STATE.get("outcomes", [])[:3],
            "blockers": WEEK_STATE.get("blockers", [])[:3],
            "anchors": WEEK_STATE.get("anchors", {}),
            "active_projects": [
                {
                    "key": p.get("key"),
                    "name": p.get("name"),
                    "links": p.get("links", []),
                }
                for p in active
            ],
        },
        "projects": projects,
    }


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
# Week CRUD (Outcomes + Blockers)
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
# Today CRUD (Top 3)
# -------------------------------------------------------------------
class TodayTop3Put(BaseModel):
    items: list[str]


@app.put("/api/v1/today/top3")
def put_today_top3(payload: TodayTop3Put):
    global TODAY_STATE
    texts = _ensure_3_texts(payload.items, placeholder="—")

    TODAY_STATE = normalize_today_state(TODAY_STATE)
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
# Journal (MVP): Daily Closeout + Weekly Review + Timeline
# -------------------------------------------------------------------
JournalType = Literal["daily", "weekly"]


class DailyCloseoutIn(BaseModel):
    wins: list[str] = []
    miss: str = ""
    fix: str = ""


class WeeklyOutcomeResultIn(BaseModel):
    id: str
    achieved: bool = False
    note: str = ""


class WeeklyReviewIn(BaseModel):
    outcomes: list[WeeklyOutcomeResultIn] = []
    constraint: str = ""
    decision: str = ""
    next_focus: str = ""


def _append_journal_entry(entry: dict) -> dict:
    global JOURNAL
    JOURNAL = normalize_journal(JOURNAL)
    entries = JOURNAL.get("entries", [])
    entries.append(entry)
    JOURNAL["entries"] = entries
    save_json(JOURNAL_PATH, JOURNAL)
    return entry

def _clean_wins(wins: list[str]) -> list[str]:
    cleaned = [str(w).strip() for w in (wins or []) if str(w).strip()]
    return cleaned[:3]


def _find_entry_index(entries: list[dict], entry_id: str) -> int:
    for i, e in enumerate(entries):
        if isinstance(e, dict) and e.get("id") == entry_id:
            return i
    return -1

@app.get("/api/v1/journal")
def list_journal(
    limit: int = Query(50, ge=1, le=200),
    type: Optional[JournalType] = Query(None),
):
    global JOURNAL
    JOURNAL = normalize_journal(JOURNAL)
    entries = JOURNAL.get("entries", [])

    if type:
        entries = [e for e in entries if e.get("type") == type]

    # newest first
    entries = list(reversed(entries))[:limit]
    return {"entries": entries, "limit": limit, "type": type}


@app.post("/api/v1/journal/daily")
def create_daily_closeout(payload: DailyCloseoutIn):
    wins = [str(w).strip() for w in (payload.wins or []) if str(w).strip()]
    wins = wins[:3]  # keep it tight
    miss = str(payload.miss or "").strip()
    fix = str(payload.fix or "").strip()

    entry = {
        "id": str(uuid4()),
        "type": "daily",
        "created_at": _utc_now_iso(),
        "date": date.today().isoformat(),
        "wins": wins,
        "miss": miss,
        "fix": fix,
        "snapshot": _snapshot_now(),
    }
    return _append_journal_entry(entry)


@app.post("/api/v1/journal/weekly")
def create_weekly_review(payload: WeeklyReviewIn):
    global WEEK_STATE
    WEEK_STATE = normalize_week_state(WEEK_STATE)

    norm_outcomes = []
    for o in payload.outcomes or []:
        norm_outcomes.append(
            {"id": str(o.id), "achieved": bool(o.achieved), "note": str(o.note or "").strip()}
        )

    entry = {
        "id": str(uuid4()),
        "type": "weekly",
        "created_at": _utc_now_iso(),
        "week_id": WEEK_STATE.get("week_id", date.today().isoformat()),
        "outcomes": norm_outcomes,
        "constraint": str(payload.constraint or "").strip(),
        "decision": str(payload.decision or "").strip(),
        "next_focus": str(payload.next_focus or "").strip(),
        "snapshot": _snapshot_now(),
    }
    return _append_journal_entry(entry)


@app.get("/api/v1/journal/{entry_id}")
def get_journal_entry(entry_id: str):
    """
    Optional endpoint (useful for later). Kept lightweight.
    """
    global JOURNAL
    JOURNAL = normalize_journal(JOURNAL)
    for e in JOURNAL.get("entries", []):
        if e.get("id") == entry_id:
            return e
    raise HTTPException(status_code=404, detail="entry not found")

@app.patch("/api/v1/journal/{entry_id}")
def patch_journal_entry(entry_id: str, payload: dict):
    """
    Updates only mutable fields.
    Immutable: id, type, created_at, date/week_id, snapshot.
    Daily: wins, miss, fix
    Weekly: outcomes, constraint, decision, next_focus
    """
    global JOURNAL
    JOURNAL = normalize_journal(JOURNAL)
    entries = JOURNAL.get("entries", [])

    idx = _find_entry_index(entries, entry_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="entry not found")

    entry = entries[idx]
    etype = entry.get("type")

    # Defensive: enforce dict payload
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload must be an object")

    if etype == "daily":
        # Validate via pydantic
        patch = DailyCloseoutPatch(**payload)

        if patch.wins is not None:
            entry["wins"] = _clean_wins(patch.wins)

        if patch.miss is not None:
            entry["miss"] = str(patch.miss).strip()

        if patch.fix is not None:
            entry["fix"] = str(patch.fix).strip()

    elif etype == "weekly":
        patch = WeeklyReviewPatch(**payload)

        if patch.outcomes is not None:
            norm_outcomes = []
            for o in patch.outcomes:
                norm_outcomes.append(
                    {
                        "id": str(o.id),
                        "achieved": bool(o.achieved),
                        "note": str(o.note or "").strip(),
                    }
                )
            entry["outcomes"] = norm_outcomes

        if patch.constraint is not None:
            entry["constraint"] = str(patch.constraint).strip()

        if patch.decision is not None:
            entry["decision"] = str(patch.decision).strip()

        if patch.next_focus is not None:
            entry["next_focus"] = str(patch.next_focus).strip()

    else:
        raise HTTPException(status_code=400, detail="unsupported entry type")

    # Persist
    entries[idx] = entry
    JOURNAL["entries"] = entries
    save_json(JOURNAL_PATH, JOURNAL)
    return entry


@app.delete("/api/v1/journal/{entry_id}")
def delete_journal_entry(entry_id: str):
    """
    Deletes an entry permanently (MVP).
    """
    global JOURNAL
    JOURNAL = normalize_journal(JOURNAL)
    entries = JOURNAL.get("entries", [])

    idx = _find_entry_index(entries, entry_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="entry not found")

    deleted = entries.pop(idx)
    JOURNAL["entries"] = entries
    save_json(JOURNAL_PATH, JOURNAL)

    return {"ok": True, "deleted_id": entry_id, "deleted_type": deleted.get("type")}


# -------------------------------------------------------------------
# Views: Dashboard (Axis v1 one-screen)
# -------------------------------------------------------------------
@app.get("/api/v1/views/dashboard")
def dashboard_view():
    global TODAY_STATE, WEEK_STATE

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
    global TODAY_STATE
    TODAY_STATE = normalize_today_state(TODAY_STATE)
    return TODAY_STATE


@app.patch("/api/v1/views/today/{kind}/{item_id}")
def toggle_today_item(kind: str, item_id: str, payload: ToggleDone):
    global TODAY_STATE
    TODAY_STATE = normalize_today_state(TODAY_STATE)

    if kind == "outcomes":
        for it in TODAY_STATE.get("top3", []):
            if it.get("id") == item_id:
                it["done"] = payload.done
                save_json(TODAY_STATE_PATH, TODAY_STATE)
                return it

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
