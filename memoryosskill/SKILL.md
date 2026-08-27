---
name: memos-kb
description: MemOS 云端记忆接入工具。写入对话/知识到 MemOS（自动提炼），召回提炼后的记忆（事实/偏好/事件/技能），支持来源标记、相关性阈值、类型过滤、反馈纠正。Use when: (1) 需要把重要信息/决策/偏好写入长期记忆, (2) 需要召回过去的记忆/偏好/经验, (3) 需要审计或清理云端记忆, (4) 需要纠正记忆错误。
---

# MemOS 云端记忆工具

通过 MemOS Cloud API 实现长期记忆的写入、召回、审计与纠正。
数据与 Trae/DSH 共享（user_id=traeweb），写入自动带来源标记（integration=openclaw）。

## 快速开始

### 写入记忆（任务收尾/重要信息）

```bash
# 写入一条消息（自动带 openclaw 来源标记）
python3 {baseDir}/scripts/kb.py add "决策：记忆系统采用 MemOS 云端方案，先用插件后自建"

# 带会话ID和标签
python3 {baseDir}/scripts/kb.py add "老板要求：分析问题必须从闭环角度多角度出发" --conversation "openclaw:2026-08-27" --tags "规则,思维模式"

# 带助手回复（更完整的对话上下文）
python3 {baseDir}/scripts/kb.py add "行情数据源用腾讯接口" --assistant "已记录，qt.gtimg.cn带Referer头无403"
```

### 召回记忆（对话时/需要时）

```bash
# 默认召回（事实+偏好，阈值0.6，限量6）
python3 {baseDir}/scripts/kb.py search "行情数据源"

# 指定类型召回
python3 {baseDir}/scripts/kb.py search "老板的规则" --type "preference,fact"

# 只查事件记忆
python3 {baseDir}/scripts/kb.py search "我们讨论过什么" --type "event"

# 调阈值
python3 {baseDir}/scripts/kb.py search "项目进度" --relativity 0.5 --limit 10
```

### 审计与纠正

```bash
# 查看全部记忆（带来源标记）
python3 {baseDir}/scripts/kb.py get --page 1 --size 20

# 纠正错误记忆（反馈机制）
python3 {baseDir}/scripts/kb.py feedback "<记忆ID>" "这个记错了，应该是XXX"

# 删除测试数据
python3 {baseDir}/scripts/kb.py delete --conversation "openclaw_test_xxx"
```

## 使用规范（重要）

### 什么时候写（任务收尾固定动作）
1. **老板明确说"记住/以后/永久"** → 立即写
2. **任务交付完成时** → 总结关键决策/结论/数据源
3. **踩坑/教训发生时** → 记录错误和纠正方法
4. **重要偏好/规则确认时** → 记录（带来源标记）

### 怎么写得更好（结构化）
- 写**结论/事实/决策**，不写过程流水
- 用**指令式**（"查行情时：用腾讯接口"），不用描述式（"讨论了行情"）
- 关键数字/路径/参数必须带上
- 一次写一条，不混装

### 召回结果怎么用
- 召回的记忆带 `[来源]` 标记：`[openclaw]`=我们写的，`[deepseek-harness]`=Trae/DSH写的
- 不确定来源时明说"不确定"，不假装知道
- 低相关度（<0.6）的结果不采用
- 记忆与当前事实冲突时，以当前事实为准并反馈纠正

## 配置

- API Key：`~/.openclaw-autoclaw/.env` 的 `MEMOS_API_KEY`（已配置）
- 用户ID：`traeweb`（与 Trae/DSH 共享记忆）
- 来源标记：写入自动带 `info: {"integration":"openclaw","agent":"main"}`

## 验证

```bash
# 写入测试
python3 {baseDir}/scripts/kb.py add "测试写入" --tags "test"
# 等10秒后召回
python3 {baseDir}/scripts/kb.py search "测试"
# 清理测试数据
python3 {baseDir}/scripts/kb.py delete --conversation "openclaw:2026-08-27"
```
