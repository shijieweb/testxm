"""
ASKB TDD 测试套件 — 针对 server.py 的所有 API 和核心逻辑

运行：python -m pytest tests/test_askb_server.py -v
"""
import os
import sys
import json
import tempfile
import shutil
from pathlib import Path

import pytest

# 导入 server.py 中的模块
sys.path.insert(0, str(Path(__file__).parent.parent))
import server as askb_server


# ──────────────────────────────────────────────
# Fixtures：为每个测试创建隔离的临时 KB 目录
# ──────────────────────────────────────────────

@pytest.fixture
def temp_kb(tmp_path):
    """创建一个带完整目录结构的临时知识库根目录"""
    kb = tmp_path / "test_kb"
    kb.mkdir()

    # 创建目录结构
    dirs = [
        kb / "config" / "personas",
        kb / "roles" / "test-role",
        kb / "projects" / "test-project",
        kb / "projects" / "test-project" / "knowledge",
        kb / "knowledge" / "tools",
        kb / "knowledge" / "common",
        kb / "knowledge" / "projects",
        kb / "reports",
        kb / "history",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)

    # 写入 config.yaml
    (kb / "config" / "config.yaml").write_text(
        'defaults:\n  persona: strict\npaths:\n  server_port: 8765\n',
        encoding='utf-8'
    )

    # 写入 persona 文件
    (kb / "config" / "personas" / "strict.md").write_text(
        "# 严谨型人格\n- 不猜测未验证的信息\n",
        encoding='utf-8'
    )
    (kb / "config" / "personas" / "creative.md").write_text(
        "# 创意型人格\n- 发散思维\n",
        encoding='utf-8'
    )

    # 写入角色文件
    (kb / "roles" / "test-role" / "role.md").write_text(
        "# Test Role\n- 测试角色定义\n",
        encoding='utf-8'
    )

    # 写入项目文件
    (kb / "projects" / "test-project" / "project.md").write_text(
        "# Test Project\n- 测试项目描述\n",
        encoding='utf-8'
    )

    # 写入偏好记录和进度
    (kb / "偏好记录.md").write_text(
        "# 偏好记录\n- 称呼用户为老板\n",
        encoding='utf-8'
    )
    (kb / "当前进度.md").write_text(
        "# 当前进度\n- 测试中\n",
        encoding='utf-8'
    )

    return kb


@pytest.fixture
def app_with_kb(temp_kb):
    """配置并返回 Flask test client，指向临时 KB 目录"""
    original_kb_root = askb_server.KB_ROOT
    original_config = askb_server.CONFIG

    askb_server.KB_ROOT = temp_kb
    askb_server.CONFIG = askb_server.load_config()
    askb_server.app.config['TESTING'] = True

    yield askb_server.app.test_client()

    # 恢复原始值
    askb_server.KB_ROOT = original_kb_root
    askb_server.CONFIG = original_config


# ──────────────────────────────────────────────
# Health Check 测试
# ──────────────────────────────────────────────

class TestHealth:
    def test_health_returns_running(self, app_with_kb):
        """GET /health 应返回 status=running"""
        resp = app_with_kb.get('/health')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'running'
        assert 'kb_root' in data

    def test_health_kb_root_matches_fixture(self, app_with_kb, temp_kb):
        """GET /health 返回的 kb_root 应与临时目录一致"""
        resp = app_with_kb.get('/health')
        data = resp.get_json()
        assert Path(data['kb_root']) == temp_kb


# ──────────────────────────────────────────────
# Init API 测试
# ──────────────────────────────────────────────

class TestInit:
    def test_init_basic(self, app_with_kb):
        """POST /api/init 加载人格+角色+项目应返回 status=ok"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test-agent',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'ok'
        assert data['agent'] == 'test-agent'
        assert data['persona'] == 'strict'
        assert data['role'] == 'test-role'
        assert data['project'] == 'test-project'

    def test_init_context_contains_persona(self, app_with_kb):
        """init context 应包含人格内容"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        assert '严谨型人格' in data['context']

    def test_init_context_contains_role(self, app_with_kb):
        """init context 应包含角色内容"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        assert 'Test Role' in data['context']

    def test_init_context_contains_project(self, app_with_kb):
        """init context 应包含项目内容"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        assert 'Test Project' in data['context']

    def test_init_context_contains_preferences(self, app_with_kb):
        """init context 应包含偏好记录"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        assert '偏好记录' in data['context']
        assert '老板' in data['context']

    def test_init_context_contains_progress(self, app_with_kb):
        """init context 应包含当前进度"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        assert '当前进度' in data['context']

    def test_init_missing_persona_graceful(self, app_with_kb):
        """init 中 persona 不存在时不应报错，context 中标记未找到"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'nonexistent',
            'role': 'test-role'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert '未找到定义文件' in data['context']

    def test_init_missing_role_graceful(self, app_with_kb):
        """init 中 role 不存在时不应报错"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'nonexistent-role'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert '未找到定义文件' in data['context']

    def test_init_default_persona_from_config(self, app_with_kb):
        """未传 persona 时应使用 config.yaml 中的默认值"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'role': 'test-role'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['persona'] == 'strict'

    def test_init_files_loaded(self, app_with_kb):
        """init 返回的 files_loaded 应包含所有加载的文件路径"""
        resp = app_with_kb.post('/api/init', json={
            'agent': 'test',
            'persona': 'strict',
            'role': 'test-role',
            'project': 'test-project'
        })
        data = resp.get_json()
        files = data['files_loaded']
        assert len(files) == 3  # persona + role + project
        assert any('strict.md' in f for f in files)
        assert any('role.md' in f for f in files)
        assert any('project.md' in f for f in files)

    def test_init_empty_body(self, app_with_kb):
        """空 body 初始化应使用默认值"""
        resp = app_with_kb.post('/api/init', json={})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'ok'


# ──────────────────────────────────────────────
# Query API 测试
# ──────────────────────────────────────────────

class TestQuery:
    def test_query_with_role_filter(self, app_with_kb):
        """按 role 查询应只在该角色的文件中搜索"""
        resp = app_with_kb.post('/api/knowledge/query', json={
            'query': '测试角色定义',
            'role': 'test-role'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['count'] >= 1
        assert data['status'] == 'ok'

    def test_query_empty_finds_everything_in_role(self, app_with_kb):
        """空查询词应匹配文件名"""
        resp = app_with_kb.post('/api/knowledge/query', json={
            'query': 'role',
            'role': 'test-role'
        })
        data = resp.get_json()
        assert data['count'] >= 1

    def test_query_empty_string_rejected(self, app_with_kb):
        """空 query 参数应返回错误而非搜索结果"""
        resp = app_with_kb.post('/api/knowledge/query', json={
            'query': '',
            'role': 'test-role'
        })
        data = resp.get_json()
        assert 'error' in data
        assert data['count'] == 0

    def test_query_no_role_searches_knowledge_dirs(self, app_with_kb):
        """不带 role 的查询应搜索 knowledge/ 子目录"""
        kb = askb_server.KB_ROOT
        test_file = kb / "knowledge" / "tools" / "test-tool.md"
        test_file.write_text(
            "---\ntitle: 测试工具\n---\n这是测试工具的说明\n",
            encoding='utf-8'
        )
        try:
            resp = app_with_kb.post('/api/knowledge/query', json={
                'query': '测试工具'
            })
            data = resp.get_json()
            assert data['count'] >= 1
            expected_path = str(test_file.relative_to(kb)).replace('\\', '/')
            assert any(expected_path in r['path'].replace('\\', '/') for r in data['results'])
        finally:
            if test_file.exists():
                test_file.unlink()

    def test_query_result_has_required_fields(self, app_with_kb):
        """查询结果每条应包含 path, title, preview, verified"""
        resp = app_with_kb.post('/api/knowledge/query', json={
            'query': '测试',
            'role': 'test-role'
        })
        data = resp.get_json()
        if data['count'] > 0:
            result = data['results'][0]
            assert 'path' in result
            assert 'title' in result
            assert 'preview' in result
            assert 'verified' in result

    def test_query_case_insensitive_filename(self, app_with_kb):
        """文件名匹配应大小写不敏感"""
        resp = app_with_kb.post('/api/knowledge/query', json={
            'query': 'ROLE',
            'role': 'test-role'
        })
        data = resp.get_json()
        assert data['count'] >= 1


# ──────────────────────────────────────────────
# Report API 测试
# ──────────────────────────────────────────────

class TestReport:
    def test_report_saves_file(self, app_with_kb):
        """POST /api/report 应保存文件到 reports/"""
        resp = app_with_kb.post('/api/report', json={
            'agent': 'test-agent',
            'role': 'test-role',
            'content': '测试经验内容'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'saved'
        assert 'path' in data

    def test_report_file_exists_on_disk(self, app_with_kb, temp_kb):
        """report 保存后文件应存在于磁盘"""
        resp = app_with_kb.post('/api/report', json={
            'agent': 'test-agent',
            'role': 'test-role',
            'content': '测试内容'
        })
        data = resp.get_json()
        filepath = temp_kb / data['path']
        assert filepath.exists()

    def test_report_creates_audit_log(self, app_with_kb, temp_kb):
        """report 提交后 audit-log.md 应被创建"""
        app_with_kb.post('/api/report', json={
            'agent': 'test-agent',
            'role': 'test-role',
            'content': '测试'
        })
        audit_log = temp_kb / "history" / "audit-log.md"
        assert audit_log.exists()

    def test_report_audit_log_has_entry(self, app_with_kb, temp_kb):
        """audit-log.md 应包含本次提交的条目"""
        app_with_kb.post('/api/report', json={
            'agent': 'test-agent',
            'role': 'test-role',
            'content': '测试'
        })
        audit_log = temp_kb / "history" / "audit-log.md"
        content = audit_log.read_text(encoding='utf-8')
        assert 'test-agent' in content
        assert 'test-role' in content

    def test_report_empty_content_rejected(self, app_with_kb):
        """空 content 应返回 400"""
        resp = app_with_kb.post('/api/report', json={
            'agent': 'test',
            'role': 'test',
            'content': ''
        })
        assert resp.status_code == 400

    def test_report_special_chars_in_role(self, app_with_kb):
        """role 含特殊字符时 filename 应被 sanitize"""
        resp = app_with_kb.post('/api/report', json={
            'agent': 'test-agent',
            'role': 'test/role@2024',
            'content': '内容'
        })
        data = resp.get_json()
        assert data['status'] == 'saved'
        # 验证文件名不含特殊字符
        assert '/' not in data['path']
        assert '@' not in data['path']

    def test_report_multiple_submissions_accumulate(self, app_with_kb, temp_kb):
        """多次提交不同 agent+role 应各自独立保存文件"""
        app_with_kb.post('/api/report', json={
            'agent': 'alpha', 'role': 'role-x', 'content': '内容1'
        })
        app_with_kb.post('/api/report', json={
            'agent': 'beta', 'role': 'role-y', 'content': '内容2'
        })
        reports_dir = temp_kb / "reports"
        # 用 glob 匹配当天的所有 report 文件
        report_files = [f for f in reports_dir.glob("*.md") if "report" in f.name]
        assert len(report_files) == 2

    def test_report_agents_different_roles_same_date(self, app_with_kb, temp_kb):
        """不同 agent+role 组合应生成不同文件名"""
        app_with_kb.post('/api/report', json={
            'agent': 'agent1', 'role': 'role1', 'content': 'x'
        })
        app_with_kb.post('/api/report', json={
            'agent': 'agent2', 'role': 'role2', 'content': 'y'
        })
        reports_dir = temp_kb / "reports"
        report_files = list(reports_dir.glob('*_report.md'))
        assert len(report_files) == 2


# ──────────────────────────────────────────────
# Knowledge List API 测试
# ──────────────────────────────────────────────

class TestKnowledgeList:
    def test_list_empty_when_no_files(self, app_with_kb):
        """knowledge/ 为空时应返回 total=0"""
        resp = app_with_kb.get('/api/knowledge/list')
        data = resp.get_json()
        assert data['status'] == 'ok'
        assert data['total'] == 0

    def test_list_finds_markdown_files(self, app_with_kb):
        """knowledge/ 下有 .md 文件时应被列出"""
        kb = askb_server.KB_ROOT
        (kb / "knowledge" / "tools" / "tool-a.md").write_text(
            "---\ntitle: 工具A\nscope: tool\n---\n工具A的内容\n",
            encoding='utf-8'
        )
        try:
            resp = app_with_kb.get('/api/knowledge/list')
            data = resp.get_json()
            assert data['total'] >= 1
            paths = [item['path'] for item in data['items']]
            assert any('tool-a.md' in p for p in paths)
        finally:
            (kb / "knowledge" / "tools" / "tool-a.md").unlink()

    def test_list_ignores_non_md_files(self, app_with_kb):
        """非 .md 文件不应被列出"""
        kb = askb_server.KB_ROOT
        (kb / "knowledge" / "common" / "notes.txt").write_text("not markdown", encoding='utf-8')
        try:
            resp = app_with_kb.get('/api/knowledge/list')
            data = resp.get_json()
            assert data['total'] == 0
        finally:
            (kb / "knowledge" / "common" / "notes.txt").unlink()

    def test_list_result_has_required_fields(self, app_with_kb):
        """list 结果每条应包含 path, title, scope, verified"""
        kb = askb_server.KB_ROOT
        (kb / "knowledge" / "common" / "item.md").write_text(
            "---\ntitle: 测试条目\nscope: common\nverified: true\n---\n内容\n",
            encoding='utf-8'
        )
        try:
            resp = app_with_kb.get('/api/knowledge/list')
            data = resp.get_json()
            if data['total'] > 0:
                item = data['items'][0]
                assert 'path' in item
                assert 'title' in item
                assert 'scope' in item
                assert 'verified' in item
        finally:
            (kb / "knowledge" / "common" / "item.md").unlink()


# ──────────────────────────────────────────────
# find_knowledge_files 核心逻辑测试
# ──────────────────────────────────────────────

class TestFindKnowledgeFiles:
    def test_filename_match(self, temp_kb):
        """关键词出现在文件名中应命中"""
        askb_server.KB_ROOT = temp_kb
        (temp_kb / "roles" / "test-role" / "my-role.md").write_text(
            "---\ntitle: My Role\n---\n内容\n",
            encoding='utf-8'
        )
        try:
            results = askb_server.find_knowledge_files('my-role', role='test-role')
            assert len(results) >= 1
        finally:
            (temp_kb / "roles" / "test-role" / "my-role.md").unlink()

    def test_content_match_within_200_chars(self, temp_kb):
        """关键词出现在前200字符内应命中"""
        askb_server.KB_ROOT = temp_kb
        content = "这是一段包含关键词深测内容的前200字符测试\n" + "x" * 100
        (temp_kb / "knowledge" / "common" / "test.md").write_text(content, encoding='utf-8')
        try:
            results = askb_server.find_knowledge_files('关键词', role=None)
            assert len(results) >= 1
        finally:
            (temp_kb / "knowledge" / "common" / "test.md").unlink()

    def test_no_match_outside_200_chars(self, temp_kb):
        """关键词出现在第200字符之后且不在文件名中时不应命中"""
        askb_server.KB_ROOT = temp_kb
        padding = "a" * 250
        # 文件名不含关键词，内容中关键词在第200字符之后
        content_file = temp_kb / "knowledge" / "common" / "other-name.md"
        content_file.write_text(padding + "隐藏关键词", encoding='utf-8')
        try:
            results = askb_server.find_knowledge_files('隐藏关键词', role=None)
            # 应该只命中文件名，而不是深层内容
            # 这里验证：如果命中了，路径中应包含该文件名（通过文件名匹配）
            # 但我们的测试期望不命中，因为文件名也不含关键词
            # 实际上 "other-name.md" 不含 "隐藏关键词"，所以应该为0
            for r in results:
                print(f"  HIT: {r['path']} | title={r['title']} | hit_preview={r['preview'][:100]}")
            assert len(results) == 0, f"Expected 0 results but got {len(results)}: {[r['path'] for r in results]}"
        finally:
            if content_file.exists():
                content_file.unlink()

    def test_nonexistent_role_returns_empty(self, temp_kb):
        """role 不存在时应返回空列表"""
        askb_server.KB_ROOT = temp_kb
        results = askb_server.find_knowledge_files('anything', role='does-not-exist')
        assert results == []

    def test_yaml_metadata_parsed(self, temp_kb):
        """结果中应正确解析 YAML 元数据"""
        askb_server.KB_ROOT = temp_kb
        (temp_kb / "knowledge" / "tools" / "tool.md").write_text(
            "---\ntitle: 我的工具\nscope: tool\n.tags: [test, debug]\n---\n工具内容\n",
            encoding='utf-8'
        )
        try:
            results = askb_server.find_knowledge_files('工具', role=None)
            assert len(results) >= 1
            result = results[0]
            assert result['title'] == '我的工具'
            assert result['scope'] == 'tool'
        finally:
            (temp_kb / "knowledge" / "tools" / "tool.md").unlink()

    def test_no_yaml_metadata_defaults(self, temp_kb):
        """无 YAML 元数据的文件应使用文件名作为 title"""
        askb_server.KB_ROOT = temp_kb
        (temp_kb / "knowledge" / "common" / "plain.md").write_text("纯文本内容\n", encoding='utf-8')
        try:
            results = askb_server.find_knowledge_files('plain', role=None)
            assert len(results) >= 1
            assert results[0]['title'] == 'plain.md'
        finally:
            (temp_kb / "knowledge" / "common" / "plain.md").unlink()

    def test_result_preview_is_500_chars(self, temp_kb):
        """preview 字段最长 500 字符"""
        askb_server.KB_ROOT = temp_kb
        long_content = "x" * 1000
        (temp_kb / "knowledge" / "common" / "long.md").write_text(long_content, encoding='utf-8')
        try:
            results = askb_server.find_knowledge_files('x', role=None)
            assert len(results) >= 1
            assert len(results[0]['preview']) <= 500
        finally:
            (temp_kb / "knowledge" / "common" / "long.md").unlink()
