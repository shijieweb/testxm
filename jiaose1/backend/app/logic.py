"""Pure business logic extracted from main.py — unit-testable without HTTP."""
from __future__ import annotations

import time
import uuid
from typing import Any

import httpx

from .models import AiOptimizeOutput, Project


# ── In-memory store (imported by routes, mutated by tests) ──────────────

_projects: dict[str, Project] = {}


# ── Optimize ─────────────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """\
你是一个产品架构师。请根据用户提供的项目信息，输出结构化的项目描述。

用户输入：
- 项目名称：{name}
- 项目简介：{description}
- 基础用户设想：{vision}

请按以下格式输出纯 JSON（不要 markdown 代码块，直接输出 JSON）：
{{
  "targetUsers": ["目标用户1", "目标用户2"],
  "coreFunctions": ["核心功能1", "核心功能2"],
  "keyScenarios": ["关键场景1", "关键场景2"],
  "description": "优化后的项目简介（200字以内）"
}}\
"""


def _parse_ai_json(text: str) -> dict:
    """Extract JSON from model response (handles markdown code fences)."""
    text = text.strip()
    if text.startswith("```"):
        # Strip markdown code fences
        lines = text.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        lines = lines[:-1] if lines and lines[-1].strip() == "```" else lines
        text = "\n".join(lines)
    import json
    return json.loads(text)


def optimize_project(
    name: str = "",
    description: str = "",
    vision: str = "",
    api_url: str = "",
    api_key: str = "",
    model_name: str = "gpt-4o-mini",
) -> AiOptimizeOutput:
    """Generate structured AI optimize result from project input.

    When api_url and api_key are provided, calls the real OpenAI-compatible API.
    Otherwise falls back to deterministic template output.
    """
    resolved_name = name or "新项目"
    prompt = _PROMPT_TEMPLATE.format(
        name=resolved_name,
        description=description or "（暂无）",
        vision=vision or "（暂无）",
    )

    # Real API path: call OpenAI-compatible endpoint
    if api_url and api_key:
        base_url = api_url.rstrip("/")
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1024,
            "temperature": 0.3,
        }
        try:
            with httpx.Client(timeout=30) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                body = resp.json()
                content = body["choices"][0]["message"]["content"].strip()
                parsed = _parse_ai_json(content)
                return AiOptimizeOutput(
                    targetUsers=parsed.get("targetUsers", []),
                    coreFunctions=parsed.get("coreFunctions", []),
                    keyScenarios=parsed.get("keyScenarios", []),
                    description=parsed.get("description", ""),
                )
        except Exception:
            # On any API error, fall through to template output below
            pass

    # Fallback: deterministic template (no API call)
    return AiOptimizeOutput(
        targetUsers=[
            f"{resolved_name}的目标用户",
            "潜在使用者",
            "行业从业者",
        ],
        coreFunctions=[
            "需求管理",
            "故事编辑",
            "文档生成",
            "进度跟踪",
        ],
        keyScenarios=[
            "产品经理创建项目并定义需求",
            "开发者根据故事开发功能",
            "测试人员执行验收测试",
            "团队协作文档生成",
        ],
        description=(
            f"{resolved_name}是一个AI驱动的需求管理与研发协作平台。"
            "通过AI自动优化需求描述，生成标准化项目架构，"
            "提升团队协作效率。"
        ),
    )


# ── Project CRUD helpers ─────────────────────────────────────────────────

def build_project(data: dict[str, Any]) -> Project:
    """Build a Project from raw input dict (with safe defaults)."""
    return Project(
        id=str(uuid.uuid4()),
        name=data.get("name") or "未命名项目",
        description=data.get("description") or "",
        targetUsers=data.get("targetUsers") or [],
        coreFunctions=data.get("coreFunctions") or [],
        keyScenarios=data.get("keyScenarios") or [],
        createdAt=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


def list_projects(store: dict[str, Project] | None = None) -> list[Project]:
    """Return all projects from the given store."""
    store = store or _projects
    return list(store.values())


def create_project(data: dict[str, Any], store: dict[str, Project] | None = None) -> Project:
    """Create and persist a new project. Returns the created project."""
    store = store or _projects
    project = build_project(data)
    store[project.id] = project
    return project


def delete_project(project_id: str, store: dict[str, Project] | None = None) -> bool:
    """Delete a project by ID. Returns True if deleted, False if not found."""
    store = store or _projects
    if project_id not in store:
        return False
    del store[project_id]
    return True


def validate_project_input(data: dict[str, Any] | None) -> str | None:
    """Validate create-project input. Returns error message or None."""
    if data is None:
        return "请求体不能为空"
    # name is optional — will default to "未命名项目"
    return None


def validate_ai_connection(api_url: str, api_key: str, model_name: str = "gpt-4o-mini") -> dict[str, Any]:
    """Call an OpenAI-compatible /chat/completions endpoint to validate credentials.
    Returns {success: bool, message: str}.
    """
    base_url = api_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 1,
    }
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, headers=headers, json=payload)
            if 200 <= resp.status_code < 300:
                return {"success": True, "message": "连接成功！"}
            err_body = resp.text[:200]
            return {"success": False, "message": f"API 错误 {resp.status_code}: {err_body}"}
    except httpx.ConnectError as e:
        return {"success": False, "message": f"连接失败: 无法连接到 {api_url} ({e})"}
    except httpx.TimeoutException:
        return {"success": False, "message": "请求超时（10s），请检查网络或 API 地址"}
    except Exception as e:
        return {"success": False, "message": f"测试异常: {type(e).__name__}: {e}"}


# ── Public store accessor (for routes to mutate) ─────────────────────────

def get_project_store() -> dict[str, Project]:
    """Return the module-level project store."""
    return _projects
