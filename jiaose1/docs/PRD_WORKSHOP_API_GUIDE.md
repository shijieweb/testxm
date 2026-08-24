# PRD Workshop 原型 — 接入真实 LLM API

本原型目前是 Mock 数据模式，只需修改 `AI_CONFIG` 即可接入真实的 OpenAI 兼容 API。

## 接入步骤

1. 打开文件：`frontend/src/pages/prd-interviewer/index.html`

2. 找到 `AI_CONFIG` 对象（约在第 350 行），修改为：

```javascript
const AI_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: 'YOUR_OPENAI_API_KEY',        // ← 填入你的 key
  model: 'gpt-4o-mini',                 // 或 'gpt-4o', 'claude-3-haiku' 等
  temperature: 0.7,
  maxTokens: 2048,
};
```

3. 如果是其他 OpenAI 兼容服务（如 DeepSeek、通义千问等），修改 endpoint 即可：
   - DeepSeek: `https://api.deepseek.com/v1/chat/completions`
   - 通义千问: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - ollama: `http://localhost:11434/v1/chat/completions`

4. 保存后直接在浏览器打开文件即可使用。

## 调用逻辑

当用户输入想法后，原型会：
1. 将用户输入 + 当前轮次的历史对话组装成 prompt
2. 调用 AI_CONFIG.endpoint 发送 POST 请求
3. 解析返回的 JSON，提取 score / clarification_questions / prd
4. 根据 score 决定是否触发追问

## 注意事项

- 当前原型只有 Mock 模式完整可用，API 模式需要确保 endpoint 返回符合期望的 JSON 格式
- 返回格式必须包含：`score`（数字）、`needs_clarification`（布尔）、`clarification_questions`（字符串数组）或 `prd`（对象）
- 如果 API 返回非 JSON 格式，会被 `_parse_json` 自动剥离 markdown 代码块后再解析
