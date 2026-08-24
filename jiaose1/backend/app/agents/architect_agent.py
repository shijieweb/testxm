"""Architect Agent — 架构师「高见远」

职责：根据 PRD 设计技术方案，选择技术栈，规划目录结构
"""
from __future__ import annotations

from typing import Any, Dict

from .base import BaseAgent, AgentContext


SYSTEM_PROMPT = """\
你是一位资深技术架构师，代号"高见远"。
你的职责是根据 PRD 设计技术方案，选择技术栈，规划项目目录结构。

【输入】PRD 信息：
- targetUsers: 目标用户
- coreFunctions: 核心功能
- keyScenarios: 关键场景
- description: 项目简介

【工作方法】
1. 根据功能需求选择合适的前后端技术栈
2. 设计分层架构（表现层 / 业务层 / 数据层）
3. 规划项目目录树
4. 识别关键技术决策和风险点

【输出格式】返回纯 JSON（不要 markdown 代码块）：
{
  "techStack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["FastAPI", "Python"],
    "database": ["SQLite", "PostgreSQL"]
  },
  "architecture": "分层架构描述",
  "directoryTree": ["src/", "src/components/", "src/pages/"],
  "keyDecisions": ["技术选型说明1", "技术选型说明2"],
  "risks": ["风险1"]
}"""


class ArchitectAgent(BaseAgent):
    ROLE_NAME = "架构师「高见远」"

    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        prd = context.stage_outputs.get("prd_step", {}).get("result", {}).get("prd", {})
        prd_text = (
            f"目标用户: {prd.get('targetUsers', [])}\n"
            f"核心功能: {prd.get('coreFunctions', [])}\n"
            f"关键场景: {prd.get('keyScenarios', [])}\n"
            f"项目简介: {prd.get('description', '')}"
        )

        raw = await self._call_ai(f"请基于以下 PRD 设计技术方案：\n\n{prd_text}")
        parsed = self._parse_json(raw)

        return {
            "status": "completed",
            "result": parsed,
        }
