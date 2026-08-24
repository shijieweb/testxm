---
title: 目录结构规范
scope: tools
tags: [askb, structure, filesystem]
verified: true
---

# ASKB 目录结构规范

## 根目录
```
agentsystemwike/
├── config/              # 全局配置
│   ├── config.yaml      # 主配置（人格、路径、端口）
│   └── personas/        # 人格定义文件
│       ├── strict.md
│       ├── creative.md
│       └── guide.md
├── roles/               # 角色定义
│   └── {role-name}/
│       ├── role.md      # 角色说明
│       └── experience.md # 该角色积累的经验
├── projects/            # 项目定义
│   └── {project-name}/
│       ├── project.md   # 项目描述
│       └── knowledge/   # 项目专属知识
├── knowledge/           # 共享知识库
│   ├── tools/           # 工具类知识（API 指南等）
│   ├── common/          # 通用知识（目录规范等）
│   └── projects/        # 项目级公共知识
├── reports/             # 经验提交暂存区（待审核）
├── history/             # 历史记录
│   └── audit-log.md     # 审核日志
├── 纠错复盘/             # 纠错复盘记录（日期命名）
├── 偏好记录.md           # 跨会话偏好（只追加）
├── 当前进度.md           # 跨会话进度快照
└── server.py            # HTTP 服务
```

## 文件命名规范
- 角色目录：小写连字符，如 `java-developer`
- 项目目录：小写连字符，如 `short-drama`
- 经验报告：`YYYYMMDD_agent_role_title.md`
- 纠错复盘：`YYYYMMDD_原因_避免_补救.md`
- 知识条目：建议用 YAML front matter 的 `title` 字段作为标题

## YAML 元数据规范
所有 `.md` 知识条目建议包含 YAML front matter：
```yaml
---
title: 条目标题
scope: tools | common | projects
tags: [tag1, tag2]
verified: false   # 是否经人工审核
created: 2026-08-22
---
```
