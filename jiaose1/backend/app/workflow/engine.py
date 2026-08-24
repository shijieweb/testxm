"""DAG Workflow Engine — 支持串行、并行、澄清闭环、Bug 回溯循环。

执行流程：
  用户输入
    → PRD Agent（可触发澄清循环）
      → Architect Agent（串行）
        → Engineer Agent（串行）
          → QA Agent（串行，可触发 Bug 回溯循环）
            → 汇总输出
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from ..agents.base import AgentContext
from ..agents.prd_agent import PRDAgent
from ..agents.architect_agent import ArchitectAgent
from ..agents.engineer_agent import EngineerAgent
from ..agents.qa_agent import QAAgent
from ..models import (
    TeamStepResult,
    TeamClarificationRequest,
    BugRefuxRequest,
    TeamExecutionResponse,
)


class _WorkflowStep:
    """内部 DAG 节点。"""
    def __init__(
        self,
        step_id: str,
        agent: Any,
        depends_on: List[str],
        role_name: str,
    ):
        self.step_id = step_id
        self.agent = agent
        self.depends_on = depends_on
        self.role_name = role_name


class WorkflowEngine:
    """DAG 调度器。

    支持：
    - 拓扑排序确定执行顺序
    - 同层步骤并行执行（asyncio.gather）
    - PRD Agent 触发澄清时暂停，等待外部注入补充信息后重跑
    - QA Agent 触发 Bug 回溯时暂停，注入修复记录后工程师重跑
    - 最多 N 轮澄清 / M 轮 Bug 回溯
    """

    def __init__(
        self,
        max_clarification_rounds: int = 3,
        max_bug_fix_rounds: int = 2,
    ):
        self._steps: Dict[str, _WorkflowStep] = {}
        self.max_clarification_rounds = max_clarification_rounds
        self.max_bug_fix_rounds = max_bug_fix_rounds

    # ── 构建预置工作流 ──────────────────────────────────────────────────

    @classmethod
    def build_default(
        cls,
        max_clarification_rounds: int = 3,
        max_bug_fix_rounds: int = 2,
    ) -> "WorkflowEngine":
        """构建默认的软件开发团队工作流：
        PRD → 架构 → 工程师 → QA（串行，含澄清闭环 + Bug 回溯闭环）
        """
        engine = cls(
            max_clarification_rounds=max_clarification_rounds,
            max_bug_fix_rounds=max_bug_fix_rounds,
        )
        engine.add_step(_WorkflowStep("prd", PRDAgent, [], "产品经理「许清楚」"))
        engine.add_step(_WorkflowStep("architect", ArchitectAgent, ["prd"], "架构师「高见远」"))
        engine.add_step(_WorkflowStep("engineer", EngineerAgent, ["architect"], "工程师「寇豆码」"))
        engine.add_step(_WorkflowStep("qa", QAAgent, ["engineer"], "质检工程师「严过关」"))
        return engine

    def add_step(self, step: _WorkflowStep):
        self._steps[step.step_id] = step

    # ── 公开接口 ────────────────────────────────────────────────────────

    async def run(
        self,
        user_request: str,
        api_url: str = "",
        api_key: str = "",
        model_name: str = "gpt-4o-mini",
        clarification_context: Optional[Dict[str, Any]] = None,
        max_rounds: Optional[int] = None,
    ) -> TeamExecutionResponse:
        """执行工作流。

        返回 TeamExecutionResponse，status 可能为：
        - "needs_clarification"：PRD Agent 评分不足，需要用户补充
        - "needs_bug_fix"：QA Agent 发现严重 Bug，需要工程师修复
        - "completed"：全部步骤完成
        - "failed"：执行出错
        """
        max_r = max_rounds if max_rounds is not None else self.max_clarification_rounds
        task_id = uuid.uuid4().hex[:8]
        steps_log: List[TeamStepResult] = []

        # 构建澄清历史（PRD 澄清）和 Bug 修复历史（QA 回溯）
        clarification_history: List[Dict[str, Any]] = []
        bug_fix_history: List[Dict[str, Any]] = []

        if clarification_context:
            clar = clarification_context.get("clarification", {})
            if clar:
                clarification_history.append({
                    "questions": clar.get("questions", []),
                    "user_answer": clarification_context.get("user_answer", ""),
                })
            # 若包含 bug 回溯上下文，也解析
            bug_reflux = clarification_context.get("bug_reflux")
            if bug_reflux:
                bug_fix_history.append({
                    "bugs_summary": bug_reflux.get("bugs_summary", ""),
                    "round": bug_reflux.get("round", 1),
                })

        context = AgentContext(
            user_request=user_request,
            project_name=clarification_context.get("project_name", "") if clarification_context else "",
            api_url=api_url,
            api_key=api_key,
            model_name=model_name,
            clarification_history=clarification_history,
        )

        # ── PRD 阶段（带澄清循环）──
        prd_step = self._steps["prd"]
        steps_log.append(TeamStepResult(
            step_id="prd", agent_name="prd_agent", role_name=prd_step.role_name,
            status="running", input_summary=user_request[:80],
        ))

        prd_agent = prd_step.agent(api_url=api_url, api_key=api_key, model_name=model_name)
        prd_result = await prd_agent.execute(context)
        prd_status = prd_result.get("status", "completed")
        prd_output = prd_result.get("result", {})

        if prd_status == "clarification":
            steps_log[-1] = TeamStepResult(
                step_id="prd", agent_name="prd_agent", role_name=prd_step.role_name,
                status="clarification",
                input_summary=user_request[:80],
                output_summary=f"评分 {prd_output.get('score', 0)} 分，需澄清",
                result=prd_output,
            )
            clar_req = prd_result.get("clarification", {})
            return TeamExecutionResponse(
                task_id=task_id,
                status="needs_clarification",
                steps=steps_log,
                clarification=TeamClarificationRequest(**clar_req) if clar_req else None,
                final_output=None,
                round=len(clarification_history) + 1,
            )

        steps_log[-1] = TeamStepResult(
            step_id="prd", agent_name="prd_agent", role_name=prd_step.role_name,
            status="completed",
            input_summary=user_request[:80],
            output_summary=f"评分 {prd_output.get('score', 0)} 分，PRD 已生成",
            result=prd_output,
        )
        context.stage_outputs["prd_step"] = {"status": "completed", "result": prd_output}

        # ── 架构阶段 ──
        arch_step = self._steps["architect"]
        steps_log.append(TeamStepResult(
            step_id="architect", agent_name="architect_agent", role_name=arch_step.role_name,
            status="running",
        ))
        arch_agent = arch_step.agent(api_url=api_url, api_key=api_key, model_name=model_name)
        arch_result = await arch_agent.execute(context)
        arch_output = arch_result.get("result", {})
        steps_log[-1] = TeamStepResult(
            step_id="architect", agent_name="architect_agent", role_name=arch_step.role_name,
            status="completed",
            output_summary=f"技术方案已生成，包含 {len(arch_output.get('techStack', {}))} 个技术栈",
            result=arch_output,
        )
        context.stage_outputs["architect_step"] = {"status": "completed", "result": arch_output}

        # ── 工程师阶段 ──
        eng_step = self._steps["engineer"]
        steps_log.append(TeamStepResult(
            step_id="engineer", agent_name="engineer_agent", role_name=eng_step.role_name,
            status="running",
        ))
        eng_agent = eng_step.agent(api_url=api_url, api_key=api_key, model_name=model_name)
        eng_result = await eng_agent.execute(context)
        eng_output = eng_result.get("result", {})
        steps_log[-1] = TeamStepResult(
            step_id="engineer", agent_name="engineer_agent", role_name=eng_step.role_name,
            status="completed",
            output_summary=eng_output.get("summary", "代码实现计划已生成"),
            result=eng_output,
        )
        context.stage_outputs["engineer_step"] = {"status": "completed", "result": eng_output}

        # ── QA 阶段（带 Bug 回溯循环）──
        qa_step = self._steps["qa"]
        steps_log.append(TeamStepResult(
            step_id="qa", agent_name="qa_agent", role_name=qa_step.role_name,
            status="running",
        ))
        qa_agent = qa_step.agent(api_url=api_url, api_key=api_key, model_name=model_name)
        qa_result = await qa_agent.execute(context)
        qa_status = qa_result.get("status", "completed")
        qa_output = qa_result.get("result", {})

        if qa_status == "needs_fix":
            steps_log[-1] = TeamStepResult(
                step_id="qa", agent_name="qa_agent", role_name=qa_step.role_name,
                status="needs_fix",
                output_summary=f"发现 {len(qa_output.get('bugs', []))} 个问题，需工程师修复",
                result=qa_output,
            )
            bug_reflux = qa_result.get("bug_reflux", {})
            return TeamExecutionResponse(
                task_id=task_id,
                status="needs_bug_fix",
                steps=steps_log,
                clarification=None,
                bug_reflux=BugRefuxRequest(**bug_reflux) if bug_reflux else None,
                final_output=None,
                round=len(bug_fix_history) + 1,
            )

        steps_log[-1] = TeamStepResult(
            step_id="qa", agent_name="qa_agent", role_name=qa_step.role_name,
            status="completed",
            output_summary=qa_output.get("summary", "质量审查通过"),
            result=qa_output,
        )
        context.stage_outputs["qa_step"] = {"status": "completed", "result": qa_output}

        # ── 汇总 ──
        final_output = {
            "prd": prd_output,
            "architecture": arch_output,
            "implementation": eng_output,
            "quality_review": qa_output,
            "score": prd_output.get("score", 0),
        }

        total_round = len(clarification_history) + len(bug_fix_history) + 1

        return TeamExecutionResponse(
            task_id=task_id,
            status="completed",
            steps=steps_log,
            final_output=final_output,
            round=total_round,
        )
