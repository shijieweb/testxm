from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    AiOptimizeInput,
    AiOptimizeOutput,
    TestConnectionInput,
    TestConnectionOutput,
    ProjectCreateInput,
    Project,
    TeamTaskInput,
    TeamExecutionResponse,
    BugItem,
    BugRefuxRequest,
)
from .logic import (
    optimize_project as _optimize_project,
    build_project,
    list_projects as _list_projects,
    create_project as _create_project,
    delete_project as _delete_project,
    validate_ai_connection as _validate_ai_connection,
    get_project_store,
)
from .workflow.engine import WorkflowEngine

app = FastAPI(title="AI Requirements Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/ai/optimize-project", response_model=AiOptimizeOutput)
def optimize_project_route(payload: AiOptimizeInput):
    return _optimize_project(
        name=payload.name or "",
        description=payload.description or "",
        vision=payload.vision or "",
        api_url=payload.apiUrl or "",
        api_key=payload.apiKey or "",
        model_name=payload.modelName or "gpt-4o-mini",
    )


@app.post("/api/ai/test-connection", response_model=TestConnectionOutput)
def test_connection_route(payload: TestConnectionInput):
    result = _validate_ai_connection(
        api_url=payload.apiUrl,
        api_key=payload.apiKey,
        model_name=payload.modelName,
    )
    return TestConnectionOutput(success=result["success"], message=result["message"])


@app.get("/api/projects", response_model=list[Project])
def list_projects_route():
    return _list_projects()


@app.post("/api/projects", response_model=Project, status_code=201)
def create_project_route(payload: ProjectCreateInput):
    return _create_project({
        "name": payload.name,
        "description": payload.description,
        "vision": payload.vision,
        "targetUsers": payload.targetUsers or [],
        "coreFunctions": payload.coreFunctions or [],
        "keyScenarios": payload.keyScenarios or [],
    })


@app.delete("/api/projects/{project_id}", status_code=204)
def delete_project_route(project_id: str):
    if not _delete_project(project_id):
        raise HTTPException(status_code=404, detail="项目不存在")


# ── Team / Expert Agent Routes ───────────────────────────────────────────

@app.post("/api/team/execute", response_model=TeamExecutionResponse)
async def execute_team_workflow(payload: TeamTaskInput):
    """发起团队协作任务。

    支持自动澄清循环：PRD Agent 评分不足时会返回 needs_clarification 状态，
    前端拿到澄清问题后让用户补充，再调用同一接口传入 clarification_context 继续执行。

    支持 Bug 回溯循环：QA Agent 发现严重问题时返回 needs_bug_fix 状态，
    前端收集修复指令后重新触发，传入 clarification_context.bug_reflux 继续执行。
    """
    engine = WorkflowEngine.build_default(
        max_clarification_rounds=payload.max_clarification_rounds,
        max_bug_fix_rounds=payload.max_bug_fix_rounds,
    )
    result = await engine.run(
        user_request=payload.user_request,
        api_url=payload.api_url or "",
        api_key=payload.api_key or "",
        model_name=payload.model_name or "gpt-4o-mini",
        clarification_context=payload.clarification_context,
    )
    return result


@app.get("/api/team/workflows")
def list_team_workflows():
    """返回团队工作流的可用角色列表（供前端渲染角色卡片）。"""
    return {
        "roles": [
            {"id": "prd", "name": "产品经理「许清楚」", "description": "需求解析、PRD 生成、评分与澄清"},
            {"id": "architect", "name": "架构师「高见远」", "description": "技术方案设计、技术选型、目录规划"},
            {"id": "engineer", "name": "工程师「寇豆码」", "description": "代码实现计划、一致性审查"},
            {"id": "qa", "name": "质检工程师「严过关」", "description": "代码质量审查、Bug 发现、回溯修复"},
        ],
        "workflow": "prd → architect → engineer → qa（串行，含澄清闭环 + Bug 回溯闭环）",
    }
