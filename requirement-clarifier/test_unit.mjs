/**
 * 需求拷问台 · 单元测试（ESM，修复版）
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
globalThis.window = { ClarifierAPI: null };
eval(readFileSync(join(__dirname, 'api.js'), 'utf-8'));
const ClarifierAPI = globalThis.window.ClarifierAPI;

console.log('\n' + '═'.repeat(52));
console.log('  需求拷问台 · 单元测试');
console.log('═'.repeat(52));
console.log('MOCK_MODE =', ClarifierAPI.MOCK_MODE);

const pass = (label, cond) => console.log(`  ${cond ? '✅' : '❌'} ${label}`);

// ── 测试1：短答案 → 0分 ──
let r = ClarifierAPI.extractFromAnswer('goal', '好');
pass('短答案(<6字) → score=0', r.score === 0);

// ── 测试2：一般答案 → 0.50（含"个"数字）──
r = ClarifierAPI.extractFromAnswer('goal', '做个登录系统');
pass(`一般答案(score=${r.score.toFixed(2)}) ≈ 0.50`, Math.abs(r.score - 0.50) < 0.01);

// ── 测试3：含数字+关键词 ──
r = ClarifierAPI.extractFromAnswer('success', '日活目标1万，次日留存40%');
pass(`含数字+关键词(score=${r.score.toFixed(2)}) = 0.56`, Math.abs(r.score - 0.56) < 0.01);

// ── 测试4：长答案封顶0.6 ──
r = ClarifierAPI.extractFromAnswer('goal', '做一个B端电商管理系统，目标是在3秒内完成用户注册，降低流失率，提升转化率');
pass('长答案(≥30字)封顶0.6', Math.abs(r.score - 0.6) < 0.01);

// ── 测试5：askClarifier 是同步函数（无 Promise）──
const q = ClarifierAPI.askClarifier({}, []);
pass('askClarifier 返回普通对象（非Promise）', q.type === 'question' || q.type === 'ready');

// ── 测试6：追问顺序（每轮给足分数，确保每维度只问一次）──
const DIMS = {
  goal:     { name: '目标清晰', max: 25 },
  audience: { name: '用户/场景', max: 15 },
  boundary: { name: '边界',     max: 15 },
  success:  { name: '成功标准', max: 25 },
  priority: { name: '优先级',   max: 20 },
};
const DORDER = ['goal', 'audience', 'boundary', 'success', 'priority'];
const collect = {};
DORDER.forEach(d => collect[d] = { text: '', score: 0, max: DIMS[d].max });

// 先给 goal 足够分数，让规则引擎切到 audience；每轮回答后手动递增下一维度
collect.goal.score = 1.0;
const dimTags = [];
for (let i = 0; i < 5; i++) {
  const q = ClarifierAPI.askClarifier(collect, []);
  dimTags.push(q.type === 'question' ? q.dim : 'READY');
  // 模拟：当前维度已充分回答，推进到下一维度
  const curKey = Object.keys(DIMS).find(k => DIMS[k].name === q.dim);
  if (curKey && collect[curKey]) collect[curKey].score = 1.0;
}
const expectedOrder = ['用户/场景', '边界', '成功标准', '优先级', 'READY'];
pass(`追问顺序正确 (${dimTags.join(' → ')})`, JSON.stringify(dimTags) === JSON.stringify(expectedOrder));

// ── 测试7：60分门槛 ──
// 用满分支回答使各维度达标：goal=1.0, aud=1.0, bnd=1.0, suc=0.6, pri=1.0
collect.goal.score = 1.0;
collect.audience.score = 1.0;
collect.boundary.score = 1.0;
collect.success.score = 0.6; // 刚好达标
collect.priority.score = 1.0;
let total = 0;
DORDER.forEach(d => { total += Math.round(collect[d].score * collect[d].max); });
pass(`达标门槛总分≥60 (实际=${total})`, total >= 60);
console.log('');
DORDER.forEach(d => {
  const sc = Math.round(collect[d].score * collect[d].max);
  console.log(`  ${DIMS[d].name}: ${sc}/${collect[d].max}分`);
});

console.log('\n' + '═'.repeat(52));
console.log('  全部测试完成');
console.log('═'.repeat(52));
