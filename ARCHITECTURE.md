# 专家协作体系 · 项目架构文档

> 本文档供下一个 Agent 接手时快速理解整个项目结构和运行机制。

---

## 一、项目概述

本项目构建了一套**自演进 AI 专家协作系统**，核心包含两大模块：

| 模块 | 路径 | 说明 |
|------|------|------|
| 专家协作核心 | `/workspace/roles/` | 26个专家角色定义 + 调度规则 |
| 需求澄清官原型 | `/workspace/requirement-clarifier/` | 可视化Web原型，可本地运行测试 |

### 架构全景

```
用户请求
   ↓
Conductor (调度者, conductor.md)
   ├─ 步骤①: 解析意图 → 调用 专家池 expert_pool.md
   ├─ 步骤②: 子Agent并发生成(最多3个)
   ├─ 步骤③: ⭐ 需求澄清官先行锁死需求(评分≥60放行)
   ├─ 步骤④⑤⑥: 专家协同产出
   ├─ 步骤⑦: 评审员验收(≥60通过, <60打回)
   ├─ 步骤⑧⑨⑩: 返工/交付/知识沉淀
   └─ 经验日志: experience_log.md 持续积累

├── roles/expert_pool.md          ← 26个专家角色精简版
├── roles/expert_prompt_template.md ← 8层提示词模板
├── roles/conductor_rules.md      ← 调度规则(评分卡/门禁/组合模式)
├── roles/feedback_loop.md        ← 返工闭环流程
├── roles/code_guardian.md        ← 代码安全员专项规范
├── roles/short_drama_group.md    ← 短剧组（预留扩展）

└── requirement-clarifier/        ← 需求澄清官 Web 原型
    ├── index.html                ← 左-右分栏布局
    ├── styles.css                ← 暗色科技感样式
    ├── app.js                    ← 前端交互逻辑(对话流+可视化)
    └── api.js                    ← 规则引擎(5维评分+追问路由)
```

---

## 二、规则引擎核心（api.js）

### 5维评分卡

| 维度 | 键名 | 满分 | 通过线(60%) | 说明 |
|------|------|------|------------|------|
| 目标清晰 | `goal` | 25 | 15 | 一句话能否说清要什么 |
| 用户/场景 | `audience` | 15 | 9 | 为谁做、什么场景用 |
| 边界 | `boundary` | 15 | 9 | 明确不做什么 |
| 成功标准 | `success` | 25 | 15 | 用什么指标判成功 |
| 优先级 | `priority` | 20 | 12 | P0/P1/P2 或主次 |

**总门槛：≥60分（百分制）才放行生成文档。**

### 追问路由算法

```
askClarifier(collect, history) → {type, text, dim?}
  遍历 DIM_ORDER = [goal, audience, boundary, success, priority]
  → 找第一个 (score * max) < max * 0.6 的维度
  → 调用 makeQuestionForDim(d, collect) 生成追问文案
  → 所有维度达标 → 返回 {type:'ready', text:'...'}
```

**注意：** `score` 是比率（0~1），`max` 是绝对分，比较时必须转换：`(info.score * info.max) < info.max * 0.6`。

### extractFromAnswer(dimKey, answer) → {score, note}

每个回答的评分规则：
- 基础分：≥6字 → 0.34，否则 0
- 含数字/时间词（`/[0-9０-９%％年月日个万亿分清]/`）→ +0.16
- 含维度专属关键词 → +0.06
- 长度≥30字 → +0.05（封顶0.6）

**单轮最高得分：0.6（一个维度通常需要2~3轮才能达到60%线）**

---

## 三、运行方式

### 方式A：Web 原型本地运行（推荐先测）

```bash
# 进入项目目录
cd /workspace/requirement-clarifier

# 启动本地服务（端口8090）
python3 -m http.server 8090

# 浏览器打开 http://localhost:8090
```

### 方式B：Node.js 单元测试

```bash
cd /workspace/requirement-clarifier

# 跑基础单元测试
node test_unit.mjs

# 跑端到端多轮模拟
node test_flow.mjs
```

### 方式C：集成真实 LLM（待接入）

当前 `api.js` 已预留接口，切换模式：

```javascript
// 找到这一行（api.js 第2行）
const MOCK_MODE = true;  // ← 改为 false 接入真实 API
const API_BASE = 'http://localhost:11434/v1';  // 本地代理地址
const API_MODEL = 'qwen2.5:7b';
const API_KEY = 'EMPTY';
```

API 代理服务器需部署在 `localhost:11434`（OpenAI 兼容格式）。

---

## 四、文件清单（不含 token/密钥）

| 文件 | 大小 | 用途 |
|------|------|------|
| `roles/conductor.md` | ~10KB | 主调度者提示词（10步流程） |
| `roles/expert_pool.md` | ~7KB | 26个专家角色定义（精简版） |
| `roles/expert_prompt_template.md` | ~3KB | 8层提示词模板 |
| `roles/conductor_rules.md` | ~9KB | 调度规则：映射表/评分卡/门禁/入库 |
| `roles/feedback_loop.md` | ~6KB | 评审返工闭环 |
| `roles/code_guardian.md` | ~5KB | 代码安全员规范 |
| `roles/short_drama_group.md` | ~3KB | 短剧组（预留） |
| `roles/experience_log.md` | ~2KB | 踩坑经验日志 |
| `requirement-clarifier/index.html` | ~6KB | 左-右分栏 HTML |
| `requirement-clarifier/styles.css` | ~7KB | 暗色科技感样式 |
| `requirement-clarifier/app.js` | ~9KB | 前端交互逻辑 |
| `requirement-clarifier/api.js` | ~6KB | 规则引擎（可替换LLM） |
| `requirement-clarifier/test_unit.mjs` | ~3KB | 单元测试（7项） |
| `requirement-clarifier/test_flow.mjs` | ~5KB | 端到端流程模拟 |

---

## 五、关键设计决策与已知限制

### 设计决策
1. **双模架构**：当前规则引擎可无缝切换为 LLM 调用，仅改 `MOCK_MODE` 一行
2. **评分粒度**：单轮回答最高0.6分，确保至少2~3轮互动，不一次给足
3. **防死循环**：`test_flow.mjs` 中已加入死循环检测（连续得分=0则终止）

### 已知限制
1. **短剧组未完成**：`short_drama_group.md` 内容为占位符，尚未实现
2. **LLM 未接入**：当前为规则引擎模拟，`MOCK_MODE=true`
3. **无持久化记忆**：`experience_log.md` 纯文本，重启后不清除但不自动加载
4. **前端无后端**：Web 原型完全前端运行，无数据库/持久化

### 下一步建议（给下一 Agent）
1. 接入真实 LLM：修改 `api.js`，替换 `extractFromAnswer` 和 `makeQuestionForDim` 为 LLM 调用
2. 完成短剧组：实现编导→剧作→分镜→剪辑生产链
3. 添加持久化：LocalStorage 保存澄清进度，刷新不丢失
4. 增加 WebSocket：支持多人协作澄清同一需求

---

## 六、快速上手检查清单

- [ ] 运行 `node test_unit.mjs` 全部通过（7/7）
- [ ] 运行 `node test_flow.mjs` 完成多轮模拟（约8轮达标）
- [ ] 打开浏览器预览 http://localhost:8090 验证雷达图联动
- [ ] 阅读 `roles/conductor.md` 理解10步调度流程
- [ ] 阅读 `roles/conductor_rules.md` 理解评分门禁和入库规则
- [ ] 阅读 `LESSONS_LEARNED.md` 了解已踩过的坑
- [ ] 确认无敏感信息（token/密钥）泄露
