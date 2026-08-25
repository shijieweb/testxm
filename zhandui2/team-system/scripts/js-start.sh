#!/bin/bash
# js-start.sh v2.0 - 军师开工脚本
# 创建日期：2026-08-14
# 用途：军师每次执行任务前运行，加载上下文+DET分层自检
# 依赖：纯bash，无外部依赖
# 参数：[--scene script|archive|audit|none] [read-only-file1 ...]
# 变更：v2.0删除备份相关逻辑（--backup参数+backup_file函数+N=3清理），备份由GitHub统一管理

VERSION="v2.2"
TEAM_DIR="/workspace/.team"
MEMORY_DIR="$TEAM_DIR/memory"
STATUS_DIR="$TEAM_DIR/status"
SCRIPTS_DIR="$TEAM_DIR/scripts"

# 关键文件路径
SELF_REVIEW="$STATUS_DIR/js-self-review.md"
COGNITIVE="$MEMORY_DIR/js-cognitive.md"
COGNITIVE_LONGTERM="$MEMORY_DIR/js-cognitive-longterm.md"
COGNITIVE_FRAMEWORK="$MEMORY_DIR/js-cognitive-framework.md"
COGNITIVE_RULES="$MEMORY_DIR/js-cognitive-rules.md"
COGNITIVE_CHARTER="$MEMORY_DIR/js-cognitive-charter.md"
DISPATCH_COUNTER="$STATUS_DIR/js-dispatch-counter.md"
CONSTITUTION="$TEAM_DIR/CONSTITUTION.md"
INDEX_FILE="$TEAM_DIR/INDEX.md"

# DET分层定义（v2.13融合更新：DET-003/005并入002，DET-011并入001，DET-009/013移除）
# 核心层（每次必读）
DET_CORE="DET-002 DET-007"
# 保留数量类——取消（原DET-003/005已并入DET-002）
# 场景层映射
DET_SCENE_SCRIPT="DET-001 DET-006 DET-008 DET-012 DET-014"
DET_SCENE_ARCHIVE="DET-001"
DET_SCENE_AUDIT="DET-004"

# 输出大小阈值（字节）
OUTPUT_LIMIT=40960

# 临时输出文件（用于计算总输出大小）
OUTPUT_TMP=$(mktemp)
trap "rm -f $OUTPUT_TMP" EXIT

# ============================================================
# 函数定义
# ============================================================

# 安全grep：检查空返回并输出警告
safe_grep() {
    local pattern="$1"
    local file="$2"
    local label="$3"
    local result
    result=$(grep "$pattern" "$file" 2>/dev/null)
    if [ -z "$result" ]; then
        echo "[警告：未匹配到${label}，可能grep模式失效，请手动检查 $file]"
        return 1
    else
        echo "$result"
        return 0
    fi
}

# 显示DET检测项（从js-self-review.md动态提取）
display_det() {
    local det_ids="$1"
    local layer_name="$2"
    echo "### ${layer_name}"
    echo ""
    local found_any=0
    for det_id in $det_ids; do
        local line
        line=$(awk -F'|' -v det=" ${det_id} " 'NF >= 7 && $2 ~ det' "$SELF_REVIEW" 2>/dev/null)
        if [ -z "$line" ]; then
            echo "[警告：未匹配到${det_id}，可能grep模式失效，请手动检查 $SELF_REVIEW]"
        else
            local num desc check
            num=$(echo "$line" | awk -F'|' '{print $2}' | sed 's/^ *//;s/ *$//')
            desc=$(echo "$line" | awk -F'|' '{print $3}' | sed 's/^ *//;s/ *$//')
            check=$(echo "$line" | awk -F'|' '{print $4}' | sed 's/^ *//;s/ *$//')
            echo "- **${num}**：${desc} → ${check}"
            found_any=1
        fi
    done
    if [ "$found_any" -eq 0 ]; then
        echo "[警告：${layer_name}未提取到任何DET，请手动检查 $SELF_REVIEW]"
    fi
    echo ""
}

# 检查文件行数并智能显示
display_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo "[警告：文件不存在：$file]"
        return 1
    fi
    local lines
    lines=$(wc -l < "$file")
    echo "### $file（${lines}行）"
    echo ""
    if [ "$lines" -le 150 ]; then
        cat "$file"
    else
        echo "> 该文件${lines}行，已显示前150行，需要更多请单独读"
        echo ""
        head -150 "$file"
        echo ""
        echo "--- 结构标题索引 ---"
        grep -n "^## \|^### " "$file" 2>/dev/null || echo "[警告：未匹配到结构标题，可能grep模式失效，请手动检查 $file]"
    fi
    echo ""
}

# ============================================================
# --check 自检模式
# ============================================================

if [ "$1" = "--check" ]; then
    echo "=== js-start.sh --check 自检 ==="
    echo ""
    echo "1. 关键文件路径检查："
    all_ok=1
    for f in "$SELF_REVIEW" "$COGNITIVE" "$COGNITIVE_LONGTERM" "$COGNITIVE_FRAMEWORK" "$COGNITIVE_RULES" "$COGNITIVE_CHARTER" "$DISPATCH_COUNTER" "$CONSTITUTION" "$INDEX_FILE"; do
        if [ -f "$f" ]; then
            echo "  [OK] $f"
        else
            echo "  [FAIL] $f 不存在"
            all_ok=0
        fi
    done
    echo ""
    echo "2. 脚本目录检查："
    if [ -d "$SCRIPTS_DIR" ]; then
        echo "  [OK] $SCRIPTS_DIR"
    else
        echo "  [FAIL] $SCRIPTS_DIR 不存在"
        all_ok=0
    fi
    echo ""
    echo "3. DET提取验证："
    for det_id in $DET_CORE; do
        if awk -F'|' -v det=" ${det_id} " 'NF >= 7 && $2 ~ det {found=1} END{exit !found}' "$SELF_REVIEW" 2>/dev/null; then
            echo "  [OK] ${det_id} 可提取"
        else
            echo "  [FAIL] ${det_id} 未找到"
            all_ok=0
        fi
    done
    echo ""
    echo "4. 长期记忆主题验证："
    topic_count=$(grep -c "^## 主题" "$COGNITIVE_LONGTERM" 2>/dev/null)
    if [ "$topic_count" -gt 0 ]; then
        echo "  [OK] 找到${topic_count}个主题"
    else
        echo "  [FAIL] 未找到主题标题"
        all_ok=0
    fi
    echo ""
    echo "5. 计数器文件验证："
    if grep -q "军师被调用总次数" "$DISPATCH_COUNTER" 2>/dev/null; then
        echo "  [OK] 计数器格式有效"
    else
        echo "  [FAIL] 计数器格式异常"
        all_ok=0
    fi
    echo ""
    echo "6. 运行时环境验证："
    # git仓库检查（v2.2从WARN改为FAIL——军师审查报告指出"所有缓存无回滚保障，是前置条件不是可选项"）
    if git -C "$TEAM_DIR" rev-parse --git-dir >/dev/null 2>&1; then
        echo "  [OK] git仓库已初始化"
        # 检查是否有未提交的变更（上次执行可能未正常收工）
        if ! git -C "$TEAM_DIR" diff --quiet 2>/dev/null || ! git -C "$TEAM_DIR" diff --cached --quiet 2>/dev/null; then
            echo "  [WARN] 有未提交的变更——上次执行可能未正常收工"
        fi
    else
        echo "  [FAIL] git仓库未初始化——所有缓存无回滚保障，必须先修复ISSUE-009"
        all_ok=0
    fi
    # archive目录检查
    for d in "$TEAM_DIR/.archive" "$TEAM_DIR/memory/.archive" "$TEAM_DIR/status/.archive"; do
        if [ -d "$d" ]; then
            echo "  [OK] $d"
        else
            echo "  [WARN] $d 不存在——归档流程可能失败"
        fi
    done
    echo ""
    echo "7. 缓存文件校验（v2.2新增）："
    CACHE_DIR="$TEAM_DIR/.cache"
    if [ -d "$CACHE_DIR" ] && [ -n "$(ls -A "$CACHE_DIR" 2>/dev/null)" ]; then
        for cache_file in "$CACHE_DIR"/*.md; do
            [ -f "$cache_file" ] || continue
            # 读取source_path和source_hash
            source_path=$(grep "^source_path:" "$cache_file" | awk '{print $2}')
            stored_hash=$(grep "^source_hash:" "$cache_file" | awk '{print $2}')

            if [ -z "$source_path" ] || [ -z "$stored_hash" ]; then
                echo "  [WARN] $(basename "$cache_file") 缺少元数据头"
                continue
            fi

            if [ ! -f "$source_path" ]; then
                echo "  [FAIL] $(basename "$cache_file") 源文件不存在：$source_path"
                all_ok=0
                continue
            fi

            current_hash=$(md5sum "$source_path" | awk '{print $1}')
            if [ "$current_hash" = "$stored_hash" ]; then
                echo "  [OK] $(basename "$cache_file") 缓存有效"
            else
                echo "  [WARN] $(basename "$cache_file") 缓存过期（源文件已变更）"
            fi
        done
    else
        echo "  [INFO] 缓存目录不存在或为空（尚未生成缓存，属正常）"
    fi
    echo ""
    if [ "$all_ok" -eq 1 ]; then
        echo "=== 自检结果：全部通过 ==="
    else
        echo "=== 自检结果：存在问题，请检查上述FAIL项 ==="
    fi
    exit 0
fi

# ============================================================
# 参数解析
# ============================================================

SCENE="none"
READONLY_FILES=""

while [ $# -gt 0 ]; do
    case "$1" in
        --scene)
            SCENE="$2"
            shift 2
            ;;
        --help|-h)
            echo "用法: js-start.sh [--scene script|archive|audit|none] [read-only-file1 ...]"
            echo ""
            echo "参数："
            echo "  --scene   场景类型，触发对应DET场景层显示（默认none）"
            echo "  其他参数  只读任务文件（自动智能显示）"
            echo "  --check   自检模式（验证关键文件路径有效）"
            exit 0
            ;;
        *)
            READONLY_FILES="$READONLY_FILES $1"
            shift
            ;;
    esac
done

# ============================================================
# 主流程
# ============================================================

{
echo "================================================================"
echo "军师开工上下文加载 - js-start.sh $VERSION"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "场景：$SCENE"
echo "================================================================"
echo ""

# ============================================================
# 1. DET检测项（分层显示）
# ============================================================
echo "================================================================"
echo "[1/7] DET检测项（分层加载）"
echo "================================================================"
echo ""

# 核心层（每次必读）
display_det "$DET_CORE" "核心层（每次必读）"

# 场景层
case "$SCENE" in
    script)
        display_det "$DET_SCENE_SCRIPT" "场景层-脚本设计类（--scene script）"
        ;;
    archive)
        display_det "$DET_SCENE_ARCHIVE" "场景层-归档类（--scene archive）"
        ;;
    audit)
        display_det "$DET_SCENE_AUDIT" "场景层-审计类（--scene audit）"
        ;;
    none)
        echo "### 场景层（未指定--scene，跳过。可用值：script|archive|audit）"
        echo ""
        ;;
    *)
        echo "[警告：未知场景类型 '$SCENE'，可用值：script|archive|audit|none]"
        echo ""
        ;;
esac

# ============================================================
# 2. js-cognitive.md全部记忆
# ============================================================
echo "================================================================"
echo "[2/7] 短期记忆（js-cognitive.md）"
echo "================================================================"
echo ""
if [ -f "$COGNITIVE" ]; then
    cat "$COGNITIVE"
else
    echo "[警告：文件不存在：$COGNITIVE]"
fi
echo ""

# ============================================================
# 3. js-cognitive-longterm.md主题标题列表
# ============================================================
echo "================================================================"
echo "[3/7] 长期记忆主题标题（js-cognitive-longterm.md）"
echo "================================================================"
echo ""
echo "--- 主题标题列表 ---"
safe_grep "^## 主题" "$COGNITIVE_LONGTERM" "长期记忆主题标题" || true
echo ""

# ============================================================
# 4. 最近执行记录（从js-self-review.md最近一条自回顾读取）
# ============================================================
echo "================================================================"
echo "[4/7] 最近执行记录（js-self-review.md最近自回顾）"
echo "================================================================"
echo ""
last_detail_line=$(grep -n "^## 详细自回顾" "$SELF_REVIEW" 2>/dev/null | tail -1 | cut -d: -f1)
if [ -z "$last_detail_line" ]; then
    echo "[警告：未匹配到详细自回顾标题，尝试读自回顾记录表格]"
    table_start=$(grep -n "^## 自回顾记录" "$SELF_REVIEW" 2>/dev/null | head -1 | cut -d: -f1)
    if [ -n "$table_start" ]; then
        # 动态截取到下一个"## "标题或文件末尾，不硬编码行数（DET-010修复）
        next_section=$(awk -v start="$table_start" 'NR>start && /^## /{print NR; exit}' "$SELF_REVIEW" 2>/dev/null)
        if [ -n "$next_section" ]; then
            sed -n "${table_start},$((next_section - 1))p" "$SELF_REVIEW"
        else
            sed -n "${table_start},\$p" "$SELF_REVIEW"
        fi
    else
        echo "[警告：未匹配到自回顾记录区域，可能grep模式失效，请手动检查 $SELF_REVIEW]"
    fi
else
    # 动态截取到下一个"## "标题或文件末尾，不硬编码行数（DET-010修复）
    next_section=$(awk -v start="$last_detail_line" 'NR>start && /^## /{print NR; exit}' "$SELF_REVIEW" 2>/dev/null)
    if [ -n "$next_section" ]; then
        sed -n "${last_detail_line},$((next_section - 1))p" "$SELF_REVIEW"
    else
        sed -n "${last_detail_line},\$p" "$SELF_REVIEW"
    fi
fi
echo ""

# ============================================================
# 5. 角度库版本+管理规则（v2.2：优先用校验过的缓存）
# ============================================================
echo "================================================================"
echo "[5/7] 角度库版本+管理规则（js-cognitive-framework.md）"
echo "================================================================"
echo ""
echo "--- 文件头（版本信息） ---"
head -15 "$COGNITIVE_FRAMEWORK" 2>/dev/null || echo "[警告：无法读取 $COGNITIVE_FRAMEWORK]"
echo ""

# v2.2新增：角度库摘要缓存（脚本层校验hash后展示，军师拿到的永远是已校验内容）
CACHE_DIR="$TEAM_DIR/.cache"
ANGLE_CACHE="$CACHE_DIR/angle-summary.md"
if [ -f "$ANGLE_CACHE" ]; then
    cache_source_path=$(grep "^source_path:" "$ANGLE_CACHE" | awk '{print $2}')
    cache_stored_hash=$(grep "^source_hash:" "$ANGLE_CACHE" | awk '{print $2}')
    if [ -n "$cache_source_path" ] && [ -n "$cache_stored_hash" ] && [ -f "$cache_source_path" ]; then
        cache_current_hash=$(md5sum "$cache_source_path" | awk '{print $1}')
        if [ "$cache_current_hash" = "$cache_stored_hash" ]; then
            echo "--- 角度库摘要（缓存有效，来自angle-summary.md） ---"
            grep -A999 '^## Cache Content' "$ANGLE_CACHE" 2>/dev/null | grep -v '^## Cache Content' | grep -v '^$' | head -30
            echo ""
        else
            echo "--- 角度库摘要（缓存过期，回退读源文件节标题） ---"
            grep '^### ANGLE-' "$COGNITIVE_FRAMEWORK" 2>/dev/null | head -30 || echo "[警告：未匹配到角度标题]"
            echo ""
        fi
    else
        echo "--- 角度库摘要（缓存元数据不完整，回退读源文件节标题） ---"
        grep '^### ANGLE-' "$COGNITIVE_FRAMEWORK" 2>/dev/null | head -30 || echo "[警告：未匹配到角度标题]"
        echo ""
    fi
else
    echo "--- 角度库摘要（缓存不存在，读源文件节标题） ---"
    grep '^### ANGLE-' "$COGNITIVE_FRAMEWORK" 2>/dev/null | head -30 || echo "[警告：未匹配到角度标题]"
    echo ""
fi

echo "--- 管理规则关键节标题 ---"
safe_grep "^### " "$COGNITIVE_RULES" "管理规则节标题" || true
echo ""

# ============================================================
# 6. 任务相关文件（参数传入）
# ============================================================
echo "================================================================"
echo "[6/7] 任务相关文件"
echo "================================================================"
echo ""
if [ -z "$(echo $READONLY_FILES | tr -d ' ')" ]; then
    echo "（未传入任务文件参数）"
else
    for f in $READONLY_FILES; do
        display_file "$f"
    done
fi
echo ""

# ============================================================
# 7. 计数器（只读不写）
# ============================================================
echo "================================================================"
echo "[7/7] 计数器（只读，+1在收工脚本js-end.sh）"
echo "================================================================"
echo ""
echo "--- 计数器关键值 ---"
safe_grep "军师被调用总次数\|距离下次meta-audit\|距离下次整理" "$DISPATCH_COUNTER" "计数器关键值" || true
echo ""
echo "> 提示：计数器+1在收工脚本js-end.sh中执行（确认任务完成后）"
echo ""

echo "================================================================"
echo "开工上下文加载完成"
echo "================================================================"

} | tee "$OUTPUT_TMP"

# ============================================================
# 输出大小检查
# ============================================================
output_size=$(wc -c < "$OUTPUT_TMP")
if [ "$output_size" -gt "$OUTPUT_LIMIT" ]; then
    echo ""
    echo "[告警：总输出已超40KB（当前$((output_size / 1024))KB），建议分批读取任务文件]"
fi

# 提案前置检查提示（v2.15新增）
echo ""
echo "----------------------------------------------------------------"
echo "[提示] 本次任务涉及结构性变更吗？（新增/修改DET或角度或管理规则或脚本逻辑）"
echo "       如是，执行提案前置检查（见js-cognitive-rules.md「提案前置检查」小节）"
echo "----------------------------------------------------------------"

rm -f "$OUTPUT_TMP"
