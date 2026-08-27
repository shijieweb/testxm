# memos-kb — MemOS 记忆接入技能

> 通过 MemOS Cloud API 让 AI Agent 拥有长期记忆：每轮对话写入完整总结，平台自动提炼/融合，需要时语义召回。

## 功能

- **add** — 写入对话总结到 MemOS（自动提炼）
- **search** — 语义召回记忆（默认 0.6 相关性阈值）
- **get** — 审计查看记忆（日常不用）
- **feedback** — 纠错反馈（平台自动处理）
- **kb** — 知识库管理（创建/上传文件）

## 安装

### 1. 复制技能到你的 skills 目录

```bash
# OpenClaw
cp -r memos-kb ~/.openclaw-autoclaw/skills/
# 或其他 Agent 的 skills 目录（Trae: ~/.trae/skills/ 等）
```

### 2. 配置 API Key

```bash
echo 'MEMOS_API_KEY="你的Key"' >> ~/.openclaw-autoclaw/.env
```

获取 Key：https://memos-dashboard.openmem.net/cn/apikeys/

### 3. 安装依赖

```bash
pip install requests
```

### 4. 验证

```bash
python3 ~/.openclaw-autoclaw/skills/memos-kb/scripts/kb.py search "知识库"
# 能返回结果即安装成功
```

## 配置（重要！每个使用者必须改）

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `MEMOS_API_KEY` | 无 | **必填**，MemOS API Key |
| `MEMOS_AGENT_ID` | `autoclaw` | **必须改成你自己的**（如 `trae-user1`），避免多用户冲突 |
| `MEMOS_INTEGRATION` | `openclaw` | **建议改成你的**（如 `trae`），标记来源 |
| `MEMOS_USER_ID` | `traeweb` | 共享记忆池；想独立记忆就改成自己的 |
| `MEMOS_PRODUCT` | `autoclaw` | 你的产品名 |

> ⚠️ **不修改 MEMOS_AGENT_ID 的后果**：所有写入都标记为 `autoclaw`，无法区分谁写的。请务必改成自己的标识。

## 使用规范

### 写入（每轮对话结束）

```bash
python3 kb.py add "本轮完整总结（背景+决策+细节+因果）" \
  --assistant "你的回复" \
  --conversation "会话ID" \
  --tags "标签1,标签2"
```

**写透原则**：
- 不能只给结论，要完整总结各个关系（背景/调研/数据/结论/因果链）
- 数据量大没关系，平台负责提炼融合
- 自检标准：脱离对话3个月后仍能看懂，才算合格
- 不筛选、不等待、不节流——每轮都写

### 查询（正常沟通中主观判断）

```bash
python3 kb.py search "查询词" --relativity 0.6 --limit 6
```

- 觉得可能有用就查（成本低）
- 搜出来的噪音自己过滤
- 查询词要具体（"腾讯行情接口Referer头"而非"接口"）

### 会话 ID 说明（含示例）

MemOS 用 `conversation_id` 识别会话上下文——**相同 conversation_id 的多轮消息会被识别为同一上下文**，方便平台融合提炼。

### 我是怎么做的（OpenClaw 示例）

**1. 自动获取 sessionKey（无需手动填）**

OpenClaw 环境会自动注入 `OPENCLAW_AGENT_SESSION_KEY`，kb.py 写入时自动读取并作为 `info.session` 标记：

```json
// 写入后 info 里自动带上：
{"integration": "openclaw", "agent": "autoclaw", "session": "agent:main:im:3f54974c"}
```

sessionKey 格式：`agent:<agent名>:<渠道>:<会话ID>`
例如：`agent:main:im:3f54974c`（main agent，IM渠道，会话 3f54974c）

**2. conversation_id 用日期标识（可选）**

如果不传 `--conversation`，默认用 `openclaw:日期`（如 `openclaw:2026-08-27`）——当天所有写入归入同一个会话上下文：

```bash
# 不传 --conversation（默认 openclaw:今天日期）
python3 kb.py add "今天的讨论总结"

# 手动指定会话（推荐：每个项目/话题一个会话ID）
python3 kb.py add "radar-dashboard 部署记录" --conversation "project:radar-dashboard"
```

**3. 其他环境的 sessionKey 示例**

| 环境 | sessionKey 示例 | 说明 |
|---|---|---|
| OpenClaw | `agent:main:im:3f54974c` | 自动注入环境变量 |
| Trae | `dsh:session-36eab225-...` | 会话UUID |
| 手动 | 自己起名，如 `project:xxx` | 想怎么分就怎么分 |

### 为什么要用会话ID

- **同会话融合**：同一 conversation_id 的多轮消息，平台会按时间线融合/覆盖
- **来源可溯**：info.session 标记了是哪次会话写的
- **多项目隔离**：不同项目用不同 conversation_id，检索时可按会话过滤

## 知识库管理

```bash
# 创建知识库
python3 kb.py kb create --name "01-工具类" --desc "工具使用经验"

# 上传知识文件
python3 kb.py kb add --kb-id "知识库ID" --file "文档.md"

# 检索知识库内容（search 时传 knowledgebase_ids）
```

## 知识库分类（建议）

```
01-工具类      工具/接口/软件使用经验
02-项目类      具体项目文档/方案/状态
03-方法论类    可复用方法/流程/策略
04-行业知识类  领域知识/数据/参考
99-其他       暂未归类
```

## 注意事项

- **无删除功能**：纠错用 feedback，平台自动处理（防误删）
- **API 额度**：查询 2万次/月，写入 5万次/月
- **写入异步**：add 后 10-20 秒提炼完成，不用等
- **失败重试**：自动重试 1 次
- **共享记忆**：默认 user_id=traeweb 与 Trae/DSH 共享

## 来源标记

写入自动带来源信息：
```json
{"integration": "openclaw", "agent": "autoclaw", "product": "autoclaw", "session": "会话标识"}
```
召回时可通过 get/memory 查看每条记忆的来源（integration 区分谁写的）。
