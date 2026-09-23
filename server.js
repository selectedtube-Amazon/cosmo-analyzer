const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// DeepSeek 代理接口
app.post('/api/deepseek', async (req, res) => {
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ success: false, error: '服务端未配置 DEEPSEEK_API_KEY' });
  }

  const { messages, temperature = 0.7, max_tokens = 4000, response_format } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, error: 'messages 不能为空' });
  }

  try {
    const payload = {
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens,
      stream: false
    };
    if (response_format) payload.response_format = response_format;

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error('[DeepSeek Error]', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

// 健康检查
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 兜底：其他请求返回首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
