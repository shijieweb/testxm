# ASKB — Agent System Knowledge Base

> 为多智能体协作系统提供知识管理与经验沉淀能力的轻量级 HTTP 服务。

**当前版本：** V1.0  
**服务器地址：** `http://localhost:8765`  
**测试状态：** ✅ 61/61 TDD 用例通过

---

## 快速开始

### 安装依赖
```bash
pip install -r requirements.txt
```

### 启动服务
```bash
start_server.bat
# 或
python server.py
```

### 验证运行
```bash
curl http://localhost:8765/health
```

### 运行测试
```bash
python -m pytest tests/ -v
```

### CLI 工具
```bash
python askb_client.py health
python askb_client.py init workbuddy strict director short-drama
python askb_client.py query TDD --role director
python askb_client.py report "修复了xxx" --agent workbuddy --role director
python askb_client.py list
```

---

## API 速查

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/init` | POST | 初始化 Agent 上下文 |
| `/api/knowledge/query` | POST | 查询知识 |
| `/api/knowledge/list` | GET | 枚举所有知识 |
| `/api/report` | POST | 提交经验报告 |
| `/api/metrics` | GET | 运行指标 |

完整 API 文档见 [docs/openapi.yaml](docs/openapi.yaml)。

---

## 目录结构

```
├── server.py              # 主服务器（Flask，~445行）
├── askb_client.py         # CLI 工具
├── config/config.yaml     # 全局配置
├── config/personas/       # 人格定义（strict/creative/guide/director）
├── roles/                 # 角色定义 + 经验文件
├── projects/              # 项目定义
├── knowledge/             # 可搜索知识库（tools/common/projects）
├── reports/               # 经验报告（/api/report 写入）
├── history/audit-log.md   # 审计日志（自动维护）
├── tests/                 # TDD 测试套件（61用例）
├── docs/openapi.yaml      # API 规范
├── 偏好记录.md             # Agent 行为规则（必读）
└── 当前进度.md             # 任务进度追踪
```

---

## 架构要点

- **单文件服务器**：所有逻辑在 `server.py` 一个文件中，无外部数据库
- **Markdown 为数据格式**：知识条目、角色定义、项目信息均为 `.md` 文件
- **YAML frontmatter**：知识文件可选元数据（title/scope/tags/verified）
- **线程安全**：audit-log 写入使用 `threading.Lock` 保护
- **CORS 已启用**：支持跨端口调用（供网页看板使用）

---

## 下一步

V2 规划：向量检索升级 / 自动触发经验提交 / 多 Agent 权限隔离。  
详见 [askb-v2-improvement-plan/](askb-v2-improvement-plan/)。

---

*最后更新：2026-08-24*
