# 经验报告

- **Agent**: WorkBuddy
- **角色**: director
- **提交时间**: 2026-08-22T16:33:07.321362

# 短剧知识库+多Agent协作经验报告

## 任务概述
完成短剧项目知识库建设（新增3条knowledge）及多Agent协作模式文档编写。

## 关键发现
1. V1搜索200字限制：高频检索词必须在YAML title中，否则不可搜
2. pytest跨文件KB_ROOT污染：需在每个搜索测试中显式重置KB_ROOT
3. 多Agent协作流程顺畅：creative→strict→director三级审核可完整记录

## 经验沉淀
- knowledge条目建设应TDD先行，先写搜索测试再建内容
- /api/report 机制让经验自动沉淀到 reports/ 和 audit-log.md
