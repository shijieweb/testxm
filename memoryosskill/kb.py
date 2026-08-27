#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MemOS 记忆接入 CLI（kb 工具）
用法:
  python3 kb.py add "消息内容" [--conversation "会话ID"] [--tags "tag1,tag2"] [--info '{"key":"val"}']
  python3 kb.py search "查询词" [--type "fact,preference,event,skill"] [--relativity 0.6] [--limit 6]
  python3 kb.py feedback "记忆ID" "反馈内容"
  python3 kb.py get [--page 1] [--size 10]
  python3 kb.py delete --user "traeweb" [--conversation "会话ID"]

环境: MEMOS_API_KEY(或 ~/.openclaw-autoclaw/.env), MEMOS_BASE_URL
"""
import json
import os
import sys
import requests
import argparse
import datetime

# ============ 配置 ============
def load_config():
    base = os.environ.get("MEMOS_BASE_URL", "https://memos.memtensor.cn/api/openmem/v1")
    key = os.environ.get("MEMOS_API_KEY", "")
    if not key:
        # 尝试从 .env 读取
        for env_path in ["/root/.openclaw-autoclaw/.env", "/root/.openclaw/.env"]:
            if os.path.exists(env_path):
                with open(env_path) as f:
                    for line in f:
                        if line.startswith("MEMOS_API_KEY="):
                            key = line.split("=", 1)[1].strip().strip('"')
                            break
                if key:
                    break
    if not key:
        print("❌ 未找到 MEMOS_API_KEY")
        sys.exit(1)
    return base, key

USER_ID = os.environ.get("MEMOS_USER_ID", "traeweb")  # 与 Trae 共享
AGENT_ID = "openclaw"
INFO_MARK = {"integration": "openclaw", "agent": "main", "product": "autoclaw"}

def headers(key):
    return {"Content-Type": "application/json", "Authorization": f"Token {key}"}

def api(base, key, path, data):
    try:
        res = requests.post(f"{base}{path}", headers=headers(key), data=json.dumps(data), timeout=60)
        d = res.json()
        if d.get("code") != 0:
            print(f"❌ API 错误 code={d.get('code')} msg={d.get('message')} path={path}")
            return None
        return d.get("data", {})
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return None

# ============ 命令 ============
def cmd_add(args, base, key):
    """写入消息到 MemOS（自动提炼）"""
    if not args.message:
        print("❌ 需要消息内容")
        return
    conv = args.conversation or f"openclaw:{datetime.date.today()}"
    info = dict(INFO_MARK)
    if args.info:
        try:
            info.update(json.loads(args.info))
        except:
            pass
    data = {
        "user_id": USER_ID,
        "conversation_id": conv,
        "messages": [
            {"role": "user", "content": args.message},
            {"role": "assistant", "content": args.assistant or "已记录。"}
        ],
        "info": info,
        "async_mode": True,
    }
    if args.tags:
        data["tags"] = [t.strip() for t in args.tags.split(",")]
    d = api(base, key, "/add/message", data)
    if d:
        print(f"✅ 已写入 conversation={conv}")
        print(f"   task_id={d.get('task_id','?')} status={d.get('status','?')}")
        print(f"   info标记: {json.dumps(info, ensure_ascii=False)}")
        print("   ⏳ 云端异步提炼中（约10-20秒后可查）")

def cmd_search(args, base, key):
    """召回记忆（只返回提炼结果，不含原始对话）"""
    if not args.query:
        print("❌ 需要查询词")
        return
    # 类型映射
    type_map = {
        "fact": "detail_factual",
        "preference": "preference",
        "event": "event",
        "skill": "skill",
        "profile": "profile",
        "tool": "tool_memory",
    }
    views = []
    if args.type:
        for t in args.type.split(","):
            t = t.strip().lower()
            if t in type_map:
                views.append(type_map[t])
    data = {
        "user_id": USER_ID,
        "query": args.query,
        "relativity": args.relativity,
        "memory_limit_number": args.limit,
    }
    if views:
        data["include_memory_view"] = views
    if args.conversation:
        data["conversation_id"] = args.conversation

    d = api(base, key, "/search/memory", data)
    if not d:
        return

    # 汇总结果
    total = 0
    for k in ["memory_detail_list", "preference_detail_list", "event_detail_list", "skill_detail_list", "profile_detail_list", "tool_memory_detail_list"]:
        items = d.get(k, []) or []
        if items:
            label = {
                "memory_detail_list": "📌 事实记忆",
                "preference_detail_list": "💖 偏好记忆",
                "event_detail_list": "📅 事件记忆",
                "skill_detail_list": "🔧 技能记忆",
                "profile_detail_list": "👤 属性记忆",
                "tool_memory_detail_list": "🛠 工具记忆",
            }[k]
            print(f"\n{label} ({len(items)}条):")
            for item in items[:args.limit]:
                if k == "memory_detail_list":
                    title = item.get("memory_key", "")
                    content = item.get("memory_value", "")
                    src = item.get("info", {}).get("integration", "?") if isinstance(item.get("info"), dict) else "?"
                elif k == "preference_detail_list":
                    title = item.get("preference", "")
                    content = item.get("reasoning", "")
                    src = "?"
                elif k == "event_detail_list":
                    title = item.get("event_key", "")
                    content = item.get("event_value", "")
                    src = "?"
                else:
                    title = str(item)[:60]
                    content = ""
                    src = "?"
                print(f"  [{src}] {str(title)[:50]}")
                if content:
                    print(f"      {str(content)[:80]}")
                rel = item.get("relativity")
                if rel is not None:
                    print(f"      相关度: {rel:.2f}")
                total += 1
    if total == 0:
        print("（无命中）")
    print(f"\n共 {total} 条")

def cmd_get(args, base, key):
    """查看用户全部记忆（审计用）"""
    data = {"user_id": USER_ID, "page": args.page, "size": args.size}
    d = api(base, key, "/get/memory", data)
    if not d:
        return
    print(f"total={d.get('total','?')} pages={d.get('pages','?')}")
    for k in ["memory_detail_list", "preference_detail_list", "event_detail_list", "skill_detail_list", "profile_detail_list"]:
        items = d.get(k, []) or []
        if items:
            print(f"\n{k} ({len(items)}条):")
            for item in items[:args.size]:
                title = item.get("memory_key") or item.get("preference") or item.get("event_key") or str(item)[:40]
                info = item.get("info", {}) or {}
                integ = info.get("integration", "?") if isinstance(info, dict) else "?"
                conv = str(item.get("conversation_id", ""))[:40]
                print(f"  [{integ}] {str(title)[:45]} | conv={conv}")

def cmd_feedback(args, base, key):
    """反馈纠正记忆"""
    data = {"user_id": USER_ID, "memory_id": args.memory_id, "feedback": args.feedback}
    d = api(base, key, "/add/feedback", data)
    if d is not None:
        print(f"✅ 反馈已提交: {args.feedback[:50]}")

def cmd_delete(args, base, key):
    """删除记忆"""
    data = {"user_id": args.user or USER_ID}
    if args.conversation:
        data["conversation_id"] = args.conversation
    if args.memory_id:
        data["memory_id"] = args.memory_id
    d = api(base, key, "/delete/memory", data)
    if d is not None:
        print(f"✅ 删除完成")

# ============ 主入口 ============
def main():
    parser = argparse.ArgumentParser(description="MemOS 记忆工具")
    sub = parser.add_subparsers(dest="cmd")

    p_add = sub.add_parser("add", help="写入消息")
    p_add.add_argument("message", help="消息内容")
    p_add.add_argument("--assistant", default="", help="助手回复（可选）")
    p_add.add_argument("--conversation", default="", help="会话ID")
    p_add.add_argument("--tags", default="", help="标签，逗号分隔")
    p_add.add_argument("--info", default="", help="额外info JSON")

    p_search = sub.add_parser("search", help="召回记忆")
    p_search.add_argument("query", help="查询词")
    p_search.add_argument("--type", default="", help="类型: fact,preference,event,skill,profile,tool")
    p_search.add_argument("--relativity", type=float, default=0.6, help="相关性阈值")
    p_search.add_argument("--limit", type=int, default=6, help="限量")
    p_search.add_argument("--conversation", default="", help="会话ID")

    p_get = sub.add_parser("get", help="查看记忆")
    p_get.add_argument("--page", type=int, default=1)
    p_get.add_argument("--size", type=int, default=10)

    p_fb = sub.add_parser("feedback", help="反馈纠正")
    p_fb.add_argument("memory_id", help="记忆ID")
    p_fb.add_argument("feedback", help="反馈内容")

    p_del = sub.add_parser("delete", help="删除记忆")
    p_del.add_argument("--user", default="", help="用户ID")
    p_del.add_argument("--conversation", default="", help="会话ID")
    p_del.add_argument("--memory_id", default="", help="记忆ID")

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        return

    base, key = load_config()
    handlers = {
        "add": cmd_add,
        "search": cmd_search,
        "get": cmd_get,
        "feedback": cmd_feedback,
        "delete": cmd_delete,
    }
    handlers[args.cmd](args, base, key)

if __name__ == "__main__":
    main()
