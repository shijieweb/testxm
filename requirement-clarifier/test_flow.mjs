/**
 * 需求拷问台 · 端到端完整流程模拟（ESM）
 * 每轮选取"更丰富"的回答，模拟真实用户逐步完善需求
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
globalThis.window = { ClarifierAPI: null };
eval(readFileSync(join(__dirname, 'api.js'), 'utf-8'));
const ClarifierAPI = globalThis.window.ClarifierAPI;

const DIM = {
  goal:     { name: '目标清晰', max: 25 },
  audience: { name: '用户/场景', max: 15 },
  boundary: { name: '边界',     max: 15 },
  success:  { name: '成功标准', max: 25 },
  priority: { name: '优先级',   max: 20 },
};
const DORDER = ['goal','audience','boundary','success','priority'];

// 每个维度按"长度/丰富度"排序的回答（从简到丰）
const ANSWERS = {
  goal: [
    '做电商登录',                                                          // +0
    '做一个电商登录系统',                                                   // +0.34
    '做一个电商登录系统，目标3秒完成注册降低流失率',                         // +0.50
    '做一个B端电商管理系统，核心目标是让商家3秒内完成登录并进入工作台，降低流失率，提升转化率', // +0.60
  ],
  audience: [
    '商家',                                                                // +0
    'B端中小商家',                                                         // +0.34
    '主要是B端中小商家，每天登录后台管理商品和订单',                       // +0.45
    '主要是B端中小商家，他们每天要登录后台管理商品、订单和发货，使用频率很高',// +0.60
  ],
  boundary: [
    '不做移动端',                                                          // +0.34
    'MVP阶段不做移动端、多语言、第三方支付',                               // +0.45
    'MVP阶段明确不做移动端App、不做多语言、不接支付、不做智能推荐',         // +0.55
    'MVP阶段明确不做移动端App、不做多语言、不接第三方支付、不做智能推荐，只做Web后台', // +0.60
  ],
  success: [
    '提升满意度',                                                          // +0.34
    '日活≥1万，转化率≥3%',                                                 // +0.50
    '日活≥1万，次日留存≥40%，转化率≥3%',                                   // +0.56
    '日活≥1万，次日留存≥40%，注册到登录成功率≥90%，转化率≥3%，客诉率<1%',   // +0.60
  ],
  priority: [
    '先做登录',                                                            // +0.34
    '一期做注册登录，支付推迟到二期',                                      // +0.45
    '一期先做账号注册和登录（手机号+验证码），支付和推荐功能推迟到二期',     // +0.55
    '一期只做账号注册和登录（含手机号+验证码），支付、推荐、分销全部推迟到二期', // +0.60
  ],
};

const collect = {};
DORDER.forEach(d => collect[d] = { text: '', score: 0, max: DIM[d].max });
const history = [];

let round = 0;
let deadlock = false;
const MAX_ROUND = 20;

console.log('═'.repeat(64));
console.log('  需求拷问台 · 自动多轮对话模拟（直到达标或死循环检测）');
console.log('═'.repeat(64));

while (round < MAX_ROUND) {
  round++;
  const q = ClarifierAPI.askClarifier(collect, history);

  let total = 0;
  DORDER.forEach(d => total += Math.round(collect[d].score * collect[d].max));

  // 检查是否达标
  if (q.type === 'ready' || total >= 60) {
    console.log(`\n🏁 第${round}轮：✅ 所有维度达标！总分 ${total}/100，可生成文档`);
    deadlock = false;
    break;
  }

  const tag = q.dim;
  const dk = Object.keys(DIM).find(k => DIM[k].name === tag) || 'goal';

  // 选取当前维度当前分数对应的"进阶"回答（分数越高选越好的回答）
  let ansIdx = Math.min(ANSWERS[dk].length - 1, Math.max(0, Math.floor(collect[dk].score * ANSWERS[dk].length)));
  let answer = ANSWERS[dk][ansIdx];
  let ex = ClarifierAPI.extractFromAnswer(dk, answer);

  // 如果最短回答得0分，自动选下一个更丰富的回答（防止死循环）
  if (ex.score === 0 && ansIdx < ANSWERS[dk].length - 1) {
    ansIdx++;
    answer = ANSWERS[dk][ansIdx];
    ex = ClarifierAPI.extractFromAnswer(dk, answer);
  }

  // 如果最丰富回答也得0分，死循环，需人工介入
  if (ex.score === 0) {
    console.log(`\n⚠️  第${round}轮：死循环检测 — 维度"${tag}"已用最好回答但仍不得分，需人工介入`);
    deadlock = true;
    break;
  }

  collect[dk].text = collect[dk].text ? collect[dk].text + '；' + answer : answer;
  collect[dk].score = Math.min(1, collect[dk].score + ex.score);
  history.push({ role: 'user', text: answer });

  total = 0;
  DORDER.forEach(d => total += Math.round(collect[d].score * collect[d].max));

  console.log(`\n📌 第${round}轮 — 追问: ${tag}`);
  console.log(`   回答: "${answer.slice(0,52)}${answer.length>52?'…':''}"`);
  console.log(`   +${ex.score.toFixed(2)} (${ex.note})`);
  DORDER.forEach(d => {
    const sc = Math.round(collect[d].score * collect[d].max);
    const mx = DIM[d].max;
    const pct = Math.round(collect[d].score * 100);
    const ok = sc >= mx * 0.6;
    const bar = '█'.repeat(Math.min(10, Math.round(pct/10))) + '░'.repeat(10 - Math.min(10, Math.round(pct/10)));
    console.log(`   │ ${ok?'🟢':'⬜'} ${DIM[d].name.padEnd(10)} ${bar} ${sc.toString().padStart(2)}/${mx}(${pct}%)│`);
  });
  console.log(`   总分: ${total}/100 ${total>=60?'🟢 达标！':'🟡 继续追问'}`);
}

console.log('\n' + '═'.repeat(64));
if (!deadlock) {
  let total = 0;
  DORDER.forEach(d => total += Math.round(collect[d].score * collect[d].max));
  console.log(`  ✅ 完成！共 ${round} 轮，总分 ${total}/100`);
} else {
  console.log('  ⚠️ 死循环终止，需人工介入补充缺失信息');
}
console.log('═'.repeat(64));
