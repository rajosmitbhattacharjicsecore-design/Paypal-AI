from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_dashboard_shape():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "receivables" in data
    assert "data_mode" in data
