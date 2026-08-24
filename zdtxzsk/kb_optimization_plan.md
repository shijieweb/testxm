# Agent System Knowledge Base V1.0 — 闭环优化方案
> 生成时间：2026-08-21
> 目标：先跑通最小闭环，再扩展多工具使用

---

## 一、现有设计可以优化的地方

### 1.1 经验沉淀规范 → 可以加模板约束

**现状问题**：文档只说了"记录什么类型"，但没有规定格式。
不同 Agent 写的 experience.md 风格会完全不同，后续很难检索和阅读。

**优化建议**：在 `roles/*/experience.md` 加一个统一模板：

```markdown
<!-- 每次新增经验，按以下格式追加 -->

## [日期] 经验标题

- **场景**：什么任务/什么条件下
- **问题**：遇到了什么问题
- **解决**：怎么解决的（或用户怎么纠正的）
- **结论**：以后遇到类似情况怎么办
- **验证次数**：X 次
- **状态**：[待验证 / 已验证 / 已废弃]
```

这样：
- Agent 每次追加都有结构，不会乱写
- 检索时可以按状态过滤（只看"已验证"的）
- 人工审核时快速判断是否成熟（验证次数 ≥ 3 才值得提报）

---

### 1.2 知识查询方式 → V1 必须明确算法

**现状问题**：文档只说"关键词匹配"，没说是精确匹配还是模糊匹配。

**优化建议**：V1 采用两级策略：

| 场景 | 匹配方式 | 说明 |
|------|---------|------|
| 有 ID 查询 | 直接文件读取 | `/api/knowledge/query` 传 `id` 字段 |
| 无 ID 查询 | 文件名 + 标题 YAML 前 50 字匹配 | 不扫描全文，性能可保证 |
| 无结果 | 返回空列表，不报错 | 避免 Agent 误判为系统错误 |

**关键决策**：V1 不做全文搜索，只搜 YAML 元数据（id/name/scope）+ 标题。
理由：V1 知识量预期 < 50 条，元数据足够，等膨胀后再升级。

---

### 1.3 reports/ 的流转机制 → 文档完全空白

**现状问题**：`reports/` 只说了"提交到"，没说怎么审核、怎么迁移。

**优化建议**：补充明确的流转规则：

```
reports/经手稿.md（Agent 提交）
    ↓
人工打开阅读
    ↓
├─ 通过 → 移动到 knowledge/tools/agnes/xxx.md（带 YAML 元数据）
├─ 需修改 → 在 reports/ 内备注后发回给 Agent
└─ 拒绝 → 移动到 reports/rejected/ 并记录原因
```

同时补充：
- `reports/` 目录命名规范：`YYYYMMDD_agent_role_title.md`
- 审核结果也写入 `history/audit-log.md`（一句话记录）

---

### 1.4 history/ 目录 → 需要定义内容

**现状问题**：目录列表里有 `history/`，但全文没说明存什么。

**优化建议**：`history/` 存两类东西：

1. **变更记录**（audit log）：每次知识提交的日期、来源、审核结果
2. **会话进度快照**：对应规则里的"当前进度.md"，跨会话保持状态

---

### 1.5 config.yaml → 需要定义字段

**现状问题**：提到 `config/config.yaml`，但字段完全空白。

**优化建议**：定义最小配置：

```yaml
# config/config.yaml
version: "1.0"
kb_root: "."

personas:
  - name: strict
    display_name: 严谨型
  - name: creative
    display_name: 创意型
  - name: guide
    display_name: 引导型

defaults:
  persona: strict
  language: zh-CN

paths:
  roles: "roles"
  projects: "projects"
  knowledge: "knowledge"
  reports: "reports"
  history: "history"
  server_port: 8765
```

---

## 二、最小闭环还缺什么（必须补）

### 2.1 🔴 缺失：HTTP 服务器实现

这是整个系统最大的缺口。文档定义了 API，但没有后端。

**V1 最小实现方案**（Python Flask，零依赖安装）：

```python
# server.py — V1 最小 HTTP 服务器
import os
import yaml
import json
from flask import Flask, request, jsonify

app = Flask(__name__)
KB_ROOT = os.environ.get('KB_ROOT', '.')

@app.route('/api/init', methods=['POST'])
def init():
    data = request.json
    persona = data.get('persona', 'strict')
    role = data.get('role', '')
    project = data.get('project', '')
    
    # 拼装上下文
    context_parts = []
    
    # 1. 人格
    persona_file = f'config/personas/{persona}.md'
    if os.path.exists(persona_file):
        context_parts.append(f"## 人格\n{open(persona_file).read()}")
    
    # 2. 角色
    role_file = f'roles/{role}/role.md'
    if os.path.exists(role_file):
        context_parts.append(f"## 角色\n{open(role_file).read()}")
    
    # 3. 项目
    proj_file = f'projects/{project}/project.md'
    if os.path.exists(proj_file):
        context_parts.append(f"## 项目\n{open(proj_file).read()}")
    
    return jsonify({
        "context": "\n---\n".join(context_parts),
        "persona": persona,
        "role": role,
        "project": project
    })

@app.route('/api/knowledge/query', methods=['POST'])
def query():
    data = request.json
    query_text = data.get('query', '')
    role = data.get('role', '')
    project = data.get('project', '')
    
    results = []
    search_dirs = []
    if role: search_dirs.append(f'roles/{role}')
    if project: search_dirs.append(f'projects/{project}/knowledge')
    search_dirs.append('knowledge/tools')
    search_dirs.append('knowledge/common')
    
    for d in search_dirs:
        if not os.path.exists(d): continue
        for root, _, files in os.walk(d):
            for f in files:
                if not f.endswith('.md'): continue
                path = os.path.join(root, f)
                content = open(path, encoding='utf-8').read()
                if query_text in content[:200]:  # 只搜前200字（含YAML头）
                    results.append({"path": path, "preview": content[:300]})
    
    return jsonify({"results": results, "count": len(results)})

@app.route('/api/report', methods=['POST'])
def report():
    data = request.json
    agent = data.get('agent', 'unknown')
    role = data.get('role', 'unknown')
    content = data.get('content', '')
    
    import datetime
    date_str = datetime.datetime.now().strftime('%Y%m%d')
    filename = f"reports/{date_str}_{agent}_{role}_report.md"
    
    os.makedirs('reports', exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# 经验报告\n\n")
        f.write(f"- **Agent**: {agent}\n")
        f.write(f"- **角色**: {role}\n")
        f.write(f"- **提交时间**: {datetime.datetime.now().isoformat()}\n\n")
        f.write(content)
    
    return jsonify({"status": "saved", "path": filename})

if __name__ == '__main__':
    port = int(os.environ.get('SERVER_PORT', 8765))
    app.run(host='0.0.0.0', port=port, debug=False)
```

---

### 2.2 🔴 缺失：人格定义文件

文档提到通用人格（strict/creative/guide），但没有定义具体内容。

**需要创建**：`config/personas/strict.md`

```markdown
# 严谨型人格

## 行为准则
- 不猜测未验证的信息
- 遇到不确定时主动追问
- 输出前做自检
- 发现错误立即承认并纠正

## 交流风格
- 简洁直接，不说废话
- 给选项而不是给开放式问题
- 重要决策点标记[需要确认]

## 纠错响应
- 被纠正时：记录到偏好记录.md
- 被纠正后：立即调整，不辩解
```

---

### 2.3 🟡 缺失：经验写入规范（Agent 侧）

文档定义了经验类型（成功/避坑/纠正/解决），但 Agent 实际怎么写没规定。

**需要在 `偏好记录.md` 或全局规则中明确**：

```
经验记录触发条件：
1. 完成任务后，回顾过程中有价值的发现
2. 被用户纠正后，判断是否为长期偏好
3. 遇到新问题且有解决方案时

写入位置：
- 当次会话的快速复盘 → 纠错复盘/YYYYMMDD_原因_避免_补救.md
- 长期经验 → roles/{role}/experience.md（追加格式，见上方模板）

不写入的情况：
- 一次性偶发问题，无复用价值
- 已知知识的重复记录
```

---

### 2.4 🟡 缺失：初始化流程标准化

当前 `偏好记录.md` 和 `当前进度.md` 是手动维护的，没有系统化的初始化流程。

**建议**：将初始化流程固化到 `config/init-checklist.md`：

```markdown
# Agent 启动检查清单

## 开局三步
1. [ ] 读 `偏好记录.md` → 获取称呼/规则/历史偏好
2. [ ] 读 `当前进度.md` → 判断是续战还是新建
   - 文件存在且有实质内容 → 问老板"是否继续上次任务"
   - 文件只有占位符 → 正常开局
3. [ ] 确认项目上下文 → 调用 /api/init 获取角色+项目配置

## 收尾三步
1. [ ] 更新 `当前进度.md`（如果任务未完成或跨会话）
2. [ ] 判断是否记录经验 → 是则追加到 experience.md
3. [ ] 生成纠错复盘（如果有被纠正的情况）
```

---

## 三、多工具接入方案（固定下来）

### 3.1 接入模型设计

```
                    ┌──────────────────────┐
                    │   ASKB HTTP Server   │
                    │   (端口 8765 固定)    │
                    └──────────┬───────────┘
               ┌───────────────┼───────────────┐
               ↓               ↓               ↓
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │  WorkBuddy │ │  TRAE      │ │ Claude     │
        │   (Skill)  │ │  (MCP)     │ │  Code      │
        └────────────┘ └────────────┘ └────────────┘
               │               │               │
               └───────────────┴───────────────┘
                            ↓
              统一 HTTP 接口（不变）
```

### 3.2 各工具接入方式（固定定义）

| 工具 | 接入方式 | 命令/技能名 | 说明 |
|------|---------|-----------|------|
| WorkBuddy | Skill | `askb-init`, `askb-query`, `askb-report` | 内置 Skill 调用 HTTP |
| TRAE | MCP | `mcp_askb` server | 标准 MCP 协议 |
| Claude Code | HTTP | `curl http://localhost:8765/api/init` | 直接用 shell 调用 |
| OpenClaw | MCP | `mcp_askb` | 同 TRAE |

### 3.3 跨工具使用的关键约束（固定规则）

**规则1：知识库根路径固定**
> 所有工具共享同一套文件系统，路径以 `c:\Users\67972\Documents\agentsystemwike\` 为根。

**规则2：接口协议固定（不随工具变化）**
> 三个接口 `{init, query, report}` 的入参和出参格式，对所有工具完全一致。工具只做封装，不改协议。

**规则3：经验文件只追加，不覆盖**
> 所有 Agent 写 `experience.md` 时，末尾追加，不覆盖已有内容。多人编辑时用 Git 处理冲突。

**规则4：端口固定**
> ASKB HTTP 服务固定使用端口 `8765`，所有工具连接同一个地址。

---

## 四、最小闭环行动清单

```
第一步：建目录（5分钟）
  mkdir -p config/personas roles/director roles/java-developer \
          projects/short-drama projects/java-platform \
          knowledge/common knowledge/tools knowledge/projects \
          reports history

第二步：写配置文件（10分钟）
  - config/config.yaml（见上方模板）
  - config/personas/strict.md（见上方模板）
  - roles/director/role.md（从文档第10条提取）
  - projects/short-drama/project.md（从文档第12条提取）

第三步：启动 HTTP 服务（5分钟）
  pip install flask pyyaml
  python server.py

第四步：测试 /api/init（1分钟）
  curl -X POST http://localhost:8765/api/init \
    -H "Content-Type: application/json" \
    -d '{"agent":"workbuddy","persona":"strict","role":"director","project":"short-drama"}'

第五步：跑一次真实任务，验证经验记录流程
```

预计总耗时：**30 分钟内完成最小闭环**。

---

## 五、V1 vs V2 边界

| 功能 | V1 | V2 |
|------|----|----|
| 存储 | 文件系统 | + SQLite（可选） |
| 搜索 | 关键词匹配 | + 向量检索 |
| 提交 | 人工触发 | + 自动触发（条件满足时） |
| 审核 | 人工审核 | + 自动初筛 |
| 权限 | 无 | + 读写权限 |
| 多Agent并发 | 不加锁（小量） | + 文件锁/乐观锁 |

**V1 原则：能跑就行，不要设计过度。**

---

## 六、自检清单（回答后必检）

- [x] 前提：当前 workspace 为空，从零开始
- [x] 边界：V1 只做最小闭环，不做高级功能
- [x] 兜底：如果 HTTP 服务启动失败，仍可手动读写文件完成核心流程
- [x] 多工具兼容：三个 API 对所有工具协议一致
- [x] 经验沉淀规范：已补充模板和触发条件
- [x] 闭环完整性：init → 执行 → query → report → 审核 全流程已覆盖
