/* =====================================================
 * api.js — API 服务层（stub）
 * 作用：把"动态追问/AI 澄清"封装成异步服务调用。
 * 当前：纯前端规则引擎兜底，离线可用。
 * 之后：切到真实 OpenAI 兼容 API，仅需改本文件，UI 不动。
 *
 * ⚠️ 接真实 API 时会把它放到本地代理服务端（Node），
 *    避免 key 暴露 + 规避浏览器 CORS。前端只调代理。
 * ===================================================== */

/* --- 可选：真实 API 配置（等你提供 key 后填入，走代理） ---
 * const API_BASE = "/api/chat";   // 本地代理端点，转发到 OpenAI 兼容地址
 */
const MOCK_MODE = true; // =true 用规则引擎兜底；=false 走真实 API

/* 内置规则引擎：根据"已收集信息 + 薄弱维度"产出下一条追问与维度评分预估 */
function ruleNextQuestion(collect) {
  // 按维度顺序追求"尚未充分"的维度
  const dimOrder = ["goal", "audience", "boundary", "success", "priority"];
  for (const d of dimOrder) {
    const info = collect[d];
    if (!info || (info.score * info.max) < info.max * 0.6) {
      return makeQuestionForDim(d, collect);
    }
  }
  return null; // 全部充分 → 可生成
}

function makeQuestionForDim(dim, collect) {
  const map = {
    goal: {
      tag: "目标清晰",
      ask: "「目标清晰」还差一点：用一句话说清这个项目到底要达成什么？如果已想清，请直接复述确认。",
    },
    audience: {
      tag: "用户/场景",
      ask: "「用户/场景」还差一点：谁会用它？在什么场景、多久用一次？实在明确就直接回答用户是谁。",
    },
    boundary: {
      tag: "边界",
      ask: "「边界」还差一点：明确说清这一版【不做什么】——哪些范围外的事本阶段不做？没有边界先答'MVP 外全部不做'。",
    },
    success: {
      tag: "成功标准",
      ask: "「成功标准」还差一点：用什么【可量化指标】判断它成功？（例如日活≥1万 / 转化率≥3%）",
    },
    priority: {
      tag: "优先级",
      ask: "「优先级」还差一点：第一版只做一个最核心功能，是哪个？哪些能推迟到二期？",
    },
  };
  return map[dim];
}

/* 主服务：对外暴露的"澄清一步"调用。
 * 入参：collect(当前已收集信息) , history(对话历史)
 * 返回：{ type:'question', dim, text, tag, score?: 预估 } 或 { type:'ready' }
 */
function askClarifier(collect, history) {
  // 若启用真实 API，这里改为调代理；当前返回规则结果
  const next = ruleNextQuestion(collect);
  if (!next) return { type: "ready" };
  return { type: "question", dim: next.tag, text: next.ask, progressGoal: "继续回答" };
}

/* 信息抽取：从用户一句回答中，尽力识别属于哪个维度、补几分。
 * 后端接真实 API 后可换用 LLM 结构化抽取；当前用启发式规则。 */
function extractFromAnswer(dim, text) {
  const len = (text || "").trim().length;
  if (len < 6) return { score: 0, note: "回答过短，需补充" };
  // 每次回答积累一部分评分；含量化信息给更高。让一个维度通常需回应 1-2 次才达 60% 阈值。
  let score = 0.34;
  const hasNumber = /[0-9０-９%％年月日个万亿分清]/.test(text);
  const hasConcrete = /(用户|场景|指标|功能|不做|推迟|B端|C端|目标|移动|支付|阶段|验证)/.test(text);
  if (hasNumber) score += 0.16;
  if (hasConcrete) score += 0.06;
  const rich = len >= 30;
  if (rich) score += 0.05;
  return { score: Math.min(0.6, score), note: hasNumber ? "含量化信息" : "尚缺量化" };
}

/* 暴露给 app.js 使用 */
window.ClarifierAPI = { askClarifier, extractFromAnswer, MOCK_MODE };