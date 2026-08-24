---
title: 短剧内容生产管线
scope: projects
tags: [short-drama, pipeline, content-production, workflow]
verified: false
created: 2026-08-22
---

# 短剧内容生产管线

## 概述
面向短视频平台的短剧内容自动化生产流程，分为四个阶段。

## 生产阶段

### Phase 1: 剧本创作（Script Writing）
- **输入**：题材方向 + 目标平台 + 集数规划
- **输出**：完整剧本（含场景描述、对白、动作提示）
- **负责人**：director（内容把控）+ AI（初稿生成）
- **验收标准**：每集 ≥ 3 个冲突点，节奏符合短视频消费习惯
- **关键约束**：单集时长控制在 1-3 分钟，前 3 秒必须有钩子

### Phase 2: 分镜设计（Storyboard）
- **输入**：剧本 + 导演意图
- **输出**：分镜表（镜头号/景别/角度/时长/备注）
- **负责人**：director
- **关键约束**：竖屏 9:16 构图，避免大场景全景

### Phase 3: 脚本生成（Script Generation）
- **输入**：分镜表 + 角色设定
- **输出**：拍摄脚本（台词文本 + 语气提示 + BGM 建议）
- **负责人**：AI + director 审核
- **工具依赖**：ASKB（存储角色设定和过往脚本风格）

### Phase 4: 后期审核（Post Review）
- **输入**：完成素材
- **输出**：审核意见 + 修改建议
- **负责人**：director
- **检查项**：剧情连贯性、对白质量、时长合规、平台规范

## ASKB 集成点
- `/api/init`：加载 director 角色 + short-drama 项目配置
- `/api/knowledge/query`：查询剧本风格参考、分镜模板、历史审核记录
- `/api/report`：记录审核发现的问题和改进建议
- `roles/director/experience.md`：积累审核标准和决策模式
- `knowledge/projects/short-drama/`：存储项目专属知识

## 注意事项
- 每次创作前必须通过 `/api/init` 确认上下文
- 剧本风格参考通过 `--role director` 查询已有经验
- 重大创作决策需向老板输出选项并等待确认
