#!/usr/bin/env python3
"""
ASKB 本地服务全流程验证脚本（通过真实 HTTP API）
模拟 Agent 完整工作流：init → query → create → report → verify
"""
import sys, os, json, subprocess
from pathlib import Path

import urllib.request

# KB_ROOT = 工作区根目录（script 在 tests/ 下，需向上两级）
KB_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(KB_ROOT))

BASE = "http://localhost:8765"

def req(method, path, payload=None):
    url = BASE + path
    data = json.dumps(payload).encode() if payload else None
    r = urllib.request.Request(url, data=data,
        headers={"Content-Type": "application/json"}, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()}
    except Exception as e:
        return 0, {"error": str(e)}

def check(name, condition, detail=""):
    ok = bool(condition)
    tag = "✅ PASS" if ok else "❌ FAIL"
    msg = f"  {tag}  {name}"
    if detail:
        msg += f"  ({detail})"
    print(msg)
    return ok

passed = failed = 0
def track(name, condition, detail=""):
    global passed, failed
    ok = check(name, condition, detail)
    if ok: passed += 1
    else: failed += 1
    return ok

print("=" * 60)
print("  ASKB 本地服务全流程验证（HTTP API）")
print(f"  服务器: {BASE}")
print(f"  KB_ROOT: {KB_ROOT}")
print("=" * 60)
print()

# ─────────────────────────────────────────────
# STEP 1: Health Check
# ─────────────────────────────────────────────
print("[STEP 1] Health Check")
code, data = req("GET", "/health")
track("HTTP 200", code == 200, f"status={code}")
track("status=running", data.get("status") == "running")
track("kb_root 正确", data.get("kb_root") == str(KB_ROOT), f"got={data.get('kb_root')}")
print()

# ─────────────────────────────────────────────
# STEP 2: Init Agent Context
# ─────────────────────────────────────────────
print("[STEP 2] Init Agent Context — WorkBuddy/director/short-drama")
code, data = req("POST", "/api/init", {
    "agent": "WorkBuddy",
    "persona": "director",
    "role": "director",
    "project": "short-drama"
})
track("HTTP 200", code == 200, f"status={code}")
track("has context", "context" in data and len(data.get("context", "")) > 0,
      f"context_len={len(data.get('context',''))}")
track("has files_loaded", "files_loaded" in data and len(data["files_loaded"]) > 0,
      f"files={data.get('files_loaded', [])}")
track("agent=WorkBuddy", data.get("agent") == "WorkBuddy")
track("role=director", data.get("role") == "director")
track("project=short-drama", data.get("project") == "short-drama")
print()

# ─────────────────────────────────────────────
# STEP 3: Query Knowledge
# ─────────────────────────────────────────────
print("[STEP 3] Query Knowledge (多关键词)")
queries = [
    ("tdd", "TDD开发规范", None),
    ("workflow", "工作流审核", None),
    ("pipeline", "生产管线", "short-drama"),
    ("审核", "导演审核框架", None),
]
for keyword, label, project in queries:
    payload = {"query": keyword, "role": "director"}
    if project:
        payload["project"] = project
    code, data = req("POST", "/api/knowledge/query", payload)
    ok = code == 200 and data.get("count", 0) > 0
    track(f"query '{label}'", ok, f"count={data.get('count',0)}")
    if ok:
        for r in data.get("results", [])[:2]:
            print(f"         → {r.get('title','')} [{r.get('scope','')}]")
print()

# ─────────────────────────────────────────────
# STEP 4: List All Knowledge
# ─────────────────────────────────────────────
print("[STEP 4] List All Knowledge")
code, data = req("GET", "/api/knowledge/list")
track("HTTP 200", code == 200)
total = data.get("total", 0)
track("total >= 9", total >= 9, f"total={total}")
items = data.get("items", [])
track("has entries", len(items) > 0, f"items={len(items)}")
track("path字段完整", all("path" in e and "title" in e for e in items))
print()

# ─────────────────────────────────────────────
# STEP 5: Create New Knowledge Entries
# ─────────────────────────────────────────────
print("[STEP 5] 创建新知识条目并验证搜索")

new_entries = [
    {
        "path": "knowledge/projects/short-drama/hook-patterns.md",
        "content": """---
title: 短剧开头钩子模式
date: 2026-08-22
scope: projects
author: WorkBuddy
verified: false
tags: [short-drama, hook]
---
# 短剧开头钩子模式

## 黄金3秒法则

前3秒决定用户是否继续观看。

## 常用钩子类型

1. 冲突型：直接展示矛盾
2. 悬念型：留下未解之谜  
3. 反转型：先建立预期再打破

## ASKB集成点

- 创建前调用 /api/init 确认项目上下文
- 完成后调用 /api/report 记录经验
"""
    },
    {
        "path": "knowledge/tools/multi-agent-coordination.md",
        "content": """---
title: 多Agent协作模式
date: 2026-08-22
scope: tools
author: WorkBuddy
verified: false
tags: [multi-agent, coordination]
---
# 多Agent协作模式

## 三级审核流程

- creative：产出初稿，专注创意
- strict：规范检查，把控质量
- director：最终决策，模式抽象

## ASKB 集成

每个Agent通过 /api/init 加载上下文，
决策结果通过 /api/report 提交经验。
"""
    }
]

for entry in new_entries:
    p = KB_ROOT / entry["path"]
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(entry["content"], encoding="utf-8")
    print(f"  ✏️  写入: {entry['path']}")

# 验证新条目可搜索
code, data = req("POST", "/api/knowledge/query", {"query": "钩子", "role": "director"})
track("新条目可搜索(钩子)", data.get("count", 0) > 0, f"count={data.get('count',0)}")

code, data = req("POST", "/api/knowledge/query", {"query": "multi-agent", "role": "director"})
track("新条目可搜索(multi-agent)", data.get("count", 0) > 0, f"count={data.get('count',0)}")
print()

# ─────────────────────────────────────────────
# STEP 6: Submit Experience Report
# ─────────────────────────────────────────────
print("[STEP 6] 提交经验报告 /api/report")
report_payload = {
    "agent": "WorkBuddy",
    "role": "director",
    "content": """# 短剧知识库+多Agent协作经验报告

## 任务概述
完成短剧项目知识库建设（新增3条knowledge）及多Agent协作模式文档编写。

## 关键发现
1. V1搜索200字限制：高频检索词必须在YAML title中，否则不可搜
2. pytest跨文件KB_ROOT污染：需在每个搜索测试中显式重置KB_ROOT
3. 多Agent协作流程顺畅：creative→strict→director三级审核可完整记录

## 经验沉淀
- knowledge条目建设应TDD先行，先写搜索测试再建内容
- /api/report 机制让经验自动沉淀到 reports/ 和 audit-log.md
"""
}
code, data = req("POST", "/api/report", report_payload)
track("HTTP 200", code == 200, f"status={code}")
saved_path = data.get("path", "")
track("report已写入", "report.md" in saved_path, f"path={saved_path}")
track("有filename字段", bool(data.get("filename")), f"filename={data.get('filename')}")
print(f"         → saved: {saved_path}")
print()

# ─────────────────────────────────────────────
# STEP 7: Verify Audit Log on Disk
# ─────────────────────────────────────────────
print("[STEP 7] 审计日志验证")
audit_file = KB_ROOT / "history" / "audit-log.md"
track("audit-log.md 存在", audit_file.exists(), f"path={audit_file}")
if audit_file.exists():
    log_content = audit_file.read_text(encoding="utf-8")
    lines = [l for l in log_content.strip().split("\n") if l.strip()]
    track("audit 有记录", len(lines) > 1, f"lines={len(lines)}")
    track("最新记录含 workbuddy", any("workbuddy" in l.lower() for l in lines[-5:]),
          f"last: {lines[-1][:80] if lines else 'empty'}")
print()

# ─────────────────────────────────────────────
# STEP 8: Disk Integrity
# ─────────────────────────────────────────────
print("[STEP 8] 磁盘完整性检查")
required_dirs = ["knowledge", "roles", "projects", "reports", "history", "config"]
for d in required_dirs:
    p = KB_ROOT / d
    track(f"dir {d}/", p.exists() and p.is_dir())

required_files = [
    "config/config.yaml",
    "config/personas/director.md",
    "roles/director/role.md",
    "roles/director/experience.md",
    "projects/short-drama/project.md",
    "projects/java-platform/project.md",
    "偏好记录.md",
]
for f in required_files:
    p = KB_ROOT / f
    exists = p.exists()
    size = p.stat().st_size if exists else 0
    track(f"file {f}", exists and size > 0, f"size={size}")

report_files = list((KB_ROOT / "reports").glob("*20260822*director*.md"))
track("report 文件存在", len(report_files) >= 1, f"found={len(report_files)}")
print()

# ─────────────────────────────────────────────
# STEP 9: TDD 全量测试
# ─────────────────────────────────────────────
print("[STEP 9] TDD 全量测试套件")
result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-q", "--tb=line"],
    cwd=str(KB_ROOT),
    capture_output=True, text=True, timeout=30
)
output = result.stdout.strip()
last_line = output.split("\n")[-1] if output else ""
# pytest -q 输出最后一行形如: "53 passed in 0.70s"
all_pass = "passed" in last_line and ("0 failed" in last_line or "failed" not in last_line)
track("pytest 全部通过", all_pass, last_line)
if result.returncode != 0:
    print("  STDERR:", result.stderr[:300])
print()

# ─────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────
print("=" * 60)
total = passed + failed
print(f"  结果: {passed}/{total} PASS  |  {failed} FAIL")
print("=" * 60)
if failed == 0:
    print("  ✅ 全流程验证通过！本地服务器工作正常。")
else:
    print(f"  ⚠️  {failed} 项失败，请检查上方详情")
sys.exit(0 if failed == 0 else 1)
