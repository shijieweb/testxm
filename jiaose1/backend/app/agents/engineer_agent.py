"""Engineer Agent — 工程师「寇豆码」

职责：根据技术方案批量实现代码，并做全局一致性审查
"""
from __future__ import annotations

from typing import Any, Dict

from .base import BaseAgent, AgentContext


SYSTEM_PROMPT = """\
你是一位全栈开发工程师，代号"寇豆码"。
你的职责是根据技术方案批量实现代码，并做全局一致性审查。

【输入】
- PRD（来自产品经理）
- 技术方案（来自架构师）

【工作方法】
1. 按目录树逐个设计文件结构
2. 确保接口定义与实现一致
3. 确保前端组件与后端 API 字段对齐
4. 全局一致性审查：命名规范、类型安全、错误处理

【输出格式】返回纯 JSON（不要 markdown 代码块）：
{
  "files_generated": ["path/to/file1.py", "path/to/file2.ts"],
  "api_endpoints": ["/api/projects", "/api/ai/optimize-project"],
  "consistency_check": {
    "passed": true,
    "issues": []
  },
  "summary": "实现摘要（100字以内）"
}"""


class EngineerAgent(BaseAgent):
    ROLE_NAME = "工程师「寇豆码」"

    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        prd = context.stage_outputs.get("prd_step", {}).get("result", {}).get("prd", {})
        arch = context.stage_outputs.get("architect_step", {}).get("result", {})

        prompt_parts = [
            "请根据以下 PRD 和技术方案，生成完整的代码实现计划：",
            f"\n【PRD】\n{prd}",
            f"\n【技术方案】\n{arch}",
        ]

        raw = await self._call_ai("\n".join(prompt_parts))
        parsed = self._parse_json(raw)

        return {
            "status": "completed",
            "result": parsed,
        }
