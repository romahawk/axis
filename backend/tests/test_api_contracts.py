from __future__ import annotations

import importlib
import sys
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    module = importlib.import_module("main")
    module = importlib.reload(module)
    return TestClient(module.app)


def _current_iso_week_id() -> str:
    iso = date.today().isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def test_health_ok(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


def test_dashboard_contract_includes_current_week(client: TestClient) -> None:
    resp = client.get("/api/v1/views/dashboard")
    assert resp.status_code == 200
    payload = resp.json()

    assert "week" in payload
    assert "today" in payload
    assert "projects" in payload
    assert "resources" in payload
    assert payload["week"]["week_id"] == _current_iso_week_id()


def test_today_top3_put_and_toggle(client: TestClient) -> None:
    put_resp = client.put(
        "/api/v1/today/top3",
        json={"items": ["Ship bugfix", "Review PR", "Apply deploy"]},
    )
    assert put_resp.status_code == 200

    patch_resp = client.patch("/api/v1/today/top3/t1", json={"done": True})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["done"] is True

    dashboard = client.get("/api/v1/views/dashboard").json()
    top3 = dashboard["today"]["top3"]
    assert top3[0]["text"] == "Ship bugfix"
    assert top3[0]["done"] is True


def test_journal_daily_create_and_list(client: TestClient) -> None:
    create_resp = client.post(
        "/api/v1/journal/daily",
        json={"wins": ["Fixed week rollover"], "miss": "None", "fix": "Keep tests"},
    )
    assert create_resp.status_code == 200
    entry = create_resp.json()
    assert entry["type"] == "daily"
    assert entry["wins"] == ["Fixed week rollover"]

    list_resp = client.get("/api/v1/journal?limit=50")
    assert list_resp.status_code == 200
    entries = list_resp.json()["entries"]
    assert any(e["id"] == entry["id"] for e in entries)


def test_projects_reject_more_than_three_active(client: TestClient) -> None:
    payload = {
        "projects": [
            {"key": "p1", "name": "P1", "is_active": True, "links": []},
            {"key": "p2", "name": "P2", "is_active": True, "links": []},
            {"key": "p3", "name": "P3", "is_active": True, "links": []},
            {"key": "p4", "name": "P4", "is_active": True, "links": []},
        ]
    }
    resp = client.put("/api/v1/projects", json=payload)
    assert resp.status_code == 400
    assert "Max 3 active projects allowed" in resp.text
