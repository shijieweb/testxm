import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock
import httpx

client = TestClient(app)


class TestHealthCheck:
    def test_health_returns_ok(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestOptimizeProject:
    def test_optimize_returns_structured_result(self):
        resp = client.post("/api/ai/optimize-project", json={
            "name": "TestApp",
            "description": "A test app",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "targetUsers" in data
        assert "coreFunctions" in data
        assert "keyScenarios" in data
        assert "description" in data
        assert isinstance(data["targetUsers"], list)
        assert isinstance(data["coreFunctions"], list)
        assert isinstance(data["keyScenarios"], list)
        assert isinstance(data["description"], str)

    def test_optimize_empty_name(self):
        resp = client.post("/api/ai/optimize-project", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] != ""

    def test_optimize_contains_project_name(self):
        resp = client.post("/api/ai/optimize-project", json={"name": "MyProject"})
        data = resp.json()
        assert "MyProject" in data["description"]

    def test_optimize_with_real_api_config_calls_api(self):
        mock_content = '{"targetUsers":["AI User"],"coreFunctions":["AI Func"],"keyScenarios":["AI Scenario"],"description":"AI generated"}'
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"choices": [{"message": {"content": mock_content}}]}
        mock_resp.raise_for_status.return_value = None
        mock_client = MagicMock()
        mock_client.post.return_value = mock_resp
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)

        with patch("app.logic.httpx.Client", return_value=mock_client):
            resp = client.post("/api/ai/optimize-project", json={
                "name": "RealApiTest",
                "apiUrl": "https://api.openai.com/v1",
                "apiKey": "sk-real-key",
                "modelName": "gpt-4o-mini",
            })

        assert resp.status_code == 200
        data = resp.json()
        assert data["targetUsers"] == ["AI User"]
        assert data["description"] == "AI generated"
        mock_client.post.assert_called_once()
        call_json = mock_client.post.call_args[1]["json"]
        assert call_json["model"] == "gpt-4o-mini"
        assert call_json["messages"][0]["content"].startswith("你是一个产品架构师")

    def test_optimize_with_real_api_falls_back_on_error(self):
        with patch("app.logic.httpx.Client", side_effect=httpx.ConnectError("refused")):
            resp = client.post("/api/ai/optimize-project", json={
                "name": "FallbackTest",
                "apiUrl": "https://bad.example",
                "apiKey": "sk-bad",
            })
        assert resp.status_code == 200
        data = resp.json()
        # Should fall back to template output, not error
        assert "FallbackTest" in data["description"]


class TestTestConnection:
    def test_connection_returns_success_for_valid_config(self):
        resp = client.post("/api/ai/test-connection", json={
            "apiUrl": "http://localhost:99999",
            "apiKey": "sk-any-key",
            "modelName": "gpt-4o-mini",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["success"], bool)
        assert isinstance(data["message"], str)
        # localhost:99999 will fail to connect, so expect failure with a message
        assert data["success"] is False
        assert "连接失败" in data["message"] or "超时" in data["message"] or "错误" in data["message"]

    def test_connection_rejects_missing_api_key(self):
        resp = client.post("/api/ai/test-connection", json={
            "apiUrl": "https://api.openai.com/v1",
            "apiKey": None,
        })
        assert resp.status_code == 422


class TestListProjects:
    def test_list_returns_empty_initially(self):
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        assert resp.json() == []


class TestCreateProject:
    def test_create_returns_project(self):
        resp = client.post("/api/projects", json={
            "name": "New Project",
            "description": "Desc",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "New Project"
        assert "id" in data
        assert "createdAt" in data

    def test_create_with_all_fields(self):
        resp = client.post("/api/projects", json={
            "name": "Full Project",
            "description": "Full desc",
            "vision": "Big vision",
            "targetUsers": ["user1"],
            "coreFunctions": ["func1"],
            "keyScenarios": ["scenario1"],
        })
        data = resp.json()
        assert data["targetUsers"] == ["user1"]
        assert data["coreFunctions"] == ["func1"]
        assert data["keyScenarios"] == ["scenario1"]

    def test_create_and_list(self):
        # Create
        resp = client.post("/api/projects", json={"name": "Only Project"})
        assert resp.status_code == 201
        # List
        projects = client.get("/api/projects").json()
        assert len(projects) >= 1
        names = [p["name"] for p in projects]
        assert "Only Project" in names


class TestDeleteProject:
    def test_delete_existing_project(self):
        # Create first
        resp = client.post("/api/projects", json={"name": "ToDelete"})
        project_id = resp.json()["id"]
        # Delete
        resp = client.delete(f"/api/projects/{project_id}")
        assert resp.status_code == 204
        # Verify gone
        projects = client.get("/api/projects").json()
        assert not any(p["id"] == project_id for p in projects)

    def test_delete_nonexistent_returns_404(self):
        resp = client.delete("/api/projects/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "项目不存在"
