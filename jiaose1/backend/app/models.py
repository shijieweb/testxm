"""Pydantic models shared between routes and logic layer."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AiOptimizeInput(BaseModel):
    name: Optional[str] = ""
    description: Optional[str] = ""
    vision: Optional[str] = ""
    apiUrl: Optional[str] = ""
    apiKey: Optional[str] = ""
    modelName: Optional[str] = "gpt-4o-mini"


class AiOptimizeOutput(BaseModel):
    targetUsers: List[str]
    coreFunctions: List[str]
    keyScenarios: List[str]
    description: str


class TestConnectionInput(BaseModel):
    apiUrl: str
    apiKey: str
    modelName: str = "gpt-4o-mini"


class TestConnectionOutput(BaseModel):
    success: bool
    message: str


class ProjectCreateInput(BaseModel):
    name: Optional[str] = ""
    description: Optional[str] = ""
    vision: Optional[str] = ""
    targetUsers: Optional[List[str]] = []
    coreFunctions: Optional[List[str]] = []
    keyScenarios: Optional[List[str]] = []


class Project(BaseModel):
    id: str
    name: str
    description: str
    targetUsers: List[str]
    coreFunctions: List[str]
    keyScenarios: List[str]
    createdAt: str


# ── Team / Expert Agent Models ────────────────────────────────────────────


class TeamStepResult(BaseModel):
    """单个 Agent 步骤的执行结果"""
    step_id: str
    agent_name: str
    role_name: str
    status: str  # "pending" | "running" | "completed" | "failed" | "clarification"
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class TeamClarificationRequest(BaseModel):
    """PRD Agent 评分不足时返回的澄清请求"""
    score: float
    needs_clarification: bool
    questions: List[str]
    partial_prd: Optional[Dict[str, Any]] = None


class TeamTaskInput(BaseModel):
    """用户发起团队协作任务的输入"""
    user_request: str
    project_name: Optional[str] = ""
    api_url: Optional[str] = ""
    api_key: Optional[str] = ""
    model_name: Optional[str] = "gpt-4o-mini"
    clarification_context: Optional[Dict[str, Any]] = None
    max_clarification_rounds: int = 3
    max_bug_fix_rounds: int = 2


class TeamExecutionResponse(BaseModel):
    """团队协作执行响应"""
    task_id: str
    status: str  # "started" | "needs_clarification" | "running" | "completed" | "failed" | "needs_bug_fix"
    steps: List[TeamStepResult]
    clarification: Optional[TeamClarificationRequest] = None
    bug_reflux: Optional[BugRefuxRequest] = None
    final_output: Optional[Dict[str, Any]] = None
    round: int = 1


class BugItem(BaseModel):
    """QA 发现的具体 Bug"""
    file: str
    line_hint: Optional[str] = None
    severity: str  # "high" | "medium" | "low"
    description: str
    fix_suggestion: Optional[str] = None


class BugRefuxRequest(BaseModel):
    """QA Agent 发现 Bug 时返回的回溯请求"""
    bugs: List[BugItem]
    bugs_summary: str
    round: int
