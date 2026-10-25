"""Unit tests for service health and error shape formatting."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint returns service info and documentation links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Canon Governance API"
    assert "version" in data
    assert "docs" in data


def test_health_live():
    """Verify liveness probe returns HTTP 200 and ok status."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_ready_connected(monkeypatch):
    """Verify readiness probe returns connected status when database ping succeeds."""
    from unittest.mock import MagicMock

    from app.core import database

    mock_conn = MagicMock()
    mock_engine = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn
    monkeypatch.setattr(database, "engine", mock_engine)

    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


def test_health_ready_degraded(monkeypatch):
    """Verify readiness probe returns degraded status when database is unreachable."""
    from unittest.mock import MagicMock

    from app.core import database

    mock_engine = MagicMock()
    mock_engine.connect.side_effect = ConnectionError("Could not reach postgres")
    monkeypatch.setattr(database, "engine", mock_engine)

    response = client.get("/api/v1/health/ready")
    data = response.json()
    assert "unavailable" in data["database"]


def test_standard_error_shape_404():
    """Verify unmapped routes return standard error shape conforming to Engineering Standards."""
    response = client.get("/api/v1/nonexistent-route-xyz")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"
    assert "message" in data["error"]
    assert "details" in data["error"]
