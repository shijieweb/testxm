"""QA Agent — 质检工程师「严过关」

职责：对工程师输出进行质量审查，发现 Bug 时触发回溯循环（返回 fixes_needed），
      允许工程师修复后重新审查。
"""
from __future__ import annotations

from typing import Any, Dict, List

from .base import BaseAgent, AgentContext


SYSTEM_PROMPT = """\
你是一位资深 QA 工程师，代号"严过关"。
你的职责是对代码实现进行质量审查，找出 Bug、安全漏洞、性能问题。

【输入】
- PRD（产品需求文档）
- 技术方案（技术选型与架构）
- 工程师实现计划（代码文件列表与 API 定义）

【审查维度】
1. 功能正确性：实现是否符合 PRD 要求
2. 安全性：是否存在注入、越权、XSS 等漏洞
3. 性能：是否有明显性能隐患（N+1 查询、大对象全量加载等）
4. 代码质量：命名规范、错误处理、边界条件

【工作方法】
1. 对照 PRD 检查每个核心功能是否有对应实现
2. 识别潜在 Bug（空值未处理、类型不匹配、边界遗漏）
3. 对每个问题给出：位置、问题描述、严重程度、修复建议

【输出格式】返回纯 JSON（不要 markdown 代码块）：
{
  "bugs": [
    {
      "file": "path/to/file.py",
      "line_hint": "around line N",
      "severity": "high" | "medium" | "low",
      "description": "问题描述",
      "fix_suggestion": "修复建议"
    }
  ],
  "overall_quality": "pass" | "needs_fix",
  "summary": "审查摘要（100字以内）"
}

当 overall_quality 为 "needs_fix" 时，bugs 列表必须非空且包含至少一个 severity 为 "high" 或 "medium" 的问题。
当 overall_quality 为 "pass" 时，bugs 列表可以为空或只包含 low 级别的问题。"""


class QAAgent(BaseAgent):
    ROLE_NAME = "质检工程师「严过关」"

    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        prd = context.stage_outputs.get("prd_step", {}).get("result", {}).get("prd", {})
        arch = context.stage_outputs.get("architect_step", {}).get("result", {})
        eng = context.stage_outputs.get("engineer_step", {}).get("result", {})

        # 如果有工程回溯历史，注入到 prompt 中
        bug_history: List[str] = []
        if context.clarification_history:
            for i, hist in enumerate(context.clarification_history, 1):
                bugs_desc = hist.get("bugs_summary", "")
                if bugs_desc:
                    bug_history.append(f"\n第{i}轮审查发现的问题：\n{bugs_desc}")

        prompt_parts = [
            "请对以下代码实现进行质量审查：",
            f"\n【PRD】\n{prd}",
            f"\n【技术方案】\n{arch}",
            f"\n【工程师实现计划】\n{eng}",
        ]
        if bug_history:
            prompt_parts.append("\n".join(bug_history))
            prompt_parts.append(
                "\n\n以上是之前审查发现的问题，请重点验证这些问题的修复情况。"
            )

        raw = await self._call_ai("\n".join(prompt_parts))
        parsed = self._parse_json(raw)

        bugs = parsed.get("bugs", [])
        overall = parsed.get("overall_quality", "pass")

        # 将 bugs 格式化摘要用于上下文传递
        bugs_summary = ""
        if bugs:
            lines = []
            for b in bugs:
                lines.append(
                    f"  [{b.get('severity', 'unknown')}] {b.get('file', '?')}: {b.get('description', '')}"
                )
            bugs_summary = "\n".join(lines)

        result = {
            "bugs": bugs,
            "overall_quality": overall,
            "summary": parsed.get("summary", ""),
        }

        if overall == "needs_fix" and bugs:
            return {
                "status": "needs_fix",
                "result": result,
                "bug_reflux": {
                    "bugs": bugs,
                    "bugs_summary": bugs_summary,
                    "round": len(context.clarification_history) + 1,
                },
            }

        return {
            "status": "completed",
            "result": result,
        }
