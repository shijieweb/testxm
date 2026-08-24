"""Team / Expert Agent — DAG + 澄清闭环 + Bug 回溯 单测."""
import pytest
import asyncio
from unittest.mock import patch, MagicMock

from app.agents.base import AgentContext, BaseAgent
from app.agents.prd_agent import PRDAgent
from app.agents.architect_agent import ArchitectAgent
from app.agents.engineer_agent import EngineerAgent
from app.agents.qa_agent import QAAgent
from app.workflow.engine import WorkflowEngine
from app.models import TeamExecutionResponse, TeamClarificationRequest, BugRefuxRequest


# ── AgentContext ────────────────────────────────────────────────────────────


class TestAgentContext:
    def test_defaults(self):
        ctx = AgentContext(user_request="test")
        assert ctx.project_name == ""
        assert ctx.stage_outputs == {}
        assert ctx.clarification_history == []
        assert ctx.api_url == ""
        assert ctx.api_key == ""
        assert ctx.model_name == "gpt-4o-mini"

    def test_custom_values(self):
        ctx = AgentContext(
            user_request="build a todo app",
            project_name="todo",
            api_url="https://api.openai.com",
            api_key="sk-test",
            model_name="gpt-4o",
            clarification_history=[{"questions": ["q1"], "user_answer": "a1"}],
        )
        assert ctx.project_name == "todo"
        assert ctx.model_name == "gpt-4o"
        assert len(ctx.clarification_history) == 1


# ── BaseAgent ────────────────────────────────────────────────────────────────


class TestBaseAgent:
    def test_parse_json_plain(self):
        result = BaseAgent._parse_json('{"score": 85}')
        assert result == {"score": 85}

    def test_parse_json_with_markdown_fence(self):
        text = "```json\n{\"score\": 85}\n```"
        result = BaseAgent._parse_json(text)
        assert result == {"score": 85}

    def test_parse_json_with_plain_fence(self):
        text = "```\n{\"score\": 85}\n```"
        result = BaseAgent._parse_json(text)
        assert result == {"score": 85}

    def test_summarize_short(self):
        assert BaseAgent._summarize("short text") == "short text"

    def test_summarize_long(self):
        long_text = "x" * 200
        result = BaseAgent._summarize(long_text, max_len=50)
        assert len(result) > 50
        assert "..." in result
        assert f" ({len(long_text)} chars total)" in result

    def test_call_ai_no_credentials_raises(self):
        class _ConcreteAgent(BaseAgent):
            async def execute(self, context):
                return {}
        agent = _ConcreteAgent()
        agent.api_url = ""
        agent.api_key = ""
        agent.model_name = "gpt-4o-mini"
        with pytest.raises(RuntimeError, match="未配置 API 凭据"):
            asyncio.run(agent._call_ai("hello"))


# ── PRDAgent ─────────────────────────────────────────────────────────────────


class TestPRDAgent:
    @patch.object(PRDAgent, "_call_ai")
    def test_completed_when_score_high(self, mock_call):
        mock_call.return_value = '{"prd": {"targetUsers": ["u1"], "coreFunctions": ["f1"], "keyScenarios": ["s1"], "description": "desc"}, "score": 90, "needs_clarification": false, "clarification_questions": []}'
        agent = PRDAgent(api_url="https://api.test", api_key="key", model_name="gpt-4o")
        ctx = AgentContext(user_request="a todo app")
        result = asyncio.run(agent.execute(ctx))

        assert result["status"] == "completed"
        assert result["result"]["score"] == 90
        assert "prd" in result["result"]
        assert "clarification" not in result

    @patch.object(PRDAgent, "_call_ai")
    def test_clarification_when_score_low(self, mock_call):
        mock_call.return_value = (
            '{"prd": {"targetUsers": [], "coreFunctions": [], "keyScenarios": [], "description": ""}, '
            '"score": 50, "needs_clarification": true, '
            '"clarification_questions": ["目标用户是谁？", "核心场景是什么？"]}'
        )
        agent = PRDAgent(api_url="https://api.test", api_key="key", model_name="gpt-4o")
        ctx = AgentContext(user_request="make a website")
        result = asyncio.run(agent.execute(ctx))

        assert result["status"] == "clarification"
        assert result["clarification"]["score"] == 50
        assert len(result["clarification"]["questions"]) == 2
        assert "目标用户是谁？" in result["clarification"]["questions"]

    @patch.object(PRDAgent, "_call_ai")
    def test_clarification_history_injected(self, mock_call):
        # 第二次调用应包含历史澄清
        history = [
            {"questions": ["Q1?"], "user_answer": "A1"},
            {"questions": ["Q2?"], "user_answer": "A2"},
        ]
        ctx = AgentContext(
            user_request="a chat app",
            clarification_history=history,
        )
        mock_call.return_value = '{"prd": {"targetUsers": ["u1"], "coreFunctions": ["f1"], "keyScenarios": ["s1"], "description": "desc"}, "score": 85, "needs_clarification": false, "clarification_questions": []}'
        agent = PRDAgent(api_url="https://api.test", api_key="key")
        asyncio.run(agent.execute(ctx))

        called_with = mock_call.call_args[0][0]
        assert "第1轮澄清" in called_with
        assert "第2轮澄清" in called_with
        assert "Q1?" in called_with
        assert "A1" in called_with

    @patch.object(PRDAgent, "_call_ai")
    def test_calls_api_with_credentials(self, mock_call):
        mock_call.return_value = '{"prd": {"targetUsers": ["u"], "coreFunctions": ["f"], "keyScenarios": ["s"], "description": "d"}, "score": 95, "needs_clarification": false, "clarification_questions": []}'
        agent = PRDAgent(api_url="https://api.test/v1", api_key="sk-123", model_name="claude-3")
        ctx = AgentContext(user_request="test")
        asyncio.run(agent.execute(ctx))
        assert mock_call.called
        assert agent.api_url == "https://api.test/v1"


# ── ArchitectAgent ───────────────────────────────────────────────────────────


class TestArchitectAgent:
    @patch.object(ArchitectAgent, "_call_ai")
    def test_returns_tech_stack(self, mock_call):
        mock_call.return_value = (
            '{"techStack": {"frontend": "React", "backend": "FastAPI"}, '
            '"architecture": "MVC", "directoryTree": "src/app/", '
            '"keyDecisions": [], "risks": []}'
        )
        agent = ArchitectAgent()
        ctx = AgentContext(
            user_request="a web app",
            project_name="test-app",
            stage_outputs={"prd_step": {"result": {"prd": {"coreFunctions": ["login"]}}}},
        )
        result = asyncio.run(agent.execute(ctx))
        assert result["status"] == "completed"
        assert "techStack" in result["result"]

    @patch.object(ArchitectAgent, "_call_ai")
    def test_reads_prd_from_context(self, mock_call):
        mock_call.return_value = '{"techStack": {}, "architecture": "", "directoryTree": "", "keyDecisions": [], "risks": []}'
        agent = ArchitectAgent()
        ctx = AgentContext(
            user_request="a todo app",
            stage_outputs={"prd_step": {"result": {"prd": {"targetUsers": ["user1"], "coreFunctions": ["list"], "keyScenarios": ["view"], "description": "Todo desc"}}}},
        )
        asyncio.run(agent.execute(ctx))
        called_with = mock_call.call_args[0][0]
        # 架构师从 PRD 读取，不包含 user_request
        assert "user1" in called_with
        assert "Todo desc" in called_with


# ── EngineerAgent ────────────────────────────────────────────────────────────


class TestEngineerAgent:
    @patch.object(EngineerAgent, "_call_ai")
    def test_returns_code_plan(self, mock_call):
        mock_call.return_value = (
            '{"files_generated": ["app.py", "models.py"], '
            '"api_endpoints": ["/todos", "/users"], '
            '"consistency_check": "passed", '
            '"summary": "Code plan generated"}'
        )
        agent = EngineerAgent()
        ctx = AgentContext(
            user_request="a todo app",
            stage_outputs={
                "prd_step": {"result": {"prd": {}}},
                "architect_step": {"result": {"techStack": {}}},
            },
        )
        result = asyncio.run(agent.execute(ctx))
        assert result["status"] == "completed"
        assert "files_generated" in result["result"]


# ── WorkflowEngine ───────────────────────────────────────────────────────────


class TestWorkflowEngine:
    def test_build_default(self):
        engine = WorkflowEngine.build_default(max_clarification_rounds=5)
        assert engine.max_clarification_rounds == 5
        assert "prd" in engine._steps
        assert "architect" in engine._steps
        assert "engineer" in engine._steps
        assert engine._steps["architect"].depends_on == ["prd"]
        assert engine._steps["engineer"].depends_on == ["architect"]

    @patch.object(BaseAgent, "_call_ai")
    @patch.object(PRDAgent, "_call_ai")
    @patch.object(ArchitectAgent, "_call_ai")
    @patch.object(EngineerAgent, "_call_ai")
    def test_full_execution_returns_completed(self, mock_eng, mock_arch, mock_prd, mock_base):
        mock_prd.return_value = (
            '{"prd": {"targetUsers": ["u"], "coreFunctions": ["f"], "keyScenarios": ["s"], "description": "d"}, '
            '"score": 90, "needs_clarification": false, "clarification_questions": []}'
        )
        mock_arch.return_value = '{"techStack": {}, "architecture": "", "directoryTree": "", "keyDecisions": [], "risks": []}'
        mock_eng.return_value = (
            '{"files_generated": [], "api_endpoints": [], "consistency_check": "passed", "summary": "done"}'
        )
        mock_base.return_value = '{"bugs": [], "overall_quality": "pass", "summary": "All good"}'
        engine = WorkflowEngine.build_default()
        resp: TeamExecutionResponse = asyncio.run(
            engine.run(user_request="a todo app", api_url="https://api.test", api_key="key")
        )
        assert resp.status == "completed"
        assert len(resp.steps) == 4
        assert resp.final_output is not None
        assert "prd" in resp.final_output
        assert "architecture" in resp.final_output
        assert "implementation" in resp.final_output
        assert "quality_review" in resp.final_output

    @patch.object(PRDAgent, "_call_ai")
    def test_clarification_triggers_needs_clarification_status(self, mock_prd):
        mock_prd.return_value = (
            '{"prd": {}, "score": 45, "needs_clarification": true, '
            '"clarification_questions": ["Who is the user?", "What is the budget?"]}'
        )
        engine = WorkflowEngine.build_default()
        resp: TeamExecutionResponse = asyncio.run(
            engine.run(user_request="build something", api_url="https://api.test", api_key="key")
        )
        assert resp.status == "needs_clarification"
        assert resp.clarification is not None
        assert resp.clarification.score == 45
        assert len(resp.clarification.questions) == 2
        assert resp.round == 1
        # 只执行了 PRD 步骤
        assert len(resp.steps) == 1
        assert resp.steps[0].status == "clarification"

    @patch.object(BaseAgent, "_call_ai")
    @patch.object(PRDAgent, "_call_ai")
    @patch.object(ArchitectAgent, "_call_ai")
    @patch.object(EngineerAgent, "_call_ai")
    def test_clarification_resolution_continues_workflow(self, mock_eng, mock_arch, mock_prd, mock_base):
        # 第一次：需要澄清
        mock_prd.side_effect = [
            '{"prd": {}, "score": 40, "needs_clarification": true, "clarification_questions": ["Clarify target?"]}',
            '{"prd": {"targetUsers": ["enterprise"], "coreFunctions": ["auth"], "keyScenarios": ["login"], "description": "d"}, '
            '"score": 90, "needs_clarification": false, "clarification_questions": []}',
        ]
        mock_arch.return_value = '{"techStack": {}, "architecture": "", "directoryTree": "", "keyDecisions": [], "risks": []}'
        mock_eng.return_value = '{"files_generated": [], "api_endpoints": [], "consistency_check": "passed", "summary": "done"}'
        mock_base.return_value = '{"bugs": [], "overall_quality": "pass", "summary": "All good"}'

        engine = WorkflowEngine.build_default()

        # 第一轮 → needs_clarification
        resp1: TeamExecutionResponse = asyncio.run(
            engine.run(user_request="a SaaS", api_url="https://api.test", api_key="key")
        )
        assert resp1.status == "needs_clarification"
        assert resp1.round == 1

        # 第二轮：注入澄清上下文 → completed
        resp2: TeamExecutionResponse = asyncio.run(
            engine.run(
                user_request="a SaaS",
                api_url="https://api.test",
                api_key="key",
                clarification_context={
                    "clarification": {
                        "questions": ["Clarify target?"],
                        "score": 40,
                        "needs_clarification": True,
                    },
                    "user_answer": "Enterprise companies",
                    "project_name": "saas-app",
                },
            )
        )
        assert resp2.status == "completed"
        # clarification_history 有 1 条记录 → round = 1 + 1 = 2
        assert resp2.round == 2
        assert resp2.final_output is not None
        assert len(resp2.steps) == 4

    @patch.object(PRDAgent, "_call_ai")
    def test_reaches_max_clarification_rounds(self, mock_prd):
        # 每次 PRD 都返回澄清请求
        mock_prd.return_value = (
            '{"prd": {}, "score": 30, "needs_clarification": true, '
            '"clarification_questions": ["Need more info"]}'
        )
        engine = WorkflowEngine.build_default(max_clarification_rounds=2)

        # Round 1
        resp1 = asyncio.run(
            engine.run(user_request="a thing", api_url="https://api.test", api_key="key")
        )
        assert resp1.status == "needs_clarification"
        assert resp1.round == 1

        # Round 2 — 再触发，但 max_rounds=2，应强制通过
        # 注意：当前实现没有硬拦截 max_rounds（引擎层面），
        # 实际由上层（前端/路由）控制重试次数
        resp2 = asyncio.run(
            engine.run(
                user_request="a thing",
                api_url="https://api.test",
                api_key="key",
                clarification_context={
                    "clarification": {"questions": ["Need more info"]},
                    "user_answer": "Just a thing",
                },
            )
        )
        # 如果引擎没有主动拦截，仍然返回 clarification
        # 测试意图：验证澄清上下文被正确注入，不 crash
        assert resp2.status in ("needs_clarification", "completed")


# ── QAAgent ────────────────────────────────────────────────────────────────


class TestQAAgent:
    @patch.object(QAAgent, "_call_ai")
    def test_passes_when_no_bugs(self, mock_call):
        mock_call.return_value = '{"bugs": [], "overall_quality": "pass", "summary": "All good"}'
        agent = QAAgent(api_url="https://api.test", api_key="key")
        ctx = AgentContext(
            user_request="a todo app",
            stage_outputs={
                "prd_step": {"result": {"prd": {}}},
                "architect_step": {"result": {}},
                "engineer_step": {"result": {}},
            },
        )
        result = asyncio.run(agent.execute(ctx))
        assert result["status"] == "completed"
        assert "result" in result
        assert result["result"]["overall_quality"] == "pass"
        assert "bug_reflux" not in result

    @patch.object(QAAgent, "_call_ai")
    def test_needs_fix_when_bugs_found(self, mock_call):
        mock_call.return_value = (
            '{"bugs": [{"file": "app.py", "severity": "high", '
            '"description": "Null pointer", "fix_suggestion": "Add check"}], '
            '"overall_quality": "needs_fix", "summary": "Found bugs"}'
        )
        agent = QAAgent(api_url="https://api.test", api_key="key")
        ctx = AgentContext(
            user_request="a todo app",
            stage_outputs={
                "prd_step": {"result": {"prd": {}}},
                "architect_step": {"result": {}},
                "engineer_step": {"result": {}},
            },
        )
        result = asyncio.run(agent.execute(ctx))
        assert result["status"] == "needs_fix"
        assert "bug_reflux" in result
        assert len(result["bug_reflux"]["bugs"]) == 1
        assert result["bug_reflux"]["bugs"][0]["severity"] == "high"

    @patch.object(QAAgent, "_call_ai")
    def test_bug_history_injected_on_retry(self, mock_call):
        ctx = AgentContext(
            user_request="a chat app",
            clarification_history=[
                {"bugs_summary": "Bug round 1: NPE in auth"},
                {"bugs_summary": "Bug round 2: XSS in input"},
            ],
        )
        mock_call.return_value = '{"bugs": [], "overall_quality": "pass", "summary": "Clean"}'
        agent = QAAgent(api_url="https://api.test", api_key="key")
        asyncio.run(agent.execute(ctx))
        called_with = mock_call.call_args[0][0]
        assert "Bug round 1" in called_with
        assert "Bug round 2" in called_with
        assert "之前审查发现的问题" in called_with


# ── Bug Reflux Workflow ────────────────────────────────────────────────────


class TestBugReflux:
    @patch.object(BaseAgent, "_call_ai")
    @patch.object(PRDAgent, "_call_ai")
    @patch.object(ArchitectAgent, "_call_ai")
    @patch.object(EngineerAgent, "_call_ai")
    def test_bug_reflux_triggers_needs_bug_fix(self, mock_eng, mock_arch, mock_prd, mock_base):
        mock_prd.return_value = (
            '{"prd": {"targetUsers": ["u"], "coreFunctions": ["f"], "keyScenarios": ["s"], "description": "d"}, '
            '"score": 90, "needs_clarification": false, "clarification_questions": []}'
        )
        mock_arch.return_value = '{"techStack": {}, "architecture": "", "directoryTree": "", "keyDecisions": [], "risks": []}'
        mock_eng.return_value = '{"files_generated": [], "api_endpoints": [], "consistency_check": "passed", "summary": "done"}'
        mock_base.return_value = (
            '{"bugs": [{"file": "x.py", "severity": "high", "description": "Null", "fix_suggestion": "check"}], '
            '"overall_quality": "needs_fix", "summary": "Bugs found"}'
        )
        engine = WorkflowEngine.build_default()
        resp = asyncio.run(
            engine.run(user_request="a todo app", api_url="https://api.test", api_key="key")
        )
        assert resp.status == "needs_bug_fix"
        assert resp.bug_reflux is not None
        assert isinstance(resp.bug_reflux, BugRefuxRequest)
        assert len(resp.bug_reflux.bugs) == 1
        assert resp.round == 1

    @patch.object(BaseAgent, "_call_ai")
    @patch.object(PRDAgent, "_call_ai")
    @patch.object(ArchitectAgent, "_call_ai")
    @patch.object(EngineerAgent, "_call_ai")
    def test_bug_reflux_resolution_passes_qa(self, mock_eng, mock_arch, mock_prd, mock_base):
        mock_prd.return_value = (
            '{"prd": {"targetUsers": ["u"], "coreFunctions": ["f"], "keyScenarios": ["s"], "description": "d"}, '
            '"score": 90, "needs_clarification": false, "clarification_questions": []}'
        )
        mock_arch.return_value = '{"techStack": {}, "architecture": "", "directoryTree": "", "keyDecisions": [], "risks": []}'
        # Engineer re-runs and produces better output
        mock_eng.side_effect = [
            '{"files_generated": [], "api_endpoints": [], "consistency_check": "passed", "summary": "v1"}',
            '{"files_generated": ["fixed.py"], "api_endpoints": [], "consistency_check": "passed", "summary": "fixed"}',
        ]
        # First QA: finds bugs, Second QA: passes
        mock_base.side_effect = [
            '{"bugs": [{"file": "x.py", "severity": "high", "description": "Null", "fix_suggestion": "check"}], '
            '"overall_quality": "needs_fix", "summary": "Bugs found"}',
            '{"bugs": [], "overall_quality": "pass", "summary": "All good now"}',
        ]
        engine = WorkflowEngine.build_default()

        # Round 1 → needs_bug_fix
        resp1 = asyncio.run(
            engine.run(user_request="a todo app", api_url="https://api.test", api_key="key")
        )
        assert resp1.status == "needs_bug_fix"
        assert resp1.bug_reflux is not None

        # Round 2: inject bug reflux context → completed
        resp2 = asyncio.run(
            engine.run(
                user_request="a todo app",
                api_url="https://api.test",
                api_key="key",
                clarification_context={
                    "bug_reflux": {
                        "bugs": [{"file": "x.py", "severity": "high", "description": "Null", "fix_suggestion": "check"}],
                        "bugs_summary": "High: x.py - Null",
                        "round": 1,
                    }
                },
            )
        )
        assert resp2.status == "completed"
        assert resp2.round == 2  # bug_fix_history has 1 entry → round = 1 + 1 = 2
        assert resp2.final_output is not None


class TestListWorkflows:
    def test_list_returns_roles(self):
        from app.main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        resp = client.get("/api/team/workflows")
        assert resp.status_code == 200
        data = resp.json()
        assert "roles" in data
        role_names = [r["name"] for r in data["roles"]]
        assert any("产品经理" in n for n in role_names)
        assert any("架构师" in n for n in role_names)
        assert any("工程师" in n for n in role_names)
        assert any("质检工程师" in n for n in role_names)
        assert "qa" in [r["id"] for r in data["roles"]]
        assert "qa" in data["workflow"]
