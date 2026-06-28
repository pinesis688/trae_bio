/**
 * ============================================================
 * BioQuest — AI 生物导师对话模块
 * 支持流式输出、模式切换（孟德尔/达尔文/沃森）、动画嵌入
 * ============================================================
 */

var _tutorStylesInjected = false;

function injectTutorStyles() {
  if (_tutorStylesInjected) return;
  _tutorStylesInjected = true;

  var style = document.createElement('style');
  style.id = 'bioquest-tutor-styles';
  style.textContent = [
    /* 页面容器 */
    '.tutor-page {',
    '  max-width: 800px;',
    '  margin: 0 auto;',
    '  padding: 16px 16px 100px;',
    '  display: flex;',
    '  flex-direction: column;',
    '  height: calc(100vh - var(--header-height, 64px) - 56px);',
    '  box-sizing: border-box;',
    '}',

    /* 模式切换器 */
    '.tutor-modes {',
    '  display: flex;',
    '  gap: 8px;',
    '  overflow-x: auto;',
    '  padding-bottom: 8px;',
    '  -webkit-overflow-scrolling: touch;',
    '  scrollbar-width: none;',
    '  flex-shrink: 0;',
    '}',
    '.tutor-modes::-webkit-scrollbar { display: none; }',
    '.tutor-mode {',
    '  flex-shrink: 0;',
    '  padding: 8px 16px;',
    '  border-radius: 20px;',
    '  background: var(--surface-secondary, #faf7f2);',
    '  border: 1.5px solid transparent;',
    '  cursor: pointer;',
    '  font-size: 0.82rem;',
    '  color: var(--text-secondary, #4a4a4a);',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  transition: all 0.2s;',
    '  white-space: nowrap;',
    '}',
    '.tutor-mode.active {',
    '  background: var(--color-sage, #5a7d5c);',
    '  color: #fff;',
    '  border-color: var(--color-sage, #5a7d5c);',
    '}',
    '.tutor-mode-avatar {',
    '  width: 20px;',
    '  height: 20px;',
    '  border-radius: 50%;',
    '  background: rgba(255,255,255,0.3);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-size: 0.7rem;',
    '}',
    '.tutor-mode.active .tutor-mode-avatar {',
    '  background: rgba(255,255,255,0.25);',
    '}',

    /* 消息区域 */
    '.tutor-messages {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  padding: 12px 0;',
    '  -webkit-overflow-scrolling: touch;',
    '  scroll-behavior: smooth;',
    '}',
    '.tutor-msg {',
    '  display: flex;',
    '  gap: 10px;',
    '  margin-bottom: 16px;',
    '  animation: tutorMsgIn 0.3s ease;',
    '}',
    '@keyframes tutorMsgIn {',
    '  from { opacity: 0; transform: translateY(8px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',
    '.tutor-msg-avatar {',
    '  width: 36px;',
    '  height: 36px;',
    '  border-radius: 50%;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-size: 1rem;',
    '  flex-shrink: 0;',
    '}',
    '.tutor-msg--user .tutor-msg-avatar {',
    '  background: linear-gradient(135deg, var(--color-sage, #5a7d5c), var(--color-deep, #1a3a2a));',
    '  color: #fff;',
    '}',
    '.tutor-msg--ai .tutor-msg-avatar {',
    '  background: linear-gradient(135deg, #c49a4a, #c47a4a);',
    '  color: #fff;',
    '}',
    '.tutor-msg-bubble {',
    '  background: var(--surface-primary, #fff);',
    '  padding: 12px 16px;',
    '  border-radius: 4px 16px 16px 16px;',
    '  font-size: 0.9rem;',
    '  line-height: 1.7;',
    '  color: var(--text-primary, #1a1a1a);',
    '  box-shadow: 0 1px 3px rgba(26,58,42,0.06);',
    '  max-width: calc(100% - 50px);',
    '  word-wrap: break-word;',
    '  overflow-wrap: break-word;',
    '}',
    '.tutor-msg--user .tutor-msg-bubble {',
    '  background: var(--color-sage, #5a7d5c);',
    '  color: #fff;',
    '  border-radius: 16px 4px 16px 16px;',
    '}',
    '.tutor-msg-bubble p { margin: 0 0 8px; }',
    '.tutor-msg-bubble p:last-child { margin-bottom: 0; }',
    '.tutor-msg-bubble code {',
    '  background: rgba(0,0,0,0.06);',
    '  padding: 2px 6px;',
    '  border-radius: 4px;',
    '  font-family: var(--font-mono, monospace);',
    '  font-size: 0.85em;',
    '}',
    '.tutor-svg-box {',
    '  margin: 10px 0;',
    '  padding: 8px;',
    '  background: rgba(255,255,255,0.04);',
    '  border: 1px solid var(--border-light, #ece8e1);',
    '  border-radius: 10px;',
    '  text-align: center;',
    '  overflow-x: auto;',
    '}',
    '.tutor-svg-box svg {',
    '  max-width: 100%;',
    '  height: auto;',
    '  display: inline-block;',
    '}',

    /* 动画嵌入区 */
    '.tutor-anim-embed {',
    '  margin-top: 10px;',
    '  border-radius: 12px;',
    '  overflow: hidden;',
    '  background: #000;',
    '  position: relative;',
    '}',
    '.tutor-anim-embed canvas {',
    '  display: block;',
    '  width: 100%;',
    '  height: 240px;',
    '}',
    '.tutor-anim-label {',
    '  position: absolute;',
    '  top: 8px;',
    '  left: 8px;',
    '  background: rgba(0,0,0,0.6);',
    '  color: #fff;',
    '  padding: 4px 10px;',
    '  border-radius: 12px;',
    '  font-size: 0.72rem;',
    '}',
    '.tutor-anim-open {',
    '  position: absolute;',
    '  bottom: 8px;',
    '  right: 8px;',
    '  background: rgba(255,255,255,0.9);',
    '  color: var(--color-deep, #1a3a2a);',
    '  border: none;',
    '  padding: 4px 12px;',
    '  border-radius: 12px;',
    '  font-size: 0.72rem;',
    '  cursor: pointer;',
    '}',

    /* 打字光标 */
    '.tutor-typing {',
    '  display: inline-block;',
    '  width: 8px;',
    '  height: 16px;',
    '  background: var(--color-sage, #5a7d5c);',
    '  margin-left: 2px;',
    '  animation: tutorBlink 0.8s infinite;',
    '  vertical-align: middle;',
    '}',
    '@keyframes tutorBlink {',
    '  0%, 50% { opacity: 1; }',
    '  51%, 100% { opacity: 0; }',
    '}',

    /* 快捷问题 */
    '.tutor-quick {',
    '  display: flex;',
    '  gap: 8px;',
    '  flex-wrap: wrap;',
    '  padding: 8px 0;',
    '  flex-shrink: 0;',
    '}',
    '.tutor-quick-btn {',
    '  padding: 6px 14px;',
    '  border-radius: 16px;',
    '  background: var(--surface-primary, #fff);',
    '  border: 1px solid var(--border-light, #ece8e1);',
    '  font-size: 0.78rem;',
    '  color: var(--text-secondary, #4a4a4a);',
    '  cursor: pointer;',
    '  transition: all 0.15s;',
    '}',
    '.tutor-quick-btn:active {',
    '  transform: scale(0.96);',
    '  background: var(--color-sage, #5a7d5c);',
    '  color: #fff;',
    '}',

    /* 输入区 */
    '.tutor-input-bar {',
    '  display: flex;',
    '  gap: 10px;',
    '  padding: 10px 0;',
    '  flex-shrink: 0;',
    '  border-top: 1px solid var(--border-light, #ece8e1);',
    '}',
    '.tutor-input {',
    '  flex: 1;',
    '  padding: 12px 16px;',
    '  border: 1.5px solid var(--border-default, #e0dcd5);',
    '  border-radius: 22px;',
    '  background: var(--surface-primary, #fff);',
    '  color: var(--text-primary, #1a1a1a);',
    '  font-size: 0.9rem;',
    '  outline: none;',
    '  resize: none;',
    '  max-height: 100px;',
    '  min-height: 44px;',
    '  font-family: inherit;',
    '  line-height: 1.5;',
    '  transition: border-color 0.2s;',
    '}',
    '.tutor-input:focus {',
    '  border-color: var(--color-sage, #5a7d5c);',
    '}',
    '.tutor-send {',
    '  width: 44px;',
    '  height: 44px;',
    '  border: none;',
    '  border-radius: 50%;',
    '  background: var(--color-sage, #5a7d5c);',
    '  color: #fff;',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  flex-shrink: 0;',
    '  transition: all 0.15s;',
    '}',
    '.tutor-send:active {',
    '  transform: scale(0.92);',
    '}',
    '.tutor-send:disabled {',
    '  background: var(--border-light, #ece8e1);',
    '  cursor: not-allowed;',
    '}',

    /* 空状态欢迎 */
    '.tutor-welcome {',
    '  text-align: center;',
    '  padding: 40px 20px;',
    '  color: var(--text-muted, #8a8a8a);',
    '}',
    '.tutor-welcome-icon {',
    '  font-size: 3rem;',
    '  margin-bottom: 12px;',
    '}',
    '.tutor-welcome-title {',
    '  font-family: var(--font-serif, "Noto Serif SC", serif);',
    '  font-size: 1.3rem;',
    '  font-weight: 700;',
    '  color: var(--color-deep, #1a3a2a);',
    '  margin-bottom: 8px;',
    '}',
    '.tutor-welcome-desc {',
    '  font-size: 0.85rem;',
    '  line-height: 1.6;',
    '}',

    /* 响应式 */
    '@media (max-width: 640px) {',
    '  .tutor-page { padding: 12px 12px 90px; }',
    '  .tutor-msg-bubble { font-size: 0.85rem; padding: 10px 14px; }',
    '  .tutor-mode { padding: 6px 12px; font-size: 0.78rem; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);
}

/* 模式配置 */
var TUTOR_MODES = {
  general: { label: '通用导师', avatar: '🎓', greeting: '你好！我是 AI 生物导师，有什么生物学问题尽管问我。' },
  mendel:  { label: '孟德尔',   avatar: '🧑‍🌾', greeting: '你好，我是格雷戈尔·孟德尔。我在修道院花园里种了8年豌豆，想了解遗传定律吗？' },
  darwin:  { label: '达尔文',   avatar: '🧭', greeting: '你好，我是查尔斯·达尔文。乘小猎犬号航行五年，我见证了自然的奇迹。想聊聊进化论吗？' },
  watson:  { label: '沃森',     avatar: '🧬', greeting: '你好，我是詹姆斯·沃森。25岁那年我和克里克发现了DNA双螺旋，想听这段故事吗？' }
};

/* 快捷问题 */
var TUTOR_QUICK_QUESTIONS = [
  '解释减数分裂前期I的同源染色体配对',
  '光合作用光反应和暗反应的区别？',
  'DNA半保留复制是怎么回事？',
  '孟德尔分离定律的实质是什么？',
  '自然选择如何导致物种形成？'
];

/* 动画相关内容已全部移除（用户要求删除所有动画指令） */

/* 简易 Markdown 渲染（安全） */
function _tutorMarkdown(text) {
  // 先提取 SVG 代码块（```svg ... ``` 或行内 <svg>...</svg>），避免被转义
  var svgBlocks = [];
  function stashSvg(svg) {
    // 过滤 script 标签，防止 XSS
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
    var idx = svgBlocks.length;
    svgBlocks.push(svg);
    return '\u0000SVG' + idx + '\u0000';
  }
  text = text.replace(/```(?:svg|xml)\s+([\s\S]*?)```/gi, function(m, code) {
    if (/<svg[\s>]/i.test(code)) return stashSvg(code.trim());
    return m;
  });
  text = text.replace(/(<svg[\s\S]*?<\/svg>)/gi, function(m) {
    return stashSvg(m);
  });

  var html = escapeHtml(text);
  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 加粗
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 换行
  html = html.replace(/\n/g, '</p><p>');
  // 还原 SVG 图表（以文字为主，SVG 作为辅助可视化）
  html = html.replace(/\u0000SVG(\d+)\u0000/g, function(m, i) {
    return '<div class="tutor-svg-box">' + svgBlocks[+i] + '</div>';
  });
  return '<p>' + html + '</p>';
}

/* 清理回复中的 [[ANIM:xxx]] 标记（动画功能已移除，仅做清理） */
function _stripAnim(text) {
  return text.replace(/\[\[ANIM:\w+\]\]/g, '').trim();
}

/* 状态 */
var _tutorState = {
  messages: [],
  currentMode: 'general',
  isStreaming: false,
  abortController: null
};

/**
 * 渲染消息列表
 */
function _renderTutorMessages(container) {
  container.innerHTML = '';
  if (_tutorState.messages.length === 0) {
    var mode = TUTOR_MODES[_tutorState.currentMode];
    container.innerHTML = '<div class="tutor-welcome">' +
      '<div class="tutor-welcome-icon">' + mode.avatar + '</div>' +
      '<div class="tutor-welcome-title">' + mode.label + '</div>' +
      '<div class="tutor-welcome-desc">' + mode.greeting + '</div>' +
      '</div>';
    return;
  }
  _tutorState.messages.forEach(function(msg) {
    var msgEl = document.createElement('div');
    msgEl.className = 'tutor-msg tutor-msg--' + msg.role;
    var avatar = msg.role === 'user' ? '我' : (TUTOR_MODES[_tutorState.currentMode] || {}).avatar || '🎓';
    msgEl.innerHTML = '<div class="tutor-msg-avatar">' + avatar + '</div>' +
      '<div class="tutor-msg-bubble" id="msg-' + msg.id + '">' +
      (msg.role === 'user' ? escapeHtml(msg.content) : _tutorMarkdown(msg.content)) + '</div>';
    container.appendChild(msgEl);
  });
  container.scrollTop = container.scrollHeight;
}

/**
 * 发送消息（SSE 流式）
 */
function _sendTutorMessage(text) {
  if (_tutorState.isStreaming || !text.trim()) return;

  var userMsg = { id: 'msg_' + Date.now(), role: 'user', content: text.trim() };
  _tutorState.messages.push(userMsg);

  var aiMsg = { id: 'msg_' + Date.now() + '_ai', role: 'ai', content: '', anim: null };
  _tutorState.messages.push(aiMsg);

  _tutorState.isStreaming = true;
  var messagesEl = document.getElementById('tutor-messages');
  _renderTutorMessages(messagesEl);

  // 更新输入框
  var input = document.getElementById('tutor-input');
  input.value = '';
  input.style.height = 'auto';
  var sendBtn = document.getElementById('tutor-send');
  sendBtn.disabled = true;

  // 构建历史（不含当前 AI 空消息）
  var history = _tutorState.messages.slice(0, -1).map(function(m) {
    return { role: m.role === 'user' ? 'user' : 'assistant', content: m.content };
  });

  // SSE 流式请求
  _tutorState.abortController = new AbortController();

  // 检查每日用量上限
  var aiCheck = (typeof window.AiClient === 'function') ? window.AiClient.canUse() : { ok: true, useBackend: true };
  if (!aiCheck.ok) {
    _finishTutorStream(aiMsg, aiCheck.reason || '今日 AI 调用已达上限，请明日再试或在「我的 → 设置」中配置自定义 API Key。');
    return;
  }

  // 构造 messages（系统提示 + 历史 + 当前消息）
  var sysPrompt = (typeof TUTOR_SYSTEM_PROMPTS !== 'undefined')
    ? (TUTOR_SYSTEM_PROMPTS[_tutorState.currentMode] || TUTOR_SYSTEM_PROMPTS.general)
    : '你是一位生物学导师，请耐心解答学生的生物学问题。';
  sysPrompt += ' 不要输出 [[ANIM:xxx]] 标记，不要生成 SVG 代码块，用文字说明即可。';
  var aiMessages = [{ role: 'system', content: sysPrompt }];
  for (var i = 0; i < history.length; i++) {
    var h = history[i];
    if (h.role && h.content) aiMessages.push({ role: h.role, content: h.content });
  }
  aiMessages.push({ role: 'user', content: userMsg.content });

  var fullText = '';
  // 节流渲染：流式期间用 textContent 增量追加（O(1)）
  var pendingRender = false;
  var lastRenderedLen = 0;
  function scheduleRender() {
    if (pendingRender) return;
    pendingRender = true;
    setTimeout(function() {
      pendingRender = false;
      var bubble = document.getElementById('msg-' + aiMsg.id);
      if (!bubble) {
        _tutorState.isStreaming = false;
        aiMsg.content = _stripAnim(fullText);
        return;
      }
      var newText = fullText.slice(lastRenderedLen);
      lastRenderedLen = fullText.length;
      // 流式期间也过滤掉 [[ANIM:xxx]] 标记，避免原始指令闪现给用户
      newText = newText.replace(/\[\[ANIM:\w+\]\]/g, '');
      var span = document.createElement('span');
      span.className = 'tutor-streaming-text';
      span.textContent = newText;
      var oldCursor = bubble.querySelector('.tutor-typing');
      if (oldCursor) oldCursor.remove();
      bubble.appendChild(span);
      var cursor = document.createElement('span');
      cursor.className = 'tutor-typing';
      bubble.appendChild(cursor);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 60);
  }

  // 使用 AiClient 直连（有自定义 Key 走前端 fetch，无 Key 回退到后端 /chat）
  window.AiClient.streamChat({
    messages: aiMessages,
    temperature: 0.7,
    maxTokens: 2048,
    signal: _tutorState.abortController.signal,
    onChunk: function (chunk) {
      fullText += chunk;
      scheduleRender();
    },
    onDone: function () {
      _finishTutorStream(aiMsg, fullText);
    },
    onError: function (err) {
      _finishTutorStream(aiMsg, '[ERROR] ' + (err.message || err));
    }
  });
}

function _finishTutorStream(aiMsg, fullText) {
  aiMsg.content = _stripAnim(fullText);
  _tutorState.isStreaming = false;

  var sendBtn = document.getElementById('tutor-send');
  if (sendBtn) sendBtn.disabled = false;

  var messagesEl = document.getElementById('tutor-messages');
  // 流式结束后做一次完整的 Markdown 渲染
  _renderTutorMessages(messagesEl);
  // 清理流式期间的临时 span
  var bubble = document.getElementById('msg-' + aiMsg.id);
  if (bubble) {
    var tmpSpans = bubble.querySelectorAll('.tutor-streaming-text, .tutor-typing');
    tmpSpans.forEach(function(s) { s.remove(); });
  }
}

/**
 * 切换模式
 */
function _switchTutorMode(mode) {
  if (_tutorState.isStreaming) {
    if (_tutorState.abortController) _tutorState.abortController.abort();
    _tutorState.isStreaming = false;
  }
  _tutorState.currentMode = mode;
  _tutorState.messages = []; // 切换模式清空对话

  // 更新模式 UI
  var modes = document.querySelectorAll('.tutor-mode');
  modes.forEach(function(el) {
    el.classList.toggle('active', el.dataset.mode === mode);
  });

  var messagesEl = document.getElementById('tutor-messages');
  if (messagesEl) _renderTutorMessages(messagesEl);
}

/**
 * 主渲染函数
 */
function renderTutorPage(target) {
  injectTutorStyles();

  var html = '<div class="tutor-page">';

  // 模式切换器
  html += '<div class="tutor-modes">';
  Object.keys(TUTOR_MODES).forEach(function(key) {
    var m = TUTOR_MODES[key];
    html += '<div class="tutor-mode' + (key === _tutorState.currentMode ? ' active' : '') + '" data-mode="' + key + '">' +
      '<span class="tutor-mode-avatar">' + m.avatar + '</span>' + m.label + '</div>';
  });
  html += '</div>';

  // 消息区
  html += '<div class="tutor-messages" id="tutor-messages"></div>';

  // 快捷问题（仅首次显示）
  if (_tutorState.messages.length === 0) {
    html += '<div class="tutor-quick" id="tutor-quick">';
    TUTOR_QUICK_QUESTIONS.forEach(function(q) {
      html += '<button class="tutor-quick-btn" data-q="' + escapeHtml(q) + '">' + escapeHtml(q) + '</button>';
    });
    html += '</div>';
  }

  // 输入区
  html += '<div class="tutor-input-bar">' +
    '<textarea class="tutor-input" id="tutor-input" placeholder="问问关于生物学的问题..." rows="1"></textarea>' +
    '<button class="tutor-export" id="tutor-export" title="导出聊天记录" style="background:none;border:none;color:var(--text-muted,#8a8a8a);padding:6px;cursor:pointer;flex-shrink:0;">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
    '</button>' +
    '<button class="tutor-send" id="tutor-send" title="发送">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
    '</button></div>';

  html += '</div>';

  target.innerHTML = html;

  // 渲染消息
  var messagesEl = document.getElementById('tutor-messages');
  _renderTutorMessages(messagesEl);

  // 绑定事件
  // 模式切换
  document.querySelectorAll('.tutor-mode').forEach(function(el) {
    el.addEventListener('click', function() {
      _switchTutorMode(el.dataset.mode);
    });
  });

  // 快捷问题
  document.querySelectorAll('.tutor-quick-btn').forEach(function(el) {
    el.addEventListener('click', function() {
      var input = document.getElementById('tutor-input');
      input.value = el.dataset.q;
      _sendTutorMessage(input.value);
      var quick = document.getElementById('tutor-quick');
      if (quick) quick.remove();
    });
  });

  // 发送按钮
  var sendBtn = document.getElementById('tutor-send');
  sendBtn.addEventListener('click', function() {
    var input = document.getElementById('tutor-input');
    _sendTutorMessage(input.value);
    var quick = document.getElementById('tutor-quick');
    if (quick) quick.remove();
  });

  // 输入框
  var input = document.getElementById('tutor-input');
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _sendTutorMessage(input.value);
      var quick = document.getElementById('tutor-quick');
      if (quick) quick.remove();
    }
  });
  // 自适应高度
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // 导出聊天记录为 Markdown
  var exportBtn = document.getElementById('tutor-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      if (_tutorState.messages.length === 0) return;
      var mode = TUTOR_MODES[_tutorState.currentMode];
      var md = '# BioQuest AI 导师对话记录\n\n';
      md += '- **模式**：' + mode.label + '\n';
      md += '- **时间**：' + new Date().toLocaleString('zh-CN') + '\n';
      md += '- **消息数**：' + _tutorState.messages.length + '\n\n';
      md += '---\n\n';
      _tutorState.messages.forEach(function(msg) {
        var role = msg.role === 'user' ? '🧑 我' : mode.avatar + ' ' + mode.label;
        md += '## ' + role + '\n\n';
        md += msg.content + '\n\n';
      });
      var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'bioquest-tutor-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

/**
 * 模块入口
 */
function initTutor(target) {
  if (!target) target = document.getElementById('page-content');
  if (!target) return;
  renderTutorPage(target);
}

window.initTutor = initTutor;
window.renderTutorPage = renderTutorPage;
