#!/bin/bash
# js-end.sh v2.0 - 军师收工脚本
# 创建日期：2026-08-14
# 用途：军师每次执行任务后运行，计数器+1
# 依赖：纯bash，无外部依赖
# 变更：v2.0大幅简化——删除diff/备份检查/changelog模板/js-self-review模板/DET自检表模板，备份由GitHub统一管理，模板军师自己知道格式不需要脚本生成

VERSION="v2.2"
TEAM_DIR="/workspace/.team"
STATUS_DIR="$TEAM_DIR/status"
CACHE_DIR="$TEAM_DIR/.cache"

# 关键文件路径
DISPATCH_COUNTER="$STATUS_DIR/js-dispatch-counter.md"
COGNITIVE_FRAMEWORK="$TEAM_DIR/memory/js-cognitive-framework.md"

# 日期
TODAY=$(date +%Y-%m-%d)

# ============================================================
# 计数器+1
# ============================================================
increment_counter() {
    if [ ! -f "$DISPATCH_COUNTER" ]; then
        echo "[警告：计数器文件不存在：$DISPATCH_COUNTER]"
        return 1
    fi

    # 读取当前值
    local current_val
    current_val=$(grep "军师被调用总次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')
    if [ -z "$current_val" ]; then
        echo "[警告：未匹配到军师被调用总次数，可能grep模式失效，请手动检查 $DISPATCH_COUNTER]"
        return 1
    fi

    local new_val=$((current_val + 1))

    # 读取上次meta-audit和整理时的调用次数
    local last_meta
    last_meta=$(grep "上次meta-audit时的调用次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')
    local last_cleanup
    last_cleanup=$(grep "上次整理时的调用次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')

    # 计算距离
    local dist_meta=$((10 - (new_val - last_meta)))
    local dist_cleanup=$((50 - (new_val - last_cleanup)))
    [ "$dist_meta" -lt 0 ] && dist_meta=0
    [ "$dist_cleanup" -lt 0 ] && dist_cleanup=0

    # 判断是否触发meta-audit或整理
    local trigger_meta="否"
    local trigger_cleanup="否"
    if [ "$new_val" -ge 10 ] && [ "$((new_val - last_meta))" -ge 10 ]; then
        trigger_meta="是（${new_val}-${last_meta}=$((new_val - last_meta))≥10）"
    else
        trigger_meta="否（${new_val}-${last_meta}=$((new_val - last_meta))<10）"
    fi
    if [ "$new_val" -ge 50 ] && [ "$((new_val - last_cleanup))" -ge 50 ]; then
        trigger_cleanup="是（${new_val}-${last_cleanup}=$((new_val - last_cleanup))≥50）"
    else
        trigger_cleanup="否（${new_val}-${last_cleanup}=$((new_val - last_cleanup))<50）"
    fi

    # 写回新值
    sed -i "s/| 军师被调用总次数 | ${current_val} |.*/| 军师被调用总次数 | ${new_val} | ${TODAY} |/" "$DISPATCH_COUNTER"
    
    # 更新距离值
    sed -i "s/| 距离下次meta-audit还差 |.*/| 距离下次meta-audit还差 | ${dist_meta} | - |/" "$DISPATCH_COUNTER"
    sed -i "s/| 距离下次整理还差 |.*/| 距离下次整理还差 | ${dist_cleanup} | - |/" "$DISPATCH_COUNTER"

    # 更新跳过计数（从计数器表读取实际闭环产出次数，不硬编码0）
    local review_count
    review_count=$(grep "闭环1自审次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')
    [ -z "$review_count" ] && review_count=0
    local coverage_count
    coverage_count=$(grep "闭环2覆盖检查次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')
    [ -z "$coverage_count" ] && coverage_count=0
    local skip_1=$((new_val - review_count))
    local skip_2=$((new_val - coverage_count))
    sed -i "s/| 跳过闭环1次数（调用-自审） |.*/| 跳过闭环1次数（调用-自审） | ${skip_1} | - |/" "$DISPATCH_COUNTER"
    sed -i "s/| 跳过闭环2次数（调用-覆盖检查） |.*/| 跳过闭环2次数（调用-覆盖检查） | ${skip_2} | - |/" "$DISPATCH_COUNTER"

    # 追加活动日志
    local log_entry="| $((new_val)) | ${TODAY} | js-end.sh完成计数 | ${trigger_meta} | ${trigger_cleanup} | 计数器${current_val}→${new_val} |"

    local last_log_line
    last_log_line=$(grep -n "^| [0-9]* |" "$DISPATCH_COUNTER" | tail -1 | cut -d: -f1)
    if [ -n "$last_log_line" ]; then
        sed -i "${last_log_line}a\\${log_entry}" "$DISPATCH_COUNTER"
    else
        echo "[警告：未找到活动日志表格，无法追加日志，请手动检查 $DISPATCH_COUNTER]"
    fi

    echo "  计数器：${current_val} → ${new_val}"
    echo "  距下次meta-audit：${dist_meta}次"
    echo "  距下次整理：${dist_cleanup}次"
    echo "  触发meta-audit：${trigger_meta}"
    echo "  触发整理：${trigger_cleanup}"
}

# v2.1新增--verify-refs引用一致性检查

# ============================================================
# 引用一致性检查
# ============================================================
verify_refs() {
    echo "----------------------------------------------------------------"
    echo "引用一致性检查（--verify-refs）"
    echo "----------------------------------------------------------------"
    
    local issues=0
    
    # 检查1：旧的"宪法第十章/第十一章"引用（应改为js-cognitive-charter.md）
    # 排除：迁移说明（含"迁移"/"原宪法"/"拆分"/"附件"）、归档、changelog、本脚本自身
    local old_refs
    old_refs=$(grep -rn "宪法第十章\|宪法第十一章" "$TEAM_DIR" --include="*.md" --include="*.sh" 2>/dev/null | grep -v ".archive/" | grep -v "changelog" | grep -v "INDEX.md" | grep -v "js-end.sh" | grep -v "迁移\|原宪法\|拆分\|附件\|从宪法")
    if [ -n "$old_refs" ]; then
        echo "[警告] 发现旧引用「宪法第十章/第十一章」，应改为js-cognitive-charter.md："
        echo "$old_refs"
        issues=$((issues + 1))
    fi
    
    # 检查2：旧的"宪法11.9"引用（应改为js-cognitive-rules.md执行保证小节）
    # 排除：迁移说明（含"迁移"/"原宪法"）、归档、changelog、本脚本自身
    local old_119
    old_119=$(grep -rn "宪法11\.9" "$TEAM_DIR" --include="*.md" --include="*.sh" 2>/dev/null | grep -v ".archive/" | grep -v "changelog" | grep -v "js-end.sh" | grep -v "迁移\|原宪法")
    if [ -n "$old_119" ]; then
        echo "[警告] 发现旧引用「宪法11.9」，应改为js-cognitive-rules.md执行保证小节："
        echo "$old_119"
        issues=$((issues + 1))
    fi
    
    # 检查3：循环引用检测（两个文件互相指向对方但都不含正文）
    local charter_to_constitution
    charter_to_constitution=$(grep -c "CONSTITUTION" "$TEAM_DIR/memory/js-cognitive-charter.md" 2>/dev/null)
    local constitution_to_charter
    constitution_to_charter=$(grep -c "js-cognitive-charter" "$TEAM_DIR/CONSTITUTION.md" 2>/dev/null)
    if [ "$charter_to_constitution" -gt 0 ] && [ "$constitution_to_charter" -gt 0 ]; then
        echo "[提示] charter.md和CONSTITUTION.md存在双向引用（可能是正常指针，请人工确认非循环）"
    fi
    
    # 检查4：INDEX.md中列出的文件是否都存在
    # 只检查表格行中的路径（以|`开头的模式），排除说明文字中的裸文件名
    if [ -f "$TEAM_DIR/INDEX.md" ]; then
        local missing_files
        missing_files=$(grep -oE '`[a-z]+/[^`]+\.md`' "$TEAM_DIR/INDEX.md" | sed 's/`//g' | sort -u | while read f; do
            [ ! -f "$TEAM_DIR/$f" ] && echo "  缺失：$f"
        done)
        if [ -n "$missing_files" ]; then
            echo "[警告] INDEX.md中列出的文件不存在："
            echo "$missing_files"
            issues=$((issues + 1))
        fi
    fi
    
    # 检查5：全量引用扫描——grep所有.md文件中引用的.md文件名，检查被引用文件是否存在
    local broken_refs
    broken_refs=$(find "$TEAM_DIR" -name "*.md" -not -path "*/.archive/*" -exec grep -ohE '[a-z][a-z-]*/[a-z][a-z-]*\.md|js-[a-z-]*\.md|ms-[a-z-]*\.md|CONSTITUTION\.md|INDEX\.md|dashboard\.md|issues\.md|coverage-gaps\.md|angle-[a-z]*\.md|gray-areas\.md|standard-changes\.md' {} \; 2>/dev/null | sort -u | while read ref; do
        # 检查是否以目录路径开头
        if echo "$ref" | grep -q '/'; then
            [ ! -f "$TEAM_DIR/$ref" ] && echo "  断链引用：$ref"
        else
            # 无目录前缀的文件名，在常见目录中查找
            found=0
            for dir in "$TEAM_DIR" "$TEAM_DIR/status" "$TEAM_DIR/memory" "$TEAM_DIR/scripts"; do
                [ -f "$dir/$ref" ] && found=1 && break
            done
            [ "$found" -eq 0 ] && echo "  断链引用：$ref（在常见目录中未找到）"
        fi
    done)
    if [ -n "$broken_refs" ]; then
        echo "[警告] 发现断链引用（引用了不存在的.md文件）："
        echo "$broken_refs"
        issues=$((issues + 1))
    fi
    
    if [ "$issues" -eq 0 ]; then
        echo "  引用一致性检查通过，无问题。"
    else
        echo "  发现 $issues 处引用问题，请修复。"
    fi
}

# ============================================================
# git自动提交（v2.2新增，修复ISSUE-009）
# ============================================================
git_commit_changes() {
    cd "$TEAM_DIR" || return 1

    # 检查git仓库是否存在
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        echo "[警告] git仓库未初始化，无法提交（ISSUE-009未修复）"
        return 1
    fi

    # 检查是否有变更
    if git diff --quiet && git diff --cached --quiet 2>/dev/null; then
        echo "  git：无变更，跳过提交"
        return 0
    fi

    git add -A
    # 从计数器文件读取最新值（new_val是increment_counter的local变量，此处不可见）
    local commit_counter
    commit_counter=$(grep "军师被调用总次数" "$DISPATCH_COUNTER" | head -1 | awk -F'|' '{print $3}' | sed 's/[^0-9]*//g')
    [ -z "$commit_counter" ] && commit_counter="未知"
    local commit_msg="军师第${commit_counter}次调用后自动提交 $(date '+%Y-%m-%d %H:%M')"
    git commit -m "$commit_msg" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  git：已提交（${commit_msg}）"
    else
        echo "  [警告] git提交失败，请手动检查"
    fi
}

# ============================================================
# 缓存生成（v2.2新增，硬障碍3配套）
# ============================================================
generate_cache() {
    mkdir -p "$CACHE_DIR"

    # 角度库摘要缓存
    if [ -f "$COGNITIVE_FRAMEWORK" ]; then
        local angle_hash
        angle_hash=$(md5sum "$COGNITIVE_FRAMEWORK" | awk '{print $1}')
        local angle_cache="$CACHE_DIR/angle-summary.md"

        cat > "$angle_cache" << EOF
## Cache Metadata
source_file: js-cognitive-framework.md
source_path: $COGNITIVE_FRAMEWORK
source_hash: $angle_hash

## Cache Content
$(grep '^### ANGLE-' "$COGNITIVE_FRAMEWORK" 2>/dev/null | sed 's/### //')
EOF
        echo "  缓存已更新：angle-summary.md (hash: ${angle_hash:0:8})"
    fi
}

# ============================================================
# 主流程
# ============================================================

echo "================================================================"
echo "军师收工流程 - js-end.sh $VERSION"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================"
echo ""

echo "计数器+1"
echo "----------------------------------------------------------------"
increment_counter
echo ""

# 引用一致性检查（每次收工自动执行）
verify_refs
echo ""

# git自动提交（每次收工执行，修复ISSUE-009）
echo "git自动提交"
echo "----------------------------------------------------------------"
git_commit_changes
echo ""

# 缓存生成（git提交后执行，硬障碍3配套）
echo "缓存生成"
echo "----------------------------------------------------------------"
generate_cache
echo ""

echo "================================================================"
echo "收工流程完成 - js-end.sh $VERSION"
echo "================================================================"
echo ""
echo "后续步骤（军师手工完成，按本次实际情况选择执行）："
echo "1. 【如本次修改了角度库】在js-cognitive-framework.md文件头追加变更记录（超5条归档最早的到changelog.md）"
echo "2. 【如本次值得回顾】在js-self-review.md追加自回顾记录+DET自检"
echo "3. 【如本次有新经验】在js-cognitive.md追加一句话记忆"
