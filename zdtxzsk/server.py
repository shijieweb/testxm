#!/usr/bin/env python3
"""
Agent System Knowledge Base V1.0 - HTTP Server
端口: 8765 (固定)
三个接口: /api/init, /api/knowledge/query, /api/report
"""

import os
import sys
import json
import logging
import yaml
import datetime
import threading
from pathlib import Path
from flask import Flask, request, jsonify

# ──────────────────────────────────────────────
# 日志配置
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('askb')

app = Flask(__name__)

# ──────────────────────────────────────────────
# CORS 支持（供本地 HTTP 服务跨端口调用 API）
# ──────────────────────────────────────────────
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

KB_ROOT = Path(os.environ.get('KB_ROOT', '.')).resolve()
CONFIG_PATH = KB_ROOT / 'config' / 'config.yaml'

# ──────────────────────────────────────────────
# 切换 KB_ROOT 时同步更新 CONFIG_PATH（供测试 fixture 使用）
# ──────────────────────────────────────────────
def set_kb_root(path):
    """切换 KB_ROOT 并同步更新 CONFIG_PATH 和 CONFIG"""
    global KB_ROOT, CONFIG_PATH, CONFIG
    KB_ROOT = Path(path).resolve()
    CONFIG_PATH = KB_ROOT / 'config' / 'config.yaml'
    CONFIG = load_config()


# ──────────────────────────────────────────────
# YAML frontmatter 解析（只在文件以 --- 开头时生效）
# ──────────────────────────────────────────────
def _parse_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter，若文件不以 --- 开头则返回空字典"""
    stripped = content.lstrip()
    if not stripped.startswith('---'):
        return {}
    parts = stripped.split('---', 2)
    if len(parts) < 3:
        return {}
    try:
        return yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return {}

# ──────────────────────────────────────────────
# 文件锁（用于并发写保护）
# ──────────────────────────────────────────────
_locks: dict[str, threading.Lock] = {}
_locks_mutex = threading.Lock()


def _get_lock(key: str, timeout: float = 5.0) -> threading.Lock:
    """获取或创建针对某资源的锁，带超时等待。"""
    with _locks_mutex:
        if key not in _locks:
            _locks[key] = threading.Lock()
        lock = _locks[key]
    acquired = lock.acquire(timeout=timeout)
    if not acquired:
        raise TimeoutError(f"无法获取锁: {key}，等待超时 {timeout}s")
    return lock


def _release_lock(lock: threading.Lock):
    """释放锁。"""
    try:
        lock.release()
    except RuntimeError:
        pass  # 未持有时 release 会抛 RuntimeError，忽略


# 加载配置
def load_config():
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.error(f"加载 config.yaml 失败: {e}")
            return {}
    return {}


CONFIG = load_config()

# ──────────────────────────────────────────────
# 请求计数器（问题7：/api/metrics）
# ──────────────────────────────────────────────
_request_count = 0
_count_mutex = threading.Lock()


def _increment_request_count():
    global _request_count
    with _count_mutex:
        _request_count += 1


@app.before_request
def _count_request():
    _increment_request_count()


def find_knowledge_files(query_text, role=None, project=None):
    """搜索知识文件：优先搜元数据(YAML前50行) + 标题前200字"""
    results = []
    search_dirs = []

    if role:
        search_dirs.append(KB_ROOT / 'roles' / role)
    if project:
        search_dirs.append(KB_ROOT / 'projects' / project / 'knowledge')
    search_dirs.append(KB_ROOT / 'knowledge' / 'tools')
    search_dirs.append(KB_ROOT / 'knowledge' / 'common')
    search_dirs.append(KB_ROOT / 'knowledge' / 'projects')
    # 问题6修复：加入 KB_ROOT 自身，使偏好记录.md、当前进度.md 等可被搜索到
    search_dirs.append(KB_ROOT)

    query_lower = query_text.lower() if query_text else ''

    for d in search_dirs:
        if not d.exists():
            continue
        try:
            for root, _, files in os.walk(str(d)):
                for fname in files:
                    if not fname.endswith('.md'):
                        continue
                    fpath = Path(root) / fname
                    try:
                        content = fpath.read_text(encoding='utf-8')
                        preview = content[:500]  # 只搜前500字

                        # 匹配逻辑：文件名 或 YAML 头 或 标题前200字
                        match = False
                        if query_lower in fpath.name.lower():
                            match = True
                        elif query_text in content[:200]:
                            match = True

                        # 尝试读取 YAML 元数据
                        try:
                            meta = _parse_frontmatter(content)
                        except yaml.YAMLError as e:
                            logger.warning(f"解析 YAML 元数据失败 {fpath.name}: {e}")
                            meta = {}

                        if match:
                            results.append({
                                'path': str(fpath.relative_to(KB_ROOT)),
                                'title': meta.get('title', fname),
                                'scope': meta.get('scope', 'unknown'),
                                'tags': meta.get('tags', []),
                                'preview': preview,
                                'verified': meta.get('verified', False)
                            })
                    except Exception as e:
                        logger.warning(f"读取文件失败 {fpath}: {e}")
                        continue
        except Exception as e:
            logger.warning(f"遍历目录失败 {d}: {e}")
            continue

    logger.debug(f"搜索 '{query_text}' 返回 {len(results)} 条结果")
    return results


@app.route('/api/init', methods=['POST'])
def init():
    """初始化 Agent 上下文"""
    data = request.json or {}
    agent = data.get('agent', 'unknown')
    persona = data.get('persona', CONFIG.get('defaults', {}).get('persona', 'strict'))
    role = data.get('role', '')
    project = data.get('project', '')

    context_parts = []
    files_found = []

    # 1. 人格
    persona_file = KB_ROOT / 'config' / 'personas' / f'{persona}.md'
    if persona_file.exists():
        try:
            content = persona_file.read_text(encoding='utf-8')
            context_parts.append(f"## 人格：{persona}\n{content}")
            files_found.append(str(persona_file.relative_to(KB_ROOT)))
        except Exception as e:
            logger.warning(f"读取 persona 文件失败 {persona_file}: {e}")
            context_parts.append(f"## 人格：{persona}（读取失败）")
    else:
        context_parts.append(f"## 人格：{persona}（未找到定义文件）")

    # 2. 角色
    if role:
        role_file = KB_ROOT / 'roles' / role / 'role.md'
        if role_file.exists():
            try:
                content = role_file.read_text(encoding='utf-8')
                context_parts.append(f"\n## 角色：{role}\n{content}")
                files_found.append(str(role_file.relative_to(KB_ROOT)))
            except Exception as e:
                logger.warning(f"读取角色文件失败 {role_file}: {e}")
                context_parts.append(f"\n## 角色：{role}（读取失败）")
        else:
            context_parts.append(f"\n## 角色：{role}（未找到定义文件）")

    # 3. 项目
    if project:
        proj_file = KB_ROOT / 'projects' / project / 'project.md'
        if proj_file.exists():
            try:
                content = proj_file.read_text(encoding='utf-8')
                context_parts.append(f"\n## 项目：{project}\n{content}")
                files_found.append(str(proj_file.relative_to(KB_ROOT)))
            except Exception as e:
                logger.warning(f"读取项目文件失败 {proj_file}: {e}")
                context_parts.append(f"\n## 项目：{project}（读取失败）")
        else:
            context_parts.append(f"\n## 项目：{project}（未找到定义文件）")

    # 4. 偏好记录（全局）
    pref_file = KB_ROOT / '偏好记录.md'
    if pref_file.exists():
        try:
            content = pref_file.read_text(encoding='utf-8')
            context_parts.append(f"\n## 偏好记录\n{content}")
        except Exception as e:
            logger.warning(f"读取偏好记录失败: {e}")

    # 5. 当前进度
    progress_file = KB_ROOT / '当前进度.md'
    if progress_file.exists():
        try:
            content = progress_file.read_text(encoding='utf-8')
            context_parts.append(f"\n## 当前进度\n{content}")
        except Exception as e:
            logger.warning(f"读取当前进度失败: {e}")

    # 截断 context（防止超出 LLM context window）
    max_chars = CONFIG.get('server', {}).get('max_context_chars', 4096)
    full_context = '\n'.join(context_parts)
    if len(full_context) > max_chars:
        full_context = full_context[:max_chars] + f"\n... (已截断，共 {len(full_context)} 字符)"
        logger.info(f"init context 截断至 {max_chars} 字符")

    logger.info(f"init: agent={agent}, persona={persona}, role={role}, project={project}")

    return jsonify({
        'status': 'ok',
        'agent': agent,
        'persona': persona,
        'role': role,
        'project': project,
        'context': full_context,
        'files_loaded': files_found
    })


@app.route('/api/knowledge/query', methods=['POST'])
def query():
    """查询知识"""
    data = request.json or {}
    query_text = data.get('query', '')
    role = data.get('role', '')
    project = data.get('project', '')

    if not query_text:
        return jsonify({'error': 'query 参数不能为空', 'results': [], 'count': 0})

    try:
        results = find_knowledge_files(query_text, role, project)
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        return jsonify({'error': f'搜索失败: {e}', 'results': [], 'count': 0})

    logger.info(f"query: '{query_text}' role={role!r} project={project!r} → {len(results)} results")

    return jsonify({
        'status': 'ok',
        'query': query_text,
        'results': results,
        'count': len(results)
    })


@app.route('/api/report', methods=['POST'])
def report():
    """提交经验到 reports/"""
    data = request.json or {}
    agent = data.get('agent', 'unknown')
    role = data.get('role', 'unknown')
    content = data.get('content', '')

    if not content:
        return jsonify({'error': 'content 不能为空'}), 400

    date_str = datetime.datetime.now().strftime('%Y%m%d')
    safe_agent = ''.join(c if c.isalnum() else '_' for c in agent)
    safe_role = ''.join(c if c.isalnum() else '_' for c in role)
    filename = f"{date_str}_{safe_agent}_{safe_role}_report.md"
    filepath = KB_ROOT / 'reports' / filename

    try:
        os.makedirs(filepath.parent, exist_ok=True)
        filepath.write_text(
            f"# 经验报告\n\n- **Agent**: {agent}\n- **角色**: {role}\n"
            f"- **提交时间**: {datetime.datetime.now().isoformat()}\n\n"
            f"{content}",
            encoding='utf-8'
        )
    except Exception as e:
        logger.error(f"写入报告失败 {filepath}: {e}")
        return jsonify({'error': f'写入报告失败: {e}'}), 500

    # 使用文件锁保护 audit-log 并发写入
    lock_timeout = CONFIG.get('server', {}).get('lock_timeout', 5.0)
    try:
        lock = _get_lock('audit_log', timeout=lock_timeout)
        try:
            history_dir = KB_ROOT / 'history'
            os.makedirs(history_dir, exist_ok=True)
            audit_log = history_dir / 'audit-log.md'
            audit_entry = f"- [{datetime.datetime.now().isoformat()}] {agent}/{role} → {filename}\n"
            if audit_log.exists():
                try:
                    existing = audit_log.read_text(encoding='utf-8')
                    # 去重：若相同 agent/role 已在最近条目中，跳过写入
                    recent_lines = existing.splitlines()[:20]
                    agent_role_key = f"{agent}/{role}"
                    if any(agent_role_key in line for line in recent_lines):
                        logger.info(f"report: audit-log 已存在同名条目 {agent_role_key}，跳过写入")
                    else:
                        audit_log.write_text(audit_entry + existing, encoding='utf-8')
                except Exception as e:
                    logger.warning(f"更新 audit-log 失败: {e}")
            else:
                try:
                    audit_log.write_text('# 审核日志\n\n' + audit_entry, encoding='utf-8')
                except Exception as e:
                    logger.warning(f"创建 audit-log 失败: {e}")
        finally:
            _release_lock(lock)
    except TimeoutError as e:
        logger.warning(f"获取 audit_log 锁超时，跳过审计日志更新: {e}")

    logger.info(f"report: agent={agent}, role={role}, file={filename}")

    return jsonify({
        'status': 'saved',
        'path': str(filepath.relative_to(KB_ROOT)),
        'filename': filename
    })


@app.route('/api/knowledge/list', methods=['GET'])
def list_knowledge():
    """枚举所有知识条目（补充接口）"""
    knowledge_dir = KB_ROOT / 'knowledge'
    results = []
    if knowledge_dir.exists():
        try:
            for root, _, files in os.walk(str(knowledge_dir)):
                for fname in files:
                    if fname.endswith('.md'):
                        fpath = Path(root) / fname
                        try:
                            content = fpath.read_text(encoding='utf-8')
                            try:
                                meta = _parse_frontmatter(content)
                            except yaml.YAMLError as e:
                                logger.warning(f"解析 YAML 失败 {fpath.name}: {e}")
                                meta = {}
                            results.append({
                                'path': str(fpath.relative_to(KB_ROOT)),
                                'title': meta.get('title', fname),
                                'scope': meta.get('scope', 'unknown'),
                                'tags': meta.get('tags', []),
                                'verified': meta.get('verified', False)
                            })
                        except Exception as e:
                            logger.warning(f"读取知识文件失败 {fpath}: {e}")
                            continue
        except Exception as e:
            logger.error(f"遍历 knowledge 目录失败: {e}")
    logger.debug(f"list: 共 {len(results)} 条知识")
    return jsonify({'status': 'ok', 'total': len(results), 'items': results})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running', 'kb_root': str(KB_ROOT)})


@app.route('/api/metrics', methods=['GET'])
def metrics():
    """问题7修复：返回请求统计"""
    with _count_mutex:
        count = _request_count
    return jsonify({
        'status': 'ok',
        'total_requests': count,
        'kb_root': str(KB_ROOT),
        'uptime_seconds': round((datetime.datetime.now() - _start_time).total_seconds(), 1)
    })


# ──────────────────────────────────────────────
# 启动时间（供 /api/metrics 使用）
# ──────────────────────────────────────────────
_start_time = datetime.datetime.now()


if __name__ == '__main__':
    port = int(os.environ.get('SERVER_PORT', CONFIG.get('paths', {}).get('server_port', 8765)))
    host = os.environ.get('SERVER_HOST', CONFIG.get('paths', {}).get('server_host', '0.0.0.0'))
    logger.info(f"[ASKB] 启动服务 → http://{host}:{port}")
    logger.info(f"[ASKB] KB 根目录：{KB_ROOT}")
    logger.info(f"[ASKB] 配置：lock_timeout={CONFIG.get('server', {}).get('lock_timeout', 5)}s, "
                f"max_context={CONFIG.get('server', {}).get('max_context_chars', 4096)}chars")
    app.run(host=host, port=port, debug=False)
