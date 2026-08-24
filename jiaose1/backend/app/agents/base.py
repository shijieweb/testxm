"""Base Agent class — all team agents inherit from this."""
from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx


@dataclass
class AgentContext:
    """步骤间共享上下文，前一步的输出作为后一步的输入"""
    user_request: str
    project_name: str = ""
    stage_outputs: Dict[str, Any] = field(default_factory=dict)
    clarification_history: List[Dict[str, Any]] = field(default_factory=list)
    api_url: str = ""
    api_key: str = ""
    model_name: str = "gpt-4o-mini"


class BaseAgent(ABC):
    """所有 Team Agent 的基类。

    每个子类的职责：
    - ROLE_NAME：展示名，如 "产品经理「许清楚」"
    - SYSTEM_PROMPT：角色系统提示词
    - execute()：接收 context，返回 dict（可能触发澄清）
    """

    ROLE_NAME: str = ""
    SYSTEM_PROMPT: str = ""

    def __init__(self, api_url: str = "", api_key: str = "", model_name: str = "gpt-4o-mini"):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.model_name = model_name

    # ── 核心接口 ────────────────────────────────────────────────────────

    @abstractmethod
    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        """执行 Agent 逻辑。

        返回结构：
        - {"status": "completed", "result": {...}}   → 正常完成
        - {"status": "clarification", "result": {...}} → 需要用户补充信息
        - {"status": "failed", "error": "..."}        → 执行失败
        """
        raise NotImplementedError

    # ── AI 调用封装 ─────────────────────────────────────────────────────

    async def _call_ai(self, user_content: str) -> str:
        """调用 OpenAI 兼容 API，返回原始文本响应。"""
        if not self.api_url or not self.api_key:
            raise RuntimeError(f"Agent {self.__class__.__name__} 未配置 API 凭据")

        url = f"{self.api_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if self.SYSTEM_PROMPT:
            messages.append({"role": "system", "content": self.SYSTEM_PROMPT})
        messages.append({"role": "user", "content": user_content})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": 2048,
            "temperature": 0.3,
        }

        with httpx.Client(timeout=60) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()

    # ── 输出解析 ────────────────────────────────────────────────────────

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        """剥离 markdown 代码块后解析 JSON。"""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:] if lines[0].startswith("```") else lines
            lines = lines[:-1] if lines and lines[-1].strip() == "```" else lines
            text = "\n".join(lines)
        return json.loads(text)

    @staticmethod
    def _summarize(text: str, max_len: int = 120) -> str:
        """截断长文本为摘要。"""
        if len(text) <= max_len:
            return text
        return text[:max_len] + f"... ({len(text)} chars total)"
