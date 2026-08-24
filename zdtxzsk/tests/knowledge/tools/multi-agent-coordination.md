---
title: 多Agent协作模式
date: 2026-08-22
scope: tools
author: WorkBuddy
verified: false
tags: [multi-agent, coordination, director]
---
# 多Agent协作模式

## 角色分工

- director：审核决策，最终把关
- strict：质量把控，规范执行
- creative：内容创作，创意输出

## 协作流程

1. creative 产出初稿
2. strict 进行规范检查
3. director 做最终决策

## ASKB 集成

- 每个Agent通过 /api/init 加载各自上下文
- 决策结果通过 /api/report 提交经验
- 模式文档存入 knowledge/tools/