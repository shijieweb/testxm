/* =====================================================
 * app.js — 需求拷问台主逻辑
 * 左：动态追问区（对话流，AI 澄清官持续拷问）
 * 右：实时可视化（总分仪表 + 五维雷达 + 进度 + 需求骨架）
 * 评分卡：目标25/用户15/边界15/成功25/优先级20 = 100，<60 不放行
 * ===================================================== */
"use strict";

const $ = (s) => document.querySelector(s);

const DIMENSIONS = {
  goal:     { name: "目标清晰",  max: 25 },
  audience: { name: "用户/场景", max: 15 },
  boundary: { name: "边界",      max: 15 },
  success:  { name: "成功标准",  max: 25 },
  priority: { name: "优先级",    max: 20 },
};
const DIM_ORDER = ["goal", "audience", "boundary", "success", "priority"];

/* 每个维度收集到的信息 */
const collect = {};
DIM_ORDER.forEach((d) => (collect[d] = { text: "", score: 0, max: DIMENSIONS[d].max }));

const state = {
  history: [],      // [{role:'user'|'ai', text}]
  round: 0,
  phase: "clarify", // clarify | ready | generated
};

/* ========== 渲染：对话流 ========== */
function addMsg(role, text, meta) {
  state.history.push({ role, text });
  const scroll = $("#chatScroll");
  const el = document.createElement("div");
  el.className = "msg " + role;
  const avatar = role === "ai" ? "AI" : "你";
  const extra = meta ? `<span class="msg-meta">${meta}</span>` : "";
  el.innerHTML = `<div class="msg-avatar">${avatar}</div><div class="msg-bubble">${escapeHtml(text)}${extra}</div>`;
  scroll.appendChild(el);
  scroll.scrollTop = scroll.scrollHeight;
  $("#roundLabel").textContent = `第 ${state.round} 轮`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ========== 评分与进度 ========== */
function dimScore(d) { return Math.round(collect[d].score * collect[d].max); }
function totalScore() { return DIM_ORDER.reduce((s, d) => s + dimScore(d), 0); }

function renderGauge() {
  const total = totalScore();
  const pct = Math.min(total, 100);
  const circ = 2 * Math.PI * 52;
  const el = $("#gaugeValue");
  el.style.strokeDasharray = circ;
  el.style.strokeDashoffset = circ * (1 - pct / 100);
  $("#gaugeNum").textContent = total;
  const note = $("#gaugeNote");
  const ok = total >= 60;
  note.textContent = ok ? "达标，可生成需求文档" : "需求尚未达标，不放行";
  note.classList.toggle("pass", ok);
  el.style.stroke = ok ? "var(--success)" : "#f87171";
  $("#phasePill").className = "pill " + (ok ? "done" : "live");
  $("#phasePill").textContent = ok ? "达标" : "澄清中";
}

function renderDims() {
  const list = $("#dimList");
  list.innerHTML = "";
  DIM_ORDER.forEach((d) => {
    const sc = dimScore(d), max = DIMENSIONS[d].max;
    const ok = sc >= max * 0.6;
    const pct = Math.min(100, (sc / max) * 100);
    const row = document.createElement("div");
    row.className = "dim-row";
    row.innerHTML = `
      <div class="dim-top">
        <span class="dim-name">${DIMENSIONS[d].name}
          <span class="dim-tag ${ok ? "attain" : "need"}">${ok ? "已稳" : "待补"}</span></span>
        <span class="dim-score ${ok ? "ok" : ""}">${sc} / ${max}</span>
      </div>
      <div class="dim-bar"><div class="dim-fill ${ok ? "ok" : "low"}" style="width:${pct}%"></div></div>`;
    list.appendChild(row);
  });
}

/* ========== 雷达图 ========== */
function renderRadar() {
  const svg = $("#radarSvg");
  const cx = 110, cy = 110, R = 82, n = 5;
  const ring = 220;
  let out = "";
  // 网格（4 层）
  for (let layer = 1; layer <= 4; layer++) {
    const r = R * layer / 4;
    let pts = [];
    DIM_ORDER.forEach((_, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    });
    out += `<polygon class="radar-grid" points="${pts.join(" ")}"/>`;
  }
  // 轴线 + 标签
  const labels = { goal: "目标", audience: "用户", boundary: "边界", success: "成功", priority: "优先级" };
  DIM_ORDER.forEach((d, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    out += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(a)}" y2="${cy + R * Math.sin(a)}"/>`;
    const lx = cx + (R + 24) * Math.cos(a), ly = cy + (R + 24) * Math.sin(a);
    out += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="middle">${labels[d]}</text>`;
    // 顶点小圆
    const sc = collect[d].score;
    const rr = cx + R * sc * Math.cos(a), ry = cy + R * sc * Math.sin(a);
    out += `<circle class="radar-point" cx="${rr}" cy="${ry}" r="3"/>`;
  });
  // 数据多边形
  let dataPts = [];
  DIM_ORDER.forEach((d, i) => {
    const sc = Math.max(0.05, collect[d].score);
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    dataPts.push(`${cx + R * sc * Math.cos(a)},${cy + R * sc * Math.sin(a)}`);
  });
  out += `<polygon class="radar-area" points="${dataPts.join(" ")}"/>`;
  svg.innerHTML = out;
}

/* ========== 需求骨架 ========== */
function renderSkeleton() {
  const body = $("#skeletonBody");
  const map = {
    goal:     { label: "目标",     k: "项目一句话目标" },
    audience: { label: "用户场景", k: "谁用/何时用" },
    boundary: { label: "边界",     k: "本版不做什么" },
    success:  { label: "成功标准", k: "量化指标" },
    priority: { label: "优先级",   k: "一期核心功能" },
  };
  let filled = 0;
  let html = '<div class="sk-grid">';
  DIM_ORDER.forEach((d) => {
    const item = collect[d];
    const sc = dimScore(d);
    const has = item.text.trim().length > 0;
    if (has && sc > 0) filled++;
    html += `<div class="sk-block ${has ? "filled" : ""}">
      <div class="sk-head"><span class="sk-key">${map[d].k}</span>
        <span class="sk-chips">${sc}/${DIMENSIONS[d].max}分 · ${sc >= DIMENSIONS[d].max * 0.6 ? "已稳" : "待补"}</span></div>
      ${has ? `<div class="sk-val">${escapeHtml(trunc(item.text, 46))}</div>`
            : `<div class="sk-val sk-empty">— 待回答 —</div>`}
    </div>`;
  });
  html += "</div>";
  body.innerHTML = html;
  $("#skeletonState").textContent = filled === 5 ? "已充实" : `${filled}/5 充实`;
  $("#skeletonState").className = "idle-tag " + (filled === 5 ? "filled" : "");
  // 生成按钮
  const ok = totalScore() >= 60;
  const btn = $("#genBtn");
  btn.disabled = !ok;
  if (ok) btn.textContent = "✦ 生成可落地需求文档";
}

function trunc(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

/* ========== 追问流程 ========== */
async function startClarify() {
  state.round = 0;
  state.history = [];
  DIM_ORDER.forEach((d) => (collect[d] = { text: "", score: 0, max: DIMENSIONS[d].max }));
  $("#chatScroll").innerHTML = "";
  $("#chatDimTag").textContent = "目标清晰";
  const opens = ["你好，我是你的【需求澄清官】。", "我不会马上给你方案，会一条一条拷问，直到你的需求能落地。", "先从第一个关键问题开始——"];
  addMsg("ai", opens.join("\n"));
  renderAll();
  const next = await ClarifierAPI.askClarifier(collect, state.history);
  pushQuestion(next);
}

function pushQuestion(q) {
  if (!q) { state.phase = "ready"; setReady(); return; }
  addMsg("ai", q.text, "关注维度 · " + q.dim);
  $("#chatDimTag").textContent = q.dim;
  setupQuick(q.dim);
}

function setupQuick(dim) {
  const hint = {
    goal: ["做一个电商登录", "提升内部审批效率", "做一个数据分析后台"],
    audience: ["B端运营人员", "C端消费者", "内部销售团队"],
    boundary: ["MVP 不做移动端", "本阶段不做支付", "不做多语言"],
    success: ["目标日活 1 万", "转化率 ≥ 3%", "次日留存 ≥ 40%"],
    priority: ["先做注册登录", "核心是订单流程", "先做数据看板"],
  }[dim] || [];
  $("#quickHints").innerHTML = hint.map((h) => `<button class="quick" data-h="${h}">${h}</button>`).join("");
}

async function handleAnswer(text) {
  state.round++;
  addMsg("user", text);
  // 更新当前正在追问的维度
  const curDim = $("#chatDimTag").textContent;
  const dimKey = Object.keys(DIMENSIONS).find((d) => DIMENSIONS[d].name === curDim) || "goal";
  const ex = ClarifierAPI.extractFromAnswer(dimKey, text);
  // 合并信息：同维度信息追加
  const item = collect[dimKey];
  item.text = item.text ? item.text + "；" + text : text;
  item.score = Math.min(1, item.score + ex.score);
  renderAll();

  const next = await ClarifierAPI.askClarifier(collect, state.history);
  pushQuestion(next);
}

function setReady() {
  state.phase = "ready";
  $("#chatDimTag").textContent = "已达标";
  addMsg("ai", "所有关键维度已澄清，需求已达到 60 分门槛，可以生成落地需求文档。右侧「生成」按钮已解锁。");
  renderAll();
}

/* ========== 渲染全部 ========== */
function renderAll() { renderGauge(); renderDims(); renderRadar(); renderSkeleton(); }

/* ========== 文档生成 ========== */
function generateDocument() {
  const g = (d) => collect[d].text.trim() || "（未填写，需人工复核）";
  const doc = `# 项目需求文档（由需求拷问台动态澄清生成）

> 总分 ${totalScore()} / 100，已达标放行。以下内容由逐条拷问提取。

## 一、项目目标
${g("goal")}

## 二、目标用户与使用场景
${g("audience")}

## 三、项目边界（MVP 不做什么）
${g("boundary")}

## 四、成功标准（量化）
${g("success")}

## 五、优先级（一期核心 + 可推迟）
${g("priority")}

## 六、验收标准（草案）
- [ ] 一期核心功能（${g("priority").split("；")[0]}）可完整跑通
- [ ] 达到成功指标（${g("success").split("；")[0]}）
- [ ] 未纳入边界范围的功能不实现

## 七、风险与代价
- **时间代价：** 按一期边界交付
- **风险：** 达标源自评分充分，业务正确性需评审复核
`;
  $("#docBody").textContent = doc;
  $("#docDrawer").classList.add("open");
  window.__doc = doc;
  toast("需求文档已生成");
  state.phase = "generated";
}

/* ========== 工具 ========== */
let toastTimer;
function toast(msg, err) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (err ? " err" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2400);
}

/* ========== 初始化 ========== */
function init() {
  const circ = 2 * Math.PI * 52;
  const gv = $("#gaugeValue");
  gv.style.strokeDasharray = circ;
  gv.style.strokeDashoffset = circ;

  // 发送逻辑
  const send = async () => {
    const input = $("#chatInput");
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    $("#quickHints").innerHTML = "";
    await handleAnswer(v);
  };
  $("#sendBtn").addEventListener("click", send);
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  $("#quickHints").addEventListener("click", (e) => {
    const b = e.target.closest(".quick");
    if (!b) return;
    $("#chatInput").value = b.dataset.h;
    send();
  });

  // 生成
  $("#genBtn").addEventListener("click", () => {
    if (totalScore() >= 60) generateDocument();
    else toast("需求未达标，不能生成", true);
  });
  $("#copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#docBody").textContent); toast("已复制"); }
    catch { toast("复制失败", true); }
  });
  $("#downloadBtn").addEventListener("click", () => {
    if (!window.__doc) return;
    const blob = new Blob([window.__doc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "项目需求文档.md"; a.click();
    URL.revokeObjectURL(url); toast("已下载 .md");
  });
  $("#restartBtn").addEventListener("click", startClarify);

  startClarify();
}

document.addEventListener("DOMContentLoaded", init);