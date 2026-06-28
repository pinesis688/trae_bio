/**
 * ============================================================
 * BioQuest — 前端 AI 客户端（纯前端，无 server.py 依赖）
 * 直连用户配置的 LLM API（DeepSeek/智谱/通义/Kimi/NVIDIA/SiliconFlow）
 * 兼容平台默认 Key（若 server.py 仍在运行则回退到 /chat）
 * ============================================================
 */

(function () {
  'use strict';

  // 服务商 → base_url + 默认模型
  var PROVIDER_MAP = {
    deepseek:    { base: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', name: 'DeepSeek' },
    zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash', name: '智谱 GLM' },
    qwen:        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-turbo', name: '通义千问' },
    moonshot:    { base: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', name: 'Kimi' },
    nvidia:      { base: 'https://integrate.api.nvidia.com/v1', defaultModel: 'meta/llama-3.3-70b-instruct', name: 'NVIDIA NIM' },
    siliconflow: { base: 'https://api.siliconflow.cn/v1', defaultModel: 'Qwen/Qwen2.5-7B-Instruct', name: '硅基流动' }
  };

  // 服务商 → 视觉多模态模型（用于图片 OCR、识图等）
  // 按优先级排序：1. 智谱 GLM-4V（中文 OCR 最强）2. 通义 Qwen-VL 3. SiliconFlow Qwen2-VL 4. NVIDIA Llama-Vision
  var VISION_MODELS = {
    zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-flash', name: '智谱 GLM-4V' },
    qwen:        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-plus', name: '通义 Qwen-VL' },
    siliconflow: { base: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2-VL-72B-Instruct', name: '硅基 Qwen2-VL' },
    nvidia:      { base: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.2-90b-vision-instruct', name: 'NVIDIA Llama-Vision' }
  };

  // 内置默认智谱 GLM-4-Flash 免费 Key（开发期共享，用户可在「我的 → 设置」覆盖）
  // GLM-4-Flash 为免费模型，支持浏览器 CORS 直连
  var DEFAULT_ZHIPU_KEY = 'f514e5711cb4485a918099e4c8a7d3e7.lbQMs3NIZtsYZVWF';

  // 加载用户配置（与 user.js 共享 localStorage key）
  function loadConfig() {
    try {
      var raw = localStorage.getItem('bioquest_ai_key_config');
      if (raw) {
        var cfg = JSON.parse(raw);
        // 用户已配置自有 Key → 优先使用
        if (cfg.apiKey) return cfg;
      }
    } catch (e) {}
    // 无用户配置 → 使用内置智谱 GLM-4-Flash 默认 Key
    return { provider: 'zhipu', apiKey: DEFAULT_ZHIPU_KEY, model: 'glm-4-flash' };
  }

  // 检查每日用量上限
  function getUsage() {
    try {
      var raw = localStorage.getItem('bioquest_ai_usage');
      var data = raw ? JSON.parse(raw) : {};
      var today = new Date().toISOString().slice(0, 10);
      if (data.date !== today) {
        data = { date: today, count: 0 };
        localStorage.setItem('bioquest_ai_usage', JSON.stringify(data));
      }
      return data;
    } catch (e) { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
  }

  function incrementUsage() {
    var data = getUsage();
    if (data.count >= 100) return false;
    data.count += 1;
    try { localStorage.setItem('bioquest_ai_usage', JSON.stringify(data)); } catch (e) {}
    return true;
  }

  function canUse() {
    var cfg = loadConfig();
    if (!cfg.apiKey) {
      // 无自定义 Key 时，若后端 server.py 在运行则用之，否则提示配置
      return { ok: true, useBackend: true };
    }
    var data = getUsage();
    if (data.count >= 100) return { ok: false, reason: '今日 AI 调用已达上限（100 次），明日 0:00 重置' };
    return { ok: true, useBackend: false, config: cfg };
  }

  /**
   * 流式对话（SSE）
   * @param {Object} opts - { messages, temperature, maxTokens, onChunk, onDone, onError, signal }
   * @returns {Promise<void>}
   */
  function streamChat(opts) {
    var check = canUse();
    if (!check.ok) {
      if (opts.onError) opts.onError(new Error(check.reason));
      return Promise.reject(new Error(check.reason));
    }

    // 无自定义 Key → 回退到 server.py 后端
    if (check.useBackend) {
      return _streamViaBackend(opts);
    }

    var cfg = check.config;
    var prov = PROVIDER_MAP[cfg.provider] || PROVIDER_MAP.deepseek;
    var model = cfg.model || prov.defaultModel;
    var url = prov.base + '/chat/completions';

    var body = JSON.stringify({
      model: model,
      messages: opts.messages,
      temperature: opts.temperature != null ? opts.temperature : 0.7,
      max_tokens: opts.maxTokens || 2048,
      stream: true
    });

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey,
        'Accept': 'text/event-stream'
      },
      body: body,
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      incrementUsage();
      return _pumpSse(resp, opts);
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      // 网络错误（CORS / 连接失败）—— 不再回退到 /chat 后端（纯前端项目无后端）
      // 直接把错误透传给用户，避免无声失败
      console.warn('[ai-client] 直连失败:', err.message);
      if (opts.onError) opts.onError(err);
    });
  }

  /**
   * 非流式对话（一次性返回完整结果）
   */
  function chat(opts) {
    var check = canUse();
    if (!check.ok) return Promise.reject(new Error(check.reason));

    if (check.useBackend) return _chatViaBackend(opts);

    var cfg = check.config;
    var prov = PROVIDER_MAP[cfg.provider] || PROVIDER_MAP.deepseek;
    var model = cfg.model || prov.defaultModel;
    var url = prov.base + '/chat/completions';

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: opts.messages,
        temperature: opts.temperature != null ? opts.temperature : 0.3,
        max_tokens: opts.maxTokens || 1024,
        stream: false
      }),
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          throw new Error('HTTP ' + resp.status + ': ' + txt.slice(0, 200));
        });
      }
      incrementUsage();
      return resp.json();
    }).catch(function (err) {
      if (err.name === 'AbortError') throw err;
      // 纯前端项目无后端，直连失败直接抛错
      throw err;
    });
  }

  // ====== SSE 解析（fetch + ReadableStream，兼容性强） ======
  function _pumpSse(resp, opts) {
    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    // 超时看门狗：若 60 秒内无任何数据，自动中止并触发 onDone（防止连接挂起导致卡死）
    var IDLE_TIMEOUT = 60000;
    var idleTimer = null;
    var aborted = false;

    function clearIdle() {
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    }
    function resetIdle() {
      clearIdle();
      idleTimer = setTimeout(function () {
        if (!aborted) {
          console.warn('[ai-client] 流式空闲超时(60s)，自动结束');
          aborted = true;
          try { reader.cancel(); } catch (e) {}
          if (opts.onDone) opts.onDone();
        }
      }, IDLE_TIMEOUT);
    }
    resetIdle();

    function pump() {
      return reader.read().then(function (result) {
        if (aborted) return;
        resetIdle();
        if (result.done) {
          clearIdle();
          if (opts.onDone) opts.onDone();
          return;
        }
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop();

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || line === 'data: [DONE]') continue;
          if (line.indexOf('data: ') !== 0) continue;
          try {
            var obj = JSON.parse(line.slice(6));
            var delta = obj.choices && obj.choices[0] && obj.choices[0].delta;
            if (!delta) continue;
            // 正式回复内容
            if (delta.content && opts.onChunk) {
              opts.onChunk(delta.content);
            }
            // 思考型模型的推理过程（reasoning_content / reasoning）——跳过不输出给用户，
            // 但只要收到推理 token 就说明连接活跃，resetIdle 已在上面处理
          } catch (e) { /* 忽略解析错误 */ }
        }
        return pump();
      }).catch(function (err) {
        clearIdle();
        if (aborted) return;
        if (err && err.name === 'AbortError') return;
        // 读取异常时视为结束，避免卡死
        if (opts.onDone) opts.onDone();
      });
    }
    return pump();
  }

  // ====== 后端回退（仅当 server.py 在运行时） ======
  function _backendAvailable() {
    // 通过端口探测：localhost:8000 是否响应
    // 这里简单返回 true，让 fetch 失败时尝试回退；若后端不在则回退也失败，前端报错
    return true;
  }

  function _streamViaBackend(opts) {
    // 兼容旧 /chat 端点（server.py 提供）
    return fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: opts.messages[opts.messages.length - 1].content,
        mode: opts.mode || 'general',
        history: opts.messages.slice(0, -1).map(function (m) {
          return { role: m.role, content: m.content };
        })
      }),
      signal: opts.signal
    }).then(function (resp) {
      // 后端不在运行（Python http.server 返回 404 HTML 错误页）
      // 必须检查 resp.ok，否则会把 HTML 错误页当作 SSE 流解析，导致 AI 无声失败
      if (!resp.ok) {
        var err = new Error('AI 后端不可用（/chat 返回 HTTP ' + resp.status + '）。请前往「我的 → 设置」配置 AI API Key 以使用 AI 功能。');
        err.code = 'BACKEND_UNAVAILABLE';
        if (opts.onError) opts.onError(err);
        return;
      }
      // 检查 Content-Type 是否为 SSE 流
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('text/event-stream') < 0 && ct.indexOf('application/json') < 0 && ct.indexOf('text/plain') < 0) {
        var err2 = new Error('AI 后端未正确响应（Content-Type: ' + ct + '）。请前往「我的 → 设置」配置 AI API Key。');
        err2.code = 'BACKEND_UNAVAILABLE';
        if (opts.onError) opts.onError(err2);
        return;
      }
      incrementUsage();
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      var idleTimer = null;
      var aborted = false;
      function resetIdle() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function () {
          if (!aborted) {
            aborted = true;
            try { reader.cancel(); } catch (e) {}
            if (opts.onDone) opts.onDone();
          }
        }, 60000);
      }
      resetIdle();
      function pump() {
        return reader.read().then(function (result) {
          if (aborted) return;
          resetIdle();
          if (result.done) { if (idleTimer) clearTimeout(idleTimer); if (opts.onDone) opts.onDone(); return; }
          buf += decoder.decode(result.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]' || line.indexOf('data: ') !== 0) continue;
            try {
              var obj = JSON.parse(line.slice(6));
              if (obj.content && opts.onChunk) opts.onChunk(obj.content);
              if (obj.error && opts.onError) opts.onError(new Error(obj.error));
            } catch (e) {}
          }
          return pump();
        }).catch(function (err) {
          if (idleTimer) clearTimeout(idleTimer);
          if (aborted) return;
          if (err && err.name === 'AbortError') return;
          if (opts.onDone) opts.onDone();
        });
      }
      return pump();
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
    });
  }

  function _chatViaBackend(opts) {
    return fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: opts.messages[opts.messages.length - 1].content,
        mode: opts.mode || 'general',
        history: opts.messages.slice(0, -1).map(function (m) {
          return { role: m.role, content: m.content };
        })
      }),
      signal: opts.signal
    }).then(function (r) { incrementUsage(); return r.json(); });
  }

  // ====== 视觉多模态 OCR（识别图片中的中英文文字，支持斜体） ======
  /**
   * 使用用户配置的视觉模型识别图片文字（OCR）
   * @param {Object} opts - { image, prompt, onDone, onError, signal }
   *   image: dataURL（如 data:image/jpeg;base64,...）
   *   prompt: 提示词（默认要求保留斜体标记）
   * @returns {Promise<void>}
   */
  function visionRecognize(opts) {
    var cfg = loadConfig();
    if (!cfg.apiKey) {
      if (opts.onError) opts.onError(new Error('未配置 AI API Key，无法使用视觉 OCR'));
      return Promise.reject(new Error('未配置 AI API Key'));
    }

    // 选择视觉模型：优先使用用户当前服务商的视觉模型；若当前服务商不支持视觉，按优先级回退
    var visionProvider = null;
    if (VISION_MODELS[cfg.provider]) {
      visionProvider = VISION_MODELS[cfg.provider];
      visionProvider.key = cfg.provider;
    } else {
      // DeepSeek / Kimi 暂无视觉，回退到智谱
      visionProvider = VISION_MODELS.zhipu;
      visionProvider.key = 'zhipu';
    }

    var url = visionProvider.base + '/chat/completions';
    var prompt = opts.prompt || '请识别图片中的所有文字（包括中文、英文、数字、符号）。要求：\n1. 完整保留原文，按从上到下、从左到右的阅读顺序输出\n2. 数学公式用 LaTeX 语法输出（如 $x^2$ 、$\\frac{1}{2}$）\n3. 若文字为斜体，用 *斜体文字* 的 Markdown 语法标记\n4. 不要添加任何解释、说明或前后缀，只输出识别到的纯文字内容\n5. 表格用 Markdown 表格语法输出\n6. 图片中的图形、装饰、水印等非文字内容请忽略';

    var body = JSON.stringify({
      model: visionProvider.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: opts.image } }
        ]
      }],
      temperature: 0.1,
      max_tokens: 2048,
      stream: false
    });

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: body,
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      incrementUsage();
      return resp.json();
    }).then(function (data) {
      var text = '';
      try {
        text = data.choices[0].message.content || '';
      } catch (e) {}
      // 清理模型可能加的代码块包裹
      text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      if (opts.onDone) opts.onDone(text);
      return text;
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
      throw err;
    });
  }

  // 检查当前配置是否支持视觉 OCR
  function hasVisionSupport() {
    var cfg = loadConfig();
    // 必须有 API Key 且当前服务商在视觉模型表中（避免 DeepSeek/Kimi 误用智谱端点导致 401）
    return !!cfg.apiKey && !!VISION_MODELS[cfg.provider];
  }

  // ====== 暴露 API ======
  window.AiClient = {
    streamChat: streamChat,
    chat: chat,
    canUse: canUse,
    incrementUsage: incrementUsage,
    getUsage: getUsage,
    loadConfig: loadConfig,
    visionRecognize: visionRecognize,
    hasVisionSupport: hasVisionSupport,
    PROVIDER_MAP: PROVIDER_MAP,
    VISION_MODELS: VISION_MODELS
  };
})();
