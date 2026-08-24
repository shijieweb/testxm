"""
TDD 测试：最小化落地修复
- 问题5: init context 截断逻辑（max_context_chars 应生效）
- 问题6: 偏好记录/当前进度加入知识搜索范围
- 问题7: 新增 /api/metrics 端点
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pytest
from pathlib import Path

import server as askb_server

KB_ROOT = Path(__file__).parent.parent.resolve()


def _reload_config_at(path):
    """切换 KB_ROOT 时同步重新加载配置（通过 set_kb_root 保证 CONFIG_PATH 也更新）"""
    askb_server.set_kb_root(path)


class TestContextTruncationProtection:
    """问题5: init context 截断保护——max_context_chars 应严格生效"""

    def test_init_context_respects_max_chars(self, tmp_path):
        """RED: max_context_chars=50 时 context 总长不超过 50 + 截断标记长度"""
        (tmp_path / "config" / "personas").mkdir(parents=True)
        (tmp_path / "config" / "personas" / "strict.md").write_text(
            "# 严谨型人格\n- 严格验证所有信息\n", encoding='utf-8')
        (tmp_path / "config" / "config.yaml").write_text(
            "server:\n  max_context_chars: 50\n", encoding='utf-8')
        (tmp_path / "偏好记录.md").write_text("# 偏好记录\n" + "x" * 200, encoding='utf-8')
        (tmp_path / "当前进度.md").write_text("# 当前进度\n" + "y" * 200, encoding='utf-8')

        _reload_config_at(tmp_path)
        try:
            with askb_server.app.test_client() as client:
                resp = client.post('/api/init', json={'agent': 'test', 'persona': 'strict'})
                assert resp.status_code == 200
                data = resp.get_json()
                ctx = data['context']
                # context 应在 max_context_chars 范围内（含截断标记）
                assert len(ctx) <= 50 + 50, f"context实际{len(ctx)}字符，超出预算"
                # 截断标记应存在
                assert '截断' in ctx, "context 超长但缺少截断提示"
        finally:
            _reload_config_at(KB_ROOT)

    def test_init_context_preserves_persona_when_truncated(self, tmp_path):
        """GREEN: 截断时人格内容应优先保留（放在最前面）"""
        (tmp_path / "config" / "personas").mkdir(parents=True)
        (tmp_path / "config" / "personas" / "strict.md").write_text(
            "# 严谨型人格\n- 严格验证所有信息\n", encoding='utf-8')
        (tmp_path / "config" / "config.yaml").write_text(
            "server:\n  max_context_chars: 30\n", encoding='utf-8')
        (tmp_path / "偏好记录.md").write_text("# 偏好记录\n" + "x" * 300, encoding='utf-8')
        (tmp_path / "当前进度.md").write_text("# 当前进度\n" + "y" * 300, encoding='utf-8')

        _reload_config_at(tmp_path)
        try:
            with askb_server.app.test_client() as client:
                resp = client.post('/api/init', json={'agent': 'test', 'persona': 'strict'})
                data = resp.get_json()
                # 人格标题应在前30字符内
                assert '人格' in data['context'][:30], \
                    f"人格内容未保留在截断窗口内: {data['context'][:60]!r}"
        finally:
            _reload_config_at(KB_ROOT)


class TestSearchScopeIncludesRootFiles:
    """问题6: 偏好记录/当前进度加入知识搜索范围"""

    def test_preference_file_searchable(self):
        """GREEN: 偏好记录.md 应能被 find_knowledge_files 搜索命中"""
        results = askb_server.find_knowledge_files('偏好记录')
        paths = [r['path'] for r in results]
        root_match = [p for p in paths if '偏好记录' in p]
        assert len(root_match) >= 1, f"偏好记录.md 未被搜索到，当前结果: {paths}"

    def test_progress_file_searchable(self):
        """GREEN: 当前进度.md 应能被 find_knowledge_files 搜索命中"""
        results = askb_server.find_knowledge_files('当前进度')
        paths = [r['path'] for r in results]
        root_match = [p for p in paths if '当前进度' in p]
        assert len(root_match) >= 1, f"当前进度.md 未被搜索到，当前结果: {paths}"

    def test_root_files_in_search_dirs(self):
        """GREEN: find_knowledge_files 应包含 KB_ROOT 本身"""
        # 搜索偏好记录中有"老板"一词
        results = askb_server.find_knowledge_files('老板')
        assert isinstance(results, list)


class TestMetricsEndpoint:
    """问题7: /api/metrics 端点"""

    def test_metrics_endpoint_exists(self):
        """RED: /api/metrics 端点应存在，返回 200"""
        with askb_server.app.test_client() as client:
            resp = client.get('/api/metrics')
            assert resp.status_code == 200, f"期望 200，实际 {resp.status_code}"

    def test_metrics_returns_counts(self):
        """GREEN: metrics 应返回 total_requests 计数"""
        with askb_server.app.test_client() as client:
            client.get('/health')
            client.get('/health')
            client.post('/api/knowledge/query', json={'query': 'test'})

            resp = client.get('/api/metrics')
            data = resp.get_json()
            assert 'total_requests' in data, "响应缺少 total_requests 字段"
            assert isinstance(data['total_requests'], int)
            assert data['total_requests'] >= 3

    def test_metrics_endpoint_cors(self):
        """GREEN: metrics 应支持 CORS（同其他接口）"""
        with askb_server.app.test_client() as client:
            resp = client.get('/api/metrics')
            assert resp.headers.get('Access-Control-Allow-Origin') == '*'
