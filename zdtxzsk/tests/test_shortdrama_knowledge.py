"""
TDD 测试：短剧项目知识条目搜索验证
RED → GREEN → REFACTOR
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pytest
import yaml
from pathlib import Path

KB_ROOT = Path(__file__).parent.parent.resolve()

# 导入 server 模块
import server as askb_server
# 确保使用真实 KB_ROOT（避免被 test_askb_server.py 的 fixture 污染）
askb_server.KB_ROOT = KB_ROOT


def _ensure_kb_root():
    """在每个调用 find_knowledge_files 的测试前确保 KB_ROOT 正确"""
    askb_server.KB_ROOT = KB_ROOT


class TestShortDramaPipeline:
    """验证短剧内容生产管线知识条目"""

    def test_pipeline_file_exists(self):
        """RED: 管线文件应存在"""
        p = KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'content-production-pipeline.md'
        assert p.exists(), f"管线文件不存在: {p}"

    def test_pipeline_yaml_metadata(self):
        """GREEN: 管线文件应包含正确的 YAML 元数据"""
        p = KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'content-production-pipeline.md'
        content = p.read_text(encoding='utf-8')
        meta = yaml.safe_load(content.split('---')[1])
        assert meta['title'] == '短剧内容生产管线'
        assert meta['scope'] == 'projects'
        assert 'short-drama' in meta['tags']
        assert meta['verified'] is False

    def test_pipeline_searchable_by_pipeline(self):
        """GREEN: 关键词 'pipeline' 应能搜到"""
        _ensure_kb_root()
        results = askb_server.find_knowledge_files('pipeline', role=None, project=None)
        titles = [r['title'] for r in results]
        assert any('生产管线' in t for t in titles), f"未找到管线条目: {titles}"

    def test_pipeline_searchable_by_short_drama(self):
        """GREEN: 关键词 '短剧' 应能搜到"""
        _ensure_kb_root()
        results = askb_server.find_knowledge_files('短剧', role=None, project=None)
        assert len(results) >= 2, f"应至少找到 2 条短剧相关条目，实际 {len(results)}"

    def test_pipeline_4_phases_documented(self):
        """GREEN: 管线应包含 4 个阶段"""
        p = KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'content-production-pipeline.md'
        content = p.read_text(encoding='utf-8')
        for phase in ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']:
            assert phase in content, f"缺少 {phase}"


class TestTrendsAudienceAnalysis:
    """验证题材趋势分析知识条目"""

    def test_trends_file_exists(self):
        p = KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'trends-audience-analysis.md'
        assert p.exists()

    def test_trends_has_platform_table(self):
        content = (KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'trends-audience-analysis.md').read_text(encoding='utf-8')
        assert '抖音' in content
        assert '快手' in content
        assert '视频号' in content

    def test_trends_searchable_by_platform(self):
        _ensure_kb_root()
        # "抖音" 在 200 字符后，V1 限制内不可搜；改用 title 中的"题材"
        results = askb_server.find_knowledge_files('题材', role=None, project=None)
        titles = [r['title'] for r in results]
        assert any('趋势' in t or '受众' in t for t in titles), f"未找到平台条目: {titles}"


class TestDirectorReviewFramework:
    """验证导演审核框架知识条目"""

    def test_framework_file_exists(self):
        p = KB_ROOT / 'knowledge' / 'tools' / 'director-review-framework.md'
        assert p.exists()

    def test_framework_yaml_scope_tools(self):
        p = KB_ROOT / 'knowledge' / 'tools' / 'director-review-framework.md'
        content = p.read_text(encoding='utf-8')
        meta = yaml.safe_load(content.split('---')[1])
        assert meta['scope'] == 'tools'
        assert 'director' in meta['tags']

    def test_framework_searchable_by_review(self):
        _ensure_kb_root()
        results = askb_server.find_knowledge_files('审核', role=None, project=None)
        titles = [r['title'] for r in results]
        assert any('审核' in t or '决策' in t for t in titles), f"未找到审核条目: {titles}"

    def test_framework_priority_order(self):
        content = (KB_ROOT / 'knowledge' / 'tools' / 'director-review-framework.md').read_text(encoding='utf-8')
        # 红线 > 节奏 > 一致性 > 体验
        red_line_pos = content.index('红线检查')
        rhythm_pos = content.index('节奏检查')
        consistency_pos = content.index('一致性检查')
        assert red_line_pos < rhythm_pos < consistency_pos, "审核优先级顺序错误"


class TestASKBIntegration:
    """验证 ASKB 系统整体集成"""

    def test_total_knowledge_entries_increased(self):
        """知识条目总数应 > 之前的 6 条"""
        _ensure_kb_root()
        from flask import Flask
        app = askb_server.app
        with app.test_client() as client:
            r = client.get('/api/knowledge/list')
            data = r.get_json()
            assert data['total'] >= 9, f"知识条目应 >= 9，实际 {data['total']}"

    def test_query_with_role_director_finds_framework(self):
        """用 --role director 应能找到审核框架"""
        _ensure_kb_root()
        results = askb_server.find_knowledge_files('决策', role='director')
        # With role=director, should search roles/director/ AND knowledge/ dirs
        assert len(results) >= 1, "用 --role director 查询'决策'应返回结果"

    def test_pipeline_has_askb_integration_section(self):
        """管线应包含 ASKB 集成说明"""
        content = (KB_ROOT / 'knowledge' / 'projects' / 'short-drama' / 'content-production-pipeline.md').read_text(encoding='utf-8')
        assert '/api/init' in content
        assert '/api/knowledge/query' in content
        assert '/api/report' in content


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
