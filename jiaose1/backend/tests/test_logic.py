"""Backend unit tests — pure logic (no HTTP dependency)."""
import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.logic import (
    optimize_project,
    build_project,
    delete_project,
    list_projects,
    validate_project_input,
    validate_ai_connection,
    _parse_ai_json,
)
from app.models import Project


class TestOptimizeProject:
    """Pure function tests for AI optimize logic."""

    def test_returns_target_users(self):
        result = optimize_project(name="TestApp")
        assert isinstance(result.targetUsers, list)
        assert len(result.targetUsers) > 0
        assert "TestApp" in result.targetUsers[0]

    def test_returns_core_functions(self):
        result = optimize_project(name="TestApp")
        assert isinstance(result.coreFunctions, list)
        assert "需求管理" in result.coreFunctions

    def test_returns_key_scenarios(self):
        result = optimize_project(name="TestApp")
        assert isinstance(result.keyScenarios, list)
        assert len(result.keyScenarios) == 4

    def test_description_contains_name(self):
        result = optimize_project(name="MyTool")
        assert "MyTool" in result.description

    def test_empty_name_fallback(self):
        result = optimize_project(name="")
        assert "新项目" in result.description

    def test_with_custom_vision(self):
        result = optimize_project(name="App", vision="Build the future")
        assert "App" in result.description

    def test_all_fields_present(self):
        result = optimize_project(name="X")
        assert hasattr(result, "targetUsers")
        assert hasattr(result, "coreFunctions")
        assert hasattr(result, "keyScenarios")
        assert hasattr(result, "description")


class TestOptimizeProjectWithRealApi:
    """Tests for optimize_project when real API credentials are provided."""

    def _make_mock(self, status_code: int, text: str = "") -> tuple[MagicMock, MagicMock]:
        mock_resp = MagicMock()
        mock_resp.status_code = status_code
        mock_resp.text = text
        mock_resp.json.return_value = {"choices": [{"message": {"content": text}}]}
        mock_resp.raise_for_status.return_value = None
        mock_client = MagicMock()
        mock_client.post.return_value = mock_resp
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        return mock_resp, mock_client

    def test_calls_real_api_when_config_provided(self):
        _, mock_client = self._make_mock(200, '{"targetUsers":["A"],"coreFunctions":["B"],"keyScenarios":["C"],"description":"D"}')
        with patch("app.logic.httpx.Client", return_value=mock_client):
            result = optimize_project(name="RealApp", api_url="https://api.test.com", api_key="sk-key")
        assert result.description == "D"
        assert result.targetUsers == ["A"]
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert "/chat/completions" in call_args[0][0]
        assert call_args[1]["json"]["model"] == "gpt-4o-mini"

    def test_falls_back_to_template_on_api_error(self):
        with patch("app.logic.httpx.Client", side_effect=httpx.ConnectError("refused")):
            result = optimize_project(name="FallbackApp", api_url="https://bad.example", api_key="sk-key")
        assert "FallbackApp" in result.description
        assert isinstance(result.targetUsers, list)

    def test_custom_model_name_passed_to_api(self):
        _, mock_client = self._make_mock(200, '{"targetUsers":[],"coreFunctions":[],"keyScenarios":[],"description":""}')
        with patch("app.logic.httpx.Client", return_value=mock_client):
            optimize_project(name="X", api_url="https://api.test.com", api_key="sk-k", model_name="deepseek-chat")
        call_json = mock_client.post.call_args[1]["json"]
        assert call_json["model"] == "deepseek-chat"

    def test_no_api_call_without_credentials(self):
        result = optimize_project(name="NoCreds")
        assert "NoCreds" in result.description
        # Should use template, not try to call any API


class TestParseAiJson:
    """Tests for the JSON parser used to extract AI responses."""

    def test_parses_plain_json(self):
        result = _parse_ai_json('{"targetUsers":["A"],"coreFunctions":["B"],"keyScenarios":["C"],"description":"D"}')
        assert result["targetUsers"] == ["A"]
        assert result["description"] == "D"

    def test_strips_markdown_code_fences(self):
        text = '```json\n{"targetUsers":["X"],"coreFunctions":[],"keyScenarios":[],"description":"ok"}\n```'
        result = _parse_ai_json(text)
        assert result["description"] == "ok"

    def test_strips_plain_code_fences(self):
        text = '```\n{"targetUsers":[],"coreFunctions":[],"keyScenarios":[],"description":"plain"}\n```'
        result = _parse_ai_json(text)
        assert result["description"] == "plain"


class TestBuildProject:
    """Pure function tests for project construction."""

    def test_minimal_input_uses_defaults(self):
        project = build_project({"name": "Solo"})
        assert project.name == "Solo"
        assert project.description == ""
        assert project.targetUsers == []
        assert project.coreFunctions == []
        assert project.keyScenarios == []
        assert project.id is not None
        assert project.createdAt is not None

    def test_full_input_preserves_all_fields(self):
        data = {
            "name": "Full",
            "description": "Desc here",
            "vision": "Big vision",
            "targetUsers": ["users"],
            "coreFunctions": ["func1"],
            "keyScenarios": ["scenario1"],
        }
        project = build_project(data)
        assert project.name == "Full"
        assert project.description == "Desc here"
        assert project.targetUsers == ["users"]
        assert project.coreFunctions == ["func1"]
        assert project.keyScenarios == ["scenario1"]

    def test_empty_name_defaults_to_unnamed(self):
        project = build_project({})
        assert project.name == "未命名项目"

    def test_ids_are_unique(self):
        p1 = build_project({"name": "A"})
        p2 = build_project({"name": "B"})
        assert p1.id != p2.id

    def test_created_at_is_non_empty_string(self):
        project = build_project({"name": "TimeTest"})
        assert isinstance(project.createdAt, str)
        assert len(project.createdAt) > 0


class TestValidateProjectInput:
    """Tests for input validation logic."""

    def test_none_name_returns_error(self):
        error = validate_project_input(None)
        assert error is not None
        assert len(error) > 0

    def test_valid_dict_returns_none(self):
        assert validate_project_input({"name": "Valid"}) is None

    def test_empty_dict_validates_name_only(self):
        # {} passes because name has default "" → falls back to "未命名项目"
        assert validate_project_input({}) is None

    def test_name_only_valid(self):
        assert validate_project_input({"name": "NameOnly"}) is None


class TestDeleteProject:
    """Tests for delete logic."""

    def test_delete_existing_returns_true(self):
        store: dict[str, Project] = {"id-1": Project(
            id="id-1", name="Keep", description="",
            targetUsers=[], coreFunctions=[], keyScenarios=[],
            createdAt="2026-01-01T00:00:00Z",
        )}
        result = delete_project("id-1", store)
        assert result is True
        assert "id-1" not in store

    def test_delete_nonexistent_returns_false(self):
        store: dict[str, Project] = {}
        result = delete_project("missing", store)
        assert result is False
        assert len(store) == 0

    def test_delete_multiple_projects_removes_only_target(self):
        store: dict[str, Project] = {
            "a": Project(id="a", name="A", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
            "b": Project(id="b", name="B", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
        }
        result = delete_project("a", store)
        assert result is True
        assert "a" not in store
        assert "b" in store

    def test_delete_preserves_other_projects(self):
        store: dict[str, Project] = {
            "x": Project(id="x", name="X", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
            "y": Project(id="y", name="Y", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
            "z": Project(id="z", name="Z", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
        }
        delete_project("y", store)
        assert len(store) == 2
        assert set(store.keys()) == {"x", "z"}


class TestListProjects:
    """Tests for list logic."""

    def test_empty_store_returns_empty_list(self):
        assert list_projects({}) == []

    def test_single_project_returns_one_item(self):
        store: dict[str, Project] = {
            "p1": Project(id="p1", name="Solo", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
        }
        result = list_projects(store)
        assert len(result) == 1
        assert result[0].name == "Solo"

    def test_multiple_projects_all_returned(self):
        store: dict[str, Project] = {
            "a": Project(id="a", name="A", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
            "b": Project(id="b", name="B", description="", targetUsers=[], coreFunctions=[], keyScenarios=[], createdAt="2026-01-01T00:00:00Z"),
        }
        names = {p.name for p in list_projects(store)}
        assert names == {"A", "B"}


class TestTestConnection:
    """Tests for AI connection validation logic."""

    def _make_mock(self, status_code: int, text: str = "") -> tuple[MagicMock, MagicMock]:
        """Return (mock_resp, mock_client) pair ready to use with httpx.Client patch.
        mock_client is set up as a context manager so 'with httpx.Client() as client:' works.
        """
        mock_resp = MagicMock()
        mock_resp.status_code = status_code
        mock_resp.text = text
        mock_client = MagicMock()
        mock_client.post.return_value = mock_resp
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        return mock_resp, mock_client

    def test_success_on_200(self):
        _, mock_client = self._make_mock(200, '{"choices":[{"message":{"content":"hi"}}]}')
        with patch("app.logic.httpx.Client", return_value=mock_client):
            result = validate_ai_connection("https://api.openai.com/v1", "sk-test-key")
        assert result["success"] is True
        assert result["message"] == "连接成功！"
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert "/chat/completions" in call_args[0][0]  # first positional arg is url
        assert call_args[1]["headers"]["Authorization"] == "Bearer sk-test-key"

    def test_failure_on_401(self):
        _, mock_client = self._make_mock(401, '{"error":{"message":"Incorrect API key"}}')
        with patch("app.logic.httpx.Client", return_value=mock_client):
            result = validate_ai_connection("https://api.openai.com/v1", "sk-bad-key")
        assert result["success"] is False
        assert "401" in result["message"]

    def test_connect_error_returns_failure(self):
        with patch("app.logic.httpx.Client", side_effect=httpx.ConnectError("Connection refused")):
            result = validate_ai_connection("https://bad-host.example", "sk-x")
        assert result["success"] is False
        assert "连接失败" in result["message"]

    def test_custom_model_name_passed(self):
        _, mock_client = self._make_mock(200, "")
        with patch("app.logic.httpx.Client", return_value=mock_client):
            validate_ai_connection("https://api.test.com", "sk-key", model_name="deepseek-chat")
        call_json = mock_client.post.call_args[1]["json"]
        assert call_json["model"] == "deepseek-chat"

    def test_trailing_slash_stripped_from_url(self):
        _, mock_client = self._make_mock(200, "")
        with patch("app.logic.httpx.Client", return_value=mock_client):
            validate_ai_connection("https://api.openai.com/v1/", "sk-key")
        url = mock_client.post.call_args[0][0]
        assert url == "https://api.openai.com/v1/chat/completions"
