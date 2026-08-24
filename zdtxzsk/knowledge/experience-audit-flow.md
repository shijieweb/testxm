---
title: 经验沉淀与审核流程
scope: common
tags: [askb, experience, audit]
verified: true
---

# 经验沉淀与审核流程

## 流转路径
```
Agent 完成任务/被纠正
    ↓
写纠错复盘 → 纠错复盘/YYYYMMDD_原因_避免_补救.md
    ↓
判断是否为长期经验 → 是则追加到 roles/{role}/experience.md
    ↓
调用 /api/report 提交 → reports/YYYYMMDD_agent_role_report.md
    ↓
人工审核（打开 reports/ 阅读）
    ↓
├─ 通过 → 迁入 knowledge/tools/ 或 knowledge/common/（带 YAML 元数据）
├─ 需修改 → 在 reports/ 内备注后发回给 Agent
└─ 拒绝 → 记录原因到 history/audit-log.md
```

## 经验条目格式
```markdown
## YYYY-MM-DD 经验标题

- **场景**：什么任务/什么条件下
- **问题**：遇到了什么问题
- **解决**：怎么解决的
- **结论**：以后遇到类似情况怎么办
- **验证次数**：X 次
- **状态**：[待验证 / 已验证 / 已废弃]
```

## 审核判断标准
- 验证次数 ≥ 2 且状态为"已验证" → 可迁入 knowledge/
- 仅出现 1 次的经验 → 保留在 experience.md，暂不迁入知识
- 与已有知识重复 → 标记[废弃]，不重复写入
