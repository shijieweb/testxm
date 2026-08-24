"""PRD Agent — 产品经理「许清楚」

职责：解析需求 → 生成 PRD → 评分 → 不足时触发澄清循环
"""
from __future__ import annotations

import json
from typing import Any, Dict

from .base import BaseAgent, AgentContext


SYSTEM_PROMPT = """\
你是一位资深产品经理，代号"许清楚"。
你的职责是将用户的自然语言需求转化为结构化的产品需求文档（PRD）。

【工作流程】
1. 深入理解用户需求
2. 识别目标用户群体（至少3类）
3. 提炼核心功能（至少3个）
4. 描绘关键使用场景（至少3个）
5. 生成优化的项目简介（200字以内）
6. 按5维度自评，低于80分时列出需要用户澄清的问题

【评分维度】
- 背景清晰度（满分15）：需求背景是否清晰
- 价值定义（满分20）：收益和衡量指标是否明确
- 解决方案完整性（满分25）：方案描述是否详细
- 验收标准（满分25）：是否可测试、可验收
- 影响范围（满分15）：是否说明涉及改动范围

【输出格式】返回纯 JSON（不要 markdown 代码块）：
{
  "prd": {
    "targetUsers": ["用户A", "用户B"],
    "coreFunctions": ["功能1", "功能2"],
    "keyScenarios": ["场景1", "场景2"],
    "description": "项目简介"
  },
  "score": 85,
  "needs_clarification": false,
  "clarification_questions": []
}

当 needs_clarification 为 true 时，clarification_questions 必须包含具体待澄清问题列表。"""


class PRDAgent(BaseAgent):
    ROLE_NAME = "产品经理「许清楚」"

    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        # 构建提示词：如果有澄清历史，注入之前的问题和用户回答
        prompt_parts = [f"用户原始需求：{context.user_request}"]

        if context.clarification_history:
            prompt_parts.append("\n【之前已进行的澄清轮次】")
            for i, round_info in enumerate(context.clarification_history, 1):
                questions = round_info.get("questions", [])
                user_answer = round_info.get("user_answer", "")
                prompt_parts.append(f"\n第{i}轮澄清：")
                for q in questions:
                    prompt_parts.append(f"  Q: {q}")
                prompt_parts.append(f"  A: {user_answer}")
            prompt_parts.append("\n请基于以上补充信息，重新生成完整的 PRD。")

        raw = await self._call_ai("\n".join(prompt_parts))
        parsed = self._parse_json(raw)

        prd = parsed.get("prd", {})
        score = parsed.get("score", 0)
        needs_clarification = parsed.get("needs_clarification", False)
        questions = parsed.get("clarification_questions", [])

        result = {
            "prd": prd,
            "score": score,
        }

        if needs_clarification and score < 80:
            return {
                "status": "clarification",
                "result": result,
                "clarification": {
                    "score": score,
                    "needs_clarification": True,
                    "questions": questions,
                    "partial_prd": prd,
                },
            }

        return {
            "status": "completed",
            "result": result,
        }
