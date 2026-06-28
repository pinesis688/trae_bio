/**
 * ============================================================
 * BioQuest — 社区模块
 * 提供帖子发布、评论、点赞、标签筛选等功能
 * ============================================================
 */

(function () {
  'use strict';

  // 先暴露一个安全的 initCommunity，防止 IIFE 内部任何错误导致函数未定义
  function _initCommunitySafe(target) {
    if (!target) {
      if (typeof AppState !== 'undefined' && AppState.rootElement) {
        target = AppState.rootElement;
      } else {
        target = document.getElementById('page-content');
      }
    }
    if (target) {
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
        '<p style="color:var(--color-error);font-size:1.1rem;margin-bottom:8px;">社区模块加载失败</p>' +
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">请刷新页面或稍后重试</p>' +
        '<button onclick="location.reload()" style="padding:8px 20px;background:var(--color-sage);color:#fff;border:none;border-radius:8px;cursor:pointer;">刷新页面</button>' +
        '</div>';
    }
  }
  window.initCommunity = _initCommunitySafe;

  // ===== 状态管理 =====
  var _communityState = {
    posts: [],
    currentPage: 1,
    currentTag: '',
    hasMore: true,
    loading: false,
    expandedPostId: null,
    commentsCache: {}
  };

  var TAG_LIST = [
    { key: '', label: '全部', color: 'var(--color-sage)' },
    { key: '求助', label: '求助', color: '#e8a830' },
    { key: '经验分享', label: '经验分享', color: '#3a8c5c' },
    { key: '讨论', label: '讨论', color: '#5a7d5c' },
    { key: '笔记', label: '笔记', color: '#c4956a' }
  ];

  // ===== 工具函数 =====

  function _showToast(msg) {
    var existing = document.getElementById('community-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'community-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--color-error);color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;z-index:10000;animation:fadeInUp 0.3s ease;max-width:90%;text-align:center;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  }

  function _showAppealToast(msg, appealId) {
    var existing = document.getElementById('community-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'community-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--color-error);color:#fff;padding:14px 20px;border-radius:12px;font-size:14px;z-index:10000;animation:fadeInUp 0.3s ease;max-width:92%;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;';
    toast.innerHTML = '<div>' + escapeHtml(msg) + '</div>' +
      '<button id="community-appeal-btn" style="background:#fff;color:var(--color-error);border:none;padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:600;cursor:pointer;">我觉得被误判，提交申诉</button>';
    document.body.appendChild(toast);

    var appealBtn = document.getElementById('community-appeal-btn');
    if (appealBtn) {
      appealBtn.addEventListener('click', async function() {
        var note = prompt('请说明为什么你认为这条内容没有违规（可选）：');
        if (note === null) return;
        var updateFn = (typeof window.updateCRAppeal === 'function') ? window.updateCRAppeal : (typeof updateCRAppeal === 'function' ? updateCRAppeal : null);
        if (!updateFn || !appealId) {
          _showToast('申诉功能暂不可用');
          return;
        }
        var result = await updateFn(appealId, note);
        if (result && result.ok) {
          _showToast('申诉已提交，管理员复核后将恢复信用分');
        } else {
          _showToast('申诉提交失败：' + (result && result.error ? result.error : '未知错误'));
        }
      });
    }
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 8000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMarkdown(text) {
    if (!text) return '';
    var html = escapeHtml(text);
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_ (but not inside words like some_text)
    html = html.replace(/\B\*(.+?)\*\B/g, '<em>$1</em>');
    html = html.replace(/\B_(.+?)_\B/g, '<em>$1</em>');
    // Code: `text`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Images: ![alt](src) — must be before links
    // 懒加载策略：不直接加载图片，显示占位符，点击后加载（避免社区进入时大量图片请求导致卡顿）
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, function (match, alt, src) {
      var safeSrc = src.trim();
      if (/^\s*(javascript|vbscript)\s*:/i.test(safeSrc)) return alt;
      var safeAlt = escapeHtml(alt);
      var dataUri = safeSrc.indexOf('data:') === 0;
      // data: 直接渲染（本地上传的小图），http(s) 走点击加载
      if (dataUri) {
        return '<img src="' + safeSrc + '" alt="' + safeAlt + '" style="max-width:100%;border-radius:8px;margin:8px 0;cursor:pointer;" loading="lazy">';
      }
      return '<div class="community-img-placeholder" data-src="' + safeSrc + '" data-alt="' + safeAlt + '" ' +
        'style="display:flex;align-items:center;justify-content:center;gap:8px;padding:24px;margin:8px 0;border:1px dashed var(--border-light,#ddd);border-radius:8px;cursor:pointer;color:var(--text-muted,#8a8a8a);font-size:0.85rem;background:var(--color-cream-dark,#f9fafb);transition:all 0.2s;" ' +
        'onmouseover="this.style.borderColor=\'var(--color-sage,#5a7d5c)\';this.style.color=\'var(--color-sage,#5a7d5c)\'" ' +
        'onmouseout="this.style.borderColor=\'var(--border-light,#ddd)\';this.style.color=\'var(--text-muted,#8a8a8a)\'" ' +
        'onclick="this.outerHTML=\'<img src=\\\'' + safeSrc + '\\\' alt=\\\'' + safeAlt + '\\\' style=\\\'max-width:100%;border-radius:8px;margin:8px 0;\\\' loading=\\\'lazy\\\'>\'">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
        '<span>点击加载图片</span></div>';
    });
    // Links: [text](url) — 过滤 javascript: 等危险协议防 XSS
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, function (match, text, url) {
      var trimmed = url.trim();
      if (/^\s*(javascript|data|vbscript)\s*:/i.test(trimmed)) {
        return text; // 移除危险链接，仅保留文本
      }
      return '<a href="' + trimmed + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
    });
    // Headers: # text (must be at start of line)
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    // Lists: - item or * item
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Blockquotes: > text
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Clean up <br> inside block elements
    html = html.replace(/<h([234])><br>/g, '<h$1>');
    html = html.replace(/<\/h([234])><br>/g, '</h$1>');
    html = html.replace(/<ul><br>/g, '<ul>');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    html = html.replace(/<li><br>/g, '<li>');
    html = html.replace(/<blockquote><br>/g, '<blockquote>');
    html = html.replace(/<\/blockquote><br>/g, '</blockquote>');
    return html;
  }

  function relativeTime(dateStr) {
    if (!dateStr) return '';
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    if (isNaN(then)) return dateStr;
    var diff = Math.max(0, now - then);
    var seconds = Math.floor(diff / 1000);
    if (seconds < 60) return '刚刚';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + '分钟前';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + '小时前';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + '天前';
    var months = Math.floor(days / 30);
    if (months < 12) return months + '个月前';
    return Math.floor(months / 12) + '年前';
  }

  function getAvatarColor(name) {
    var colors = ['#3a8c5c', '#5a7d5c', '#c4956a', '#e8a830', '#2d5a3f', '#8ba888', '#c0553a', '#d4a574'];
    var hash = 0;
    for (var i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitial(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  function isUserLoggedIn() {
    return typeof isLoggedIn === 'function' && isLoggedIn();
  }

  function getCurrentUserInfo() {
    if (typeof getCurrentUser === 'function') {
      var user = getCurrentUser();
      if (user) return { username: user.username || '', display_name: user.display_name || user.username || '' };
    }
    return { username: '', display_name: '' };
  }

  // ===== 样式注入 =====

  function injectCommunityStyles() {
    var styleId = 'community-styles';
    if (document.getElementById(styleId)) return;

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = '\
      /* ===== 社区页面 ===== */\
      .community-page {\
        max-width: 720px;\
        margin: 0 auto;\
        padding: 32px 20px 60px;\
      }\
\
      .community-header {\
        display: flex;\
        align-items: center;\
        justify-content: space-between;\
        margin-bottom: 24px;\
      }\
\
      .community-title {\
        font-family: var(--font-serif, "Noto Serif SC", serif);\
        font-size: 1.75rem;\
        font-weight: 700;\
        color: var(--text-primary);\
        margin: 0;\
      }\
\
      .community-post-btn {\
        background: var(--color-sage);\
        color: #fff;\
        border: none;\
        padding: 10px 24px;\
        border-radius: var(--radius-full);\
        font-size: 0.9rem;\
        font-weight: 500;\
        cursor: pointer;\
        transition: all 0.2s ease;\
      }\
\
      .community-post-btn:hover {\
        transform: translateY(-1px);\
        box-shadow: 0 4px 12px rgba(90, 125, 92, 0.3);\
      }\
\
      .community-login-banner {\
        background: var(--surface-secondary);\
        border: 1px solid var(--border-light);\
        border-radius: var(--radius-md);\
        padding: 16px 20px;\
        margin-bottom: 20px;\
        display: flex;\
        align-items: center;\
        justify-content: space-between;\
        gap: 12px;\
      }\
\
      .community-login-banner-text {\
        font-size: 0.88rem;\
        color: var(--text-secondary);\
      }\
\
      .community-login-banner-btn {\
        background: var(--color-sage);\
        color: #fff;\
        border: none;\
        padding: 8px 20px;\
        border-radius: var(--radius-full);\
        font-size: 0.82rem;\
        font-weight: 500;\
        cursor: pointer;\
        white-space: nowrap;\
        transition: all 0.2s ease;\
      }\
\
      .community-login-banner-btn:hover {\
        box-shadow: 0 2px 8px rgba(90, 125, 92, 0.3);\
      }\
\
      .community-tags {\
        display: flex;\
        gap: 8px;\
        margin-bottom: 24px;\
        overflow-x: auto;\
        padding-bottom: 4px;\
        -webkit-overflow-scrolling: touch;\
      }\
\
      .community-tags::-webkit-scrollbar {\
        display: none;\
      }\
\
      .community-tag-chip {\
        padding: 6px 16px;\
        border-radius: var(--radius-full);\
        font-size: 0.82rem;\
        font-weight: 500;\
        cursor: pointer;\
        border: 1.5px solid var(--border-default);\
        background: var(--surface-primary);\
        color: var(--text-secondary);\
        transition: all 0.2s ease;\
        white-space: nowrap;\
        user-select: none;\
      }\
\
      .community-tag-chip:hover {\
        border-color: var(--color-sage);\
        color: var(--color-sage);\
      }\
\
      .community-tag-chip.active {\
        background: var(--color-sage);\
        color: #fff;\
        border-color: var(--color-sage);\
      }\
\
      .community-feed {\
        display: flex;\
        flex-direction: column;\
        gap: 16px;\
      }\
\
      .community-post-card {\
        background: var(--surface-primary);\
        border: 1px solid var(--border-light);\
        border-radius: var(--radius-md);\
        padding: 20px;\
        transition: all 0.2s ease;\
      }\
\
      .community-post-card:hover {\
        box-shadow: var(--shadow-md);\
        border-color: var(--border-default);\
      }\
\
      .community-post-header {\
        display: flex;\
        align-items: center;\
        gap: 12px;\
        margin-bottom: 12px;\
      }\
\
      .community-avatar {\
        width: 36px;\
        height: 36px;\
        border-radius: 50%;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        color: #fff;\
        font-size: 0.85rem;\
        font-weight: 600;\
        flex-shrink: 0;\
      }\
\
      .community-post-author {\
        font-size: 0.88rem;\
        font-weight: 600;\
        color: var(--text-primary);\
      }\
\
      .community-post-time {\
        font-size: 0.78rem;\
        color: var(--text-muted);\
        margin-left: auto;\
        white-space: nowrap;\
      }\
\
      .community-post-content {\
        font-size: 0.92rem;\
        line-height: 1.7;\
        color: var(--text-primary);\
        margin-bottom: 12px;\
        word-break: break-word;\
      }\
\
      .community-post-tags {\
        display: flex;\
        gap: 6px;\
        flex-wrap: wrap;\
        margin-bottom: 12px;\
      }\
\
      .community-post-tag {\
        font-size: 0.75rem;\
        padding: 2px 10px;\
        border-radius: var(--radius-full);\
        background: rgba(90, 125, 92, 0.1);\
        color: var(--color-sage);\
      }\
\
      .community-post-actions {\
        display: flex;\
        gap: 20px;\
        align-items: center;\
      }\
\
      .community-action-btn {\
        display: flex;\
        align-items: center;\
        gap: 5px;\
        background: none;\
        border: none;\
        color: var(--text-muted);\
        font-size: 0.82rem;\
        cursor: pointer;\
        padding: 4px 0;\
        transition: color 0.15s ease;\
      }\
\
      .community-action-btn:hover {\
        color: var(--color-sage);\
      }\
\
      .community-action-btn.liked {\
        color: #e8a830;\
      }\
\
      .community-action-btn svg {\
        width: 16px;\
        height: 16px;\
      }\
\
      /* 评论区域 */\
      .community-comments-section {\
        margin-top: 16px;\
        padding-top: 16px;\
        border-top: 1px solid var(--border-light);\
        animation: communitySlideDown 0.25s ease;\
      }\
\
      @keyframes communitySlideDown {\
        from { opacity: 0; max-height: 0; }\
        to { opacity: 1; max-height: 1000px; }\
      }\
\
      .community-comment {\
        display: flex;\
        gap: 10px;\
        margin-bottom: 12px;\
      }\
\
      .community-comment-avatar {\
        width: 28px;\
        height: 28px;\
        border-radius: 50%;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        color: #fff;\
        font-size: 0.7rem;\
        font-weight: 600;\
        flex-shrink: 0;\
      }\
\
      .community-comment-body {\
        flex: 1;\
        min-width: 0;\
      }\
\
      .community-comment-author {\
        font-size: 0.82rem;\
        font-weight: 600;\
        color: var(--text-primary);\
      }\
\
      .community-comment-text {\
        font-size: 0.85rem;\
        color: var(--text-secondary);\
        line-height: 1.5;\
        word-break: break-word;\
      }\
\
      .community-comment-time {\
        font-size: 0.72rem;\
        color: var(--text-muted);\
        margin-top: 2px;\
      }\
\
      .community-comment-input-area {\
        display: flex;\
        gap: 8px;\
        margin-top: 12px;\
      }\
\
      .community-comment-input {\
        flex: 1;\
        padding: 8px 14px;\
        border: 1.5px solid var(--border-default);\
        border-radius: var(--radius-full);\
        font-size: 0.85rem;\
        background: var(--surface-primary);\
        color: var(--text-primary);\
        outline: none;\
        transition: border-color 0.2s ease;\
      }\
\
      .community-comment-input:focus {\
        border-color: var(--color-sage);\
      }\
\
      .community-comment-submit {\
        background: var(--color-sage);\
        color: #fff;\
        border: none;\
        padding: 8px 16px;\
        border-radius: var(--radius-full);\
        font-size: 0.82rem;\
        font-weight: 500;\
        cursor: pointer;\
        transition: all 0.2s ease;\
        white-space: nowrap;\
      }\
\
      .community-comment-submit:hover {\
        box-shadow: 0 2px 8px rgba(90, 125, 92, 0.3);\
      }\
\
      /* 发帖弹窗 */\
      .community-compose-overlay {\
        position: fixed;\
        inset: 0;\
        z-index: 10000;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        background: rgba(5, 10, 7, 0.5);\
        backdrop-filter: blur(8px);\
        animation: communityFadeIn 0.2s ease;\
      }\
\
      .community-compose-overlay.closing {\
        animation: communityFadeOut 0.15s ease forwards;\
      }\
\
      @keyframes communityFadeIn {\
        from { opacity: 0; }\
        to { opacity: 1; }\
      }\
\
      @keyframes communityFadeOut {\
        from { opacity: 1; }\
        to { opacity: 0; }\
      }\
\
      .community-compose-modal {\
        width: 90vw;\
        max-width: 520px;\
        background: var(--surface-primary);\
        border-radius: var(--radius-lg);\
        padding: 28px 24px 20px;\
        box-shadow: var(--shadow-lg);\
        animation: communitySlideUp 0.25s ease;\
      }\
\
      @keyframes communitySlideUp {\
        from { opacity: 0; transform: translateY(16px); }\
        to { opacity: 1; transform: translateY(0); }\
      }\
\
      .community-compose-header {\
        display: flex;\
        align-items: center;\
        justify-content: space-between;\
        margin-bottom: 16px;\
      }\
\
      .community-compose-title {\
        font-size: 1.1rem;\
        font-weight: 600;\
        color: var(--text-primary);\
      }\
\
      .community-compose-close {\
        width: 32px;\
        height: 32px;\
        border: none;\
        background: transparent;\
        color: var(--text-muted);\
        font-size: 1.3rem;\
        cursor: pointer;\
        border-radius: 50%;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        transition: all 0.15s ease;\
      }\
\
      .community-compose-close:hover {\
        background: var(--surface-tertiary);\
        color: var(--text-primary);\
      }\
\
      .community-compose-textarea {\
        width: 100%;\
        min-height: 120px;\
        padding: 12px 14px;\
        border: 1.5px solid var(--border-default);\
        border-radius: var(--radius-md);\
        font-size: 0.92rem;\
        line-height: 1.6;\
        resize: vertical;\
        background: var(--surface-primary);\
        color: var(--text-primary);\
        outline: none;\
        transition: border-color 0.2s ease;\
        font-family: var(--font-sans);\
      }\
\
      .community-compose-textarea:focus {\
        border-color: var(--color-sage);\
      }\
\
      .community-compose-tags {\
        display: flex;\
        gap: 8px;\
        flex-wrap: wrap;\
        margin: 14px 0;\
      }\
\
      .community-compose-tag {\
        padding: 5px 14px;\
        border-radius: var(--radius-full);\
        font-size: 0.8rem;\
        cursor: pointer;\
        border: 1.5px solid var(--border-default);\
        background: var(--surface-primary);\
        color: var(--text-secondary);\
        transition: all 0.2s ease;\
        user-select: none;\
      }\
\
      .community-compose-tag:hover {\
        border-color: var(--color-sage);\
      }\
\
      .community-compose-tag.selected {\
        background: var(--color-sage);\
        color: #fff;\
        border-color: var(--color-sage);\
      }\
\
      .community-compose-footer {\
        display: flex;\
        justify-content: flex-end;\
        margin-top: 16px;\
      }\
\
      .community-compose-submit {\
        background: var(--color-sage);\
        color: #fff;\
        border: none;\
        padding: 10px 28px;\
        border-radius: var(--radius-full);\
        font-size: 0.9rem;\
        font-weight: 500;\
        cursor: pointer;\
        transition: all 0.2s ease;\
      }\
\
      .community-compose-submit:hover {\
        box-shadow: 0 4px 12px rgba(90, 125, 92, 0.3);\
        transform: translateY(-1px);\
      }\
\
      .community-compose-submit:disabled {\
        opacity: 0.5;\
        cursor: not-allowed;\
        transform: none;\
        box-shadow: none;\
      }\
\
      /* 骨架屏 */\
      .community-skeleton {\
        background: var(--surface-primary);\
        border: 1px solid var(--border-light);\
        border-radius: var(--radius-md);\
        padding: 20px;\
        animation: communityPulse 1.5s ease-in-out infinite;\
      }\
\
      @keyframes communityPulse {\
        0%, 100% { opacity: 1; }\
        50% { opacity: 0.5; }\
      }\
\
      .community-skeleton-line {\
        height: 12px;\
        background: var(--surface-tertiary);\
        border-radius: 6px;\
        margin-bottom: 10px;\
      }\
\
      .community-skeleton-line:last-child {\
        width: 60%;\
        margin-bottom: 0;\
      }\
\
      .community-skeleton-avatar {\
        width: 36px;\
        height: 36px;\
        border-radius: 50%;\
        background: var(--surface-tertiary);\
        margin-bottom: 12px;\
      }\
\
      /* 空状态 */\
      .community-empty {\
        text-align: center;\
        padding: 60px 20px;\
      }\
\
      .community-empty-icon {\
        font-size: 48px;\
        margin-bottom: 16px;\
        opacity: 0.3;\
      }\
\
      .community-empty-title {\
        font-size: 1.1rem;\
        font-weight: 600;\
        color: var(--text-primary);\
        margin-bottom: 8px;\
      }\
\
      .community-empty-desc {\
        font-size: 0.88rem;\
        color: var(--text-muted);\
        line-height: 1.6;\
      }\
\
      /* 加载更多 */\
      .community-load-more {\
        text-align: center;\
        padding: 20px 0;\
      }\
\
      .community-load-more-btn {\
        background: var(--surface-secondary);\
        border: 1px solid var(--border-light);\
        color: var(--text-secondary);\
        padding: 10px 32px;\
        border-radius: var(--radius-full);\
        font-size: 0.85rem;\
        cursor: pointer;\
        transition: all 0.2s ease;\
      }\
\
      .community-load-more-btn:hover {\
        border-color: var(--color-sage);\
        color: var(--color-sage);\
      }\
\
      /* Markdown rendered content */\
      .community-post-content h2, .community-post-content h3, .community-post-content h4 { margin: 12px 0 6px; font-weight: 600; }\
      .community-post-content h2 { font-size: 1.2em; }\
      .community-post-content h3 { font-size: 1.1em; }\
      .community-post-content h4 { font-size: 1em; }\
      .community-post-content code { background: rgba(90,125,92,0.1); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9em; }\
      .community-post-content blockquote { border-left: 3px solid var(--color-sage); padding-left: 12px; margin: 8px 0; color: var(--text-secondary); }\
      .community-post-content ul { padding-left: 20px; margin: 8px 0; }\
      .community-post-content li { margin: 4px 0; }\
      .community-post-content a { color: var(--color-sage); text-decoration: underline; }\
      .community-post-content img { max-width: 100%; border-radius: 8px; margin: 8px 0; }\
      .community-comment-text code { background: rgba(90,125,92,0.1); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9em; }\
      .community-comment-text blockquote { border-left: 3px solid var(--color-sage); padding-left: 12px; margin: 8px 0; color: var(--text-secondary); }\
      .community-comment-text a { color: var(--color-sage); text-decoration: underline; }\
      .community-comment-text img { max-width: 100%; border-radius: 8px; margin: 8px 0; }\
      /* Image upload button */\
      .community-compose-toolbar {\
        display: flex;\
        align-items: center;\
        gap: 8px;\
        margin-bottom: 8px;\
      }\
      .community-compose-img-btn {\
        background: none;\
        border: 1.5px solid var(--border-default);\
        border-radius: var(--radius-full);\
        padding: 6px 12px;\
        font-size: 1.1rem;\
        cursor: pointer;\
        transition: all 0.2s ease;\
        line-height: 1;\
      }\
      .community-compose-img-btn:hover {\
        border-color: var(--color-sage);\
        background: rgba(90,125,92,0.05);\
      }\
\
      /* 响应式 */\
      @media (max-width: 640px) {\
        .community-page {\
          padding: 24px 16px 48px;\
        }\
\
        .community-title {\
          font-size: 1.4rem;\
        }\
\
        .community-post-card {\
          padding: 16px;\
        }\
\
        .community-comment-input-area {\
          flex-wrap: wrap;\
        }\
\
        .community-comment-submit {\
          width: 100%;\
          text-align: center;\
        }\
      }\
    ';
    document.head.appendChild(style);
  }

  // ===== 示例数据（后端不可用时使用） =====

  var _SAMPLE_POSTS = [
    {
      id: 'sample-1',
      author: { display_name: '生物竞赛达人', username: 'bio_master' },
      content: '分享一下我的**细胞呼吸**学习笔记：有氧呼吸分为三个阶段，糖酵解、柠檬酸循环和氧化磷酸化。其中**ATP产量最多**的是第三阶段，通过电子传递链产生大量ATP。建议配合代谢图一起记忆！',
      tags: ['经验分享', '笔记'],
      likes: 42,
      comment_count: 8,
      liked_by_me: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'sample-2',
      author: { display_name: '生竞萌新', username: 'bio_newbie' },
      content: '**求助**：遗传学中的连锁互换率怎么计算？如果两个基因之间的交换率是15%，那么F2代中重组型的比例是多少？求大佬指点！',
      tags: ['求助'],
      likes: 12,
      comment_count: 5,
      liked_by_me: false,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'sample-3',
      author: { display_name: '实验小能手', username: 'lab_lover' },
      content: '关于**光合作用**的光反应和暗反应，我整理了一个对比表：\n\n| | 光反应 | 暗反应 |\n|---|---|---|\n| 场所 | 类囊体薄膜 | 叶绿体基质 |\n| 条件 | 光、色素、酶 | 酶、ATP、[H] |\n| 产物 | O₂、ATP、[H] | 有机物、C₅ |\n\n希望对大家有帮助~',
      tags: ['笔记', '经验分享'],
      likes: 67,
      comment_count: 14,
      liked_by_me: false,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'sample-4',
      author: { display_name: '生态观察者', username: 'eco_watcher' },
      content: '讨论一下种群增长模型：**"S"型曲线**的K值（环境容纳量）在实际生态中如何测定？我们实验室用的是标记重捕法，但误差好像挺大的，大家有什么好方法吗？',
      tags: ['讨论'],
      likes: 23,
      comment_count: 11,
      liked_by_me: false,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  // ===== API 调用 =====

  async function fetchPosts(page, tag) {
    // 使用 Supabase 直连
    if (typeof window.getCommunityPosts === 'function' && typeof window.getSupabase === 'function') {
      var sb = window.getSupabase();
      if (sb) {
        var result = await window.getCommunityPosts(page, tag);
        if (result && result.posts) {
          return result;
        }
        // Supabase 可用但返回空结果
        return { posts: [], has_more: false };
      }
    }
    // Supabase 未配置
    return null;
  }

  async function createPost(content, tags) {
    // 使用 Supabase 直连
    if (typeof window.createCommunityPost === 'function' && typeof window.getSupabase === 'function') {
      var sb = window.getSupabase();
      if (sb) {
        try {
          var result = await window.createCommunityPost(content, tags);
          // 兼容旧版返回布尔值
          var ok = (result && typeof result === 'object') ? result.ok : !!result;
          if (ok) {
            // 触发社区成就 - 查询用户实际发帖数
            if (typeof window.checkAchievement === 'function') {
              try {
                var sb2 = typeof window.getSupabase === 'function' ? window.getSupabase() : null;
                var user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
                if (sb2 && user) {
                  var { count } = await sb2.from('community_posts')
                    .select('id', { count: 'exact', head: true })
                    .eq('author_id', user.id);
                  window.checkAchievement('community', count || 1);
                } else {
                  window.checkAchievement('community', 1);
                }
              } catch (e) {
                window.checkAchievement('community', 1);
              }
            }
            return true;
          }
          // 不文明检测导致的失败，提供申诉入口
          if (result && result.appeal_id) {
            _showAppealToast((result && result.error) ? result.error : '发帖失败，请稍后重试', result.appeal_id);
          } else {
            _showToast((result && result.error) ? result.error : '发帖失败，请稍后重试');
          }
          return false;
        } catch (e) {
          _showToast('发帖出错，请稍后重试');
          return false;
        }
      }
    }
    // Supabase 未配置
    _showToast('Supabase 未配置，无法发帖');
    return false;
  }

  async function toggleLike(postId) {
    // 使用 Supabase 直连
    if (typeof window.togglePostLike === 'function' && typeof window.getSupabase === 'function') {
      var sb = window.getSupabase();
      if (sb) {
        var result = await window.togglePostLike(postId);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  }

  async function fetchComments(postId) {
    // 使用 Supabase 直连
    if (typeof window.getPostComments === 'function' && typeof window.getSupabase === 'function') {
      var sb = window.getSupabase();
      if (sb) {
        var result = await window.getPostComments(postId);
        if (result && result.comments) {
          return result;
        }
        // Supabase 可用但返回空结果
        return { comments: [] };
      }
    }
    return null;
  }

  async function addComment(postId, content) {
    // 使用 Supabase 直连
    if (typeof window.addPostComment === 'function' && typeof window.getSupabase === 'function') {
      var sb = window.getSupabase();
      if (sb) {
        try {
          var result = await window.addPostComment(postId, content);
          // 兼容旧版返回布尔值
          var ok = (result && typeof result === 'object') ? result.ok : !!result;
          if (ok) {
            return true;
          }
          // 不文明检测导致的失败，提供申诉入口
          if (result && result.appeal_id) {
            _showAppealToast((result && result.error) ? result.error : '评论失败，请稍后重试', result.appeal_id);
          } else {
            _showToast((result && result.error) ? result.error : '评论失败，请稍后重试');
          }
          return false;
        } catch (e) {
          _showToast('评论出错，请稍后重试');
          return false;
        }
      }
    }
    // Supabase 未配置
    _showToast('Supabase 未配置，无法评论');
    return false;
  }

  // ===== 渲染函数 =====

  function renderSkeletons(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="community-skeleton">';
      html += '<div class="community-skeleton-avatar"></div>';
      html += '<div class="community-skeleton-line"></div>';
      html += '<div class="community-skeleton-line"></div>';
      html += '<div class="community-skeleton-line"></div>';
      html += '</div>';
    }
    return html;
  }

  function renderTagChips() {
    var html = '';
    for (var i = 0; i < TAG_LIST.length; i++) {
      var tag = TAG_LIST[i];
      var active = _communityState.currentTag === tag.key ? ' active' : '';
      html += '<span class="community-tag-chip' + active + '" data-community-tag="' + escapeHtml(tag.key) + '">' + escapeHtml(tag.label) + '</span>';
    }
    return html;
  }

  function renderPostCard(post) {
    var authorName = post.author ? (post.author.display_name || post.author.username || '匿名用户') : '匿名用户';
    var authorInitial = getInitial(authorName);
    var avatarColor = getAvatarColor(authorName);
    var likedClass = post.liked_by_me ? ' liked' : '';
    var heartFill = post.liked_by_me ? 'currentColor' : 'none';

    var html = '<div class="community-post-card" data-post-id="' + escapeHtml(post.id) + '">';
    html += '<div class="community-post-header">';
    html += '<div class="community-avatar" style="background:' + avatarColor + '">' + escapeHtml(authorInitial) + '</div>';
    html += '<span class="community-post-author">' + escapeHtml(authorName) + '</span>';
    html += '<span class="community-post-time">' + relativeTime(post.created_at) + '</span>';
    html += '</div>';

    html += '<div class="community-post-content">' + renderMarkdown(post.content) + '</div>';

    if (post.tags && post.tags.length > 0) {
      html += '<div class="community-post-tags">';
      for (var i = 0; i < post.tags.length; i++) {
        html += '<span class="community-post-tag">#' + escapeHtml(post.tags[i]) + '</span>';
      }
      html += '</div>';
    }

    html += '<div class="community-post-actions">';
    html += '<button class="community-action-btn community-like-btn' + likedClass + '" data-post-id="' + escapeHtml(post.id) + '">';
    html += '<svg viewBox="0 0 24 24" fill="' + heartFill + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    html += '<span class="community-like-count">' + (post.likes || 0) + '</span>';
    html += '</button>';

    html += '<button class="community-action-btn community-comment-toggle-btn" data-post-id="' + escapeHtml(post.id) + '">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    html += '<span>' + (post.comment_count || 0) + '</span>';
    html += '</button>';
    html += '</div>';

    // 展开的评论区域
    if (_communityState.expandedPostId === post.id) {
      html += renderCommentsSection(post);
    }

    html += '</div>';
    return html;
  }

  function renderCommentsSection(post) {
    var html = '<div class="community-comments-section">';

    var comments = _communityState.commentsCache[post.id] || [];
    if (comments.length > 0) {
      for (var i = 0; i < comments.length; i++) {
        var cmt = comments[i];
        var cmtAuthor = cmt.author ? (cmt.author.display_name || cmt.author.username || '匿名') : '匿名';
        var cmtColor = getAvatarColor(cmtAuthor);
        var cmtInitial = getInitial(cmtAuthor);

        html += '<div class="community-comment">';
        html += '<div class="community-comment-avatar" style="background:' + cmtColor + '">' + escapeHtml(cmtInitial) + '</div>';
        html += '<div class="community-comment-body">';
        html += '<span class="community-comment-author">' + escapeHtml(cmtAuthor) + '</span>';
        html += '<div class="community-comment-text">' + renderMarkdown(cmt.content) + '</div>';
        html += '<div class="community-comment-time">' + relativeTime(cmt.created_at) + '</div>';
        html += '</div>';
        html += '</div>';
      }
    }

    // 评论输入（仅登录用户）
    if (isUserLoggedIn()) {
      html += '<div class="community-comment-input-area">';
      html += '<input type="text" class="community-comment-input" placeholder="写下你的评论..." data-post-id="' + escapeHtml(post.id) + '" />';
      html += '<button class="community-comment-submit" data-post-id="' + escapeHtml(post.id) + '">发送</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderEmptyState() {
    return '<div class="community-empty">' +
      '<div class="community-empty-icon"></div>' +
      '<div class="community-empty-title">还没有帖子</div>' +
      '<div class="community-empty-desc">成为第一个发帖的人，分享你的学习心得吧</div>' +
      '</div>';
  }

  function renderLoginPage() {
    return '<div class="animate-fade-in" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">' +
      '<div style="text-align:center;max-width:400px;padding:40px;">' +
      '<div style="font-size:48px;margin-bottom:16px;opacity:0.3;"></div>' +
      '<h2 style="font-size:22px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">社区需要登录</h2>' +
      '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;">登录后即可参与讨论、发帖和评论</p>' +
      '<button onclick="window.showAuthModal && window.showAuthModal()" style="' +
      'background:var(--color-sage);color:#fff;border:none;padding:12px 32px;border-radius:var(--radius-full);' +
      'font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;' +
      '" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(90,125,92,0.3)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\'">立即登录</button>' +
      '</div></div>';
  }

  // ===== 主渲染函数 =====

  function renderCommunityPage(target) {
    if (!target) return;

    try {
      injectCommunityStyles();

      // 重置状态
      _communityState = {
        posts: [],
        currentPage: 1,
        currentTag: '',
        hasMore: true,
        loading: false,
        expandedPostId: null,
        commentsCache: {}
      };

      var loggedIn = isUserLoggedIn();

      var html = '<div class="community-page">';
      html += '<div class="community-header">';
      html += '<h1 class="community-title">社区</h1>';
      if (loggedIn) {
        html += '<button class="community-post-btn" id="community-compose-btn">发帖</button>';
      }
      html += '</div>';

      // 未登录提示横幅
      if (!loggedIn) {
        html += '<div class="community-login-banner">';
        html += '<span class="community-login-banner-text">登录后参与讨论、发帖和评论</span>';
        html += '<button class="community-login-banner-btn" onclick="window.showAuthModal && window.showAuthModal()">登录</button>';
        html += '</div>';
      }

      // 标签筛选
      html += '<div class="community-tags" id="community-tags">';
      html += renderTagChips();
      html += '</div>';

      // 帖子列表
      html += '<div class="community-feed" id="community-feed">';
      html += renderSkeletons(3);
      html += '</div>';

      // 加载更多
      html += '<div class="community-load-more" id="community-load-more" style="display:none;">';
      html += '<button class="community-load-more-btn" id="community-load-more-btn">加载更多</button>';
      html += '</div>';

      html += '</div>';

      target.innerHTML = html;

      // 绑定事件
      bindCommunityEvents(target);

      // 加载帖子
      loadPosts();
    } catch (err) {
      console.error('[BioQuest Community] renderCommunityPage 异常:', err);
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
        '<p style="color:var(--color-error);font-size:1.1rem;margin-bottom:8px;">社区页面渲染失败</p>' +
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">请刷新页面或稍后重试</p>' +
        '<button onclick="location.reload()" style="padding:8px 20px;background:var(--color-sage);color:#fff;border:none;border-radius:8px;cursor:pointer;">刷新页面</button>' +
        '</div>';
    }
  }

  // ===== 事件绑定 =====

  function bindCommunityEvents(target) {
    // 发帖按钮
    var composeBtn = document.getElementById('community-compose-btn');
    if (composeBtn) {
      composeBtn.addEventListener('click', function () {
        showComposeModal();
      });
    }

    // 标签筛选
    var tagsContainer = document.getElementById('community-tags');
    if (tagsContainer) {
      tagsContainer.addEventListener('click', function (e) {
        var chip = e.target.closest('.community-tag-chip');
        if (!chip) return;
        var tag = chip.getAttribute('data-community-tag') || '';
        _communityState.currentTag = tag;
        _communityState.currentPage = 1;
        _communityState.posts = [];
        _communityState.hasMore = true;
        _communityState.expandedPostId = null;

        // 更新标签高亮
        tagsContainer.querySelectorAll('.community-tag-chip').forEach(function (c) {
          c.classList.toggle('active', c.getAttribute('data-community-tag') === tag);
        });

        loadPosts();
      });
    }

    // 帖子列表事件委托
    var feed = document.getElementById('community-feed');
    if (feed) {
      feed.addEventListener('click', function (e) {
        // 点赞
        var likeBtn = e.target.closest('.community-like-btn');
        if (likeBtn) {
          handleLike(likeBtn);
          return;
        }

        // 评论展开/收起
        var commentBtn = e.target.closest('.community-comment-toggle-btn');
        if (commentBtn) {
          var postId = commentBtn.getAttribute('data-post-id');
          handleToggleComments(postId);
          return;
        }

        // 评论提交
        var submitBtn = e.target.closest('.community-comment-submit');
        if (submitBtn) {
          var postId = submitBtn.getAttribute('data-post-id');
          handleSubmitComment(postId);
          return;
        }
      });

      // 评论输入回车
      feed.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.classList.contains('community-comment-input')) {
          var postId = e.target.getAttribute('data-post-id');
          handleSubmitComment(postId);
        }
      });
    }

    // 加载更多
    var loadMoreBtn = document.getElementById('community-load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        _communityState.currentPage++;
        loadPosts(true);
      });
    }
  }

  // ===== 交互处理 =====

  async function handleLike(btn) {
    if (!isUserLoggedIn()) {
      if (typeof window.showAuthModal === 'function') window.showAuthModal();
      return;
    }

    var postId = btn.getAttribute('data-post-id');
    if (!postId || btn.disabled) return;
    btn.disabled = true;

    try {
      var result = await toggleLike(postId);
      if (result) {
        // 更新帖子状态
        var post = _communityState.posts.find(function (p) { return p.id === postId; });
        if (post) {
          post.liked_by_me = result.liked;
          post.likes = result.likes;
        }

        // 更新 UI
        var countEl = btn.querySelector('.community-like-count');
        if (countEl) countEl.textContent = result.likes || 0;
        btn.classList.toggle('liked', !!result.liked);
        var svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
      } else {
        _showToast('操作失败，请稍后重试');
      }
    } catch (e) {
      _showToast('点赞出错，请稍后重试');
    }

    btn.disabled = false;
  }

  async function handleToggleComments(postId) {
    if (_communityState.expandedPostId === postId) {
      _communityState.expandedPostId = null;
    } else {
      _communityState.expandedPostId = postId;
      // 加载评论
      if (!_communityState.commentsCache[postId]) {
        var result = await fetchComments(postId);
        _communityState.commentsCache[postId] = (result && result.comments) ? result.comments : [];
      }
    }
    refreshFeed();
  }

  async function handleSubmitComment(postId) {
    if (!isUserLoggedIn()) return;

    var input = document.querySelector('.community-comment-input[data-post-id="' + postId + '"]');
    if (!input) return;

    var content = input.value.trim();
    if (!content) return;

    input.disabled = true;
    var ok = await addComment(postId, content);
    input.disabled = false;

    if (ok) {
      input.value = '';
      // 刷新评论
      var result = await fetchComments(postId);
      if (result && result.comments) {
        _communityState.commentsCache[postId] = result.comments;
      }
      // 更新评论数
      var post = _communityState.posts.find(function (p) { return p.id === postId; });
      if (post) {
        post.comment_count = (post.comment_count || 0) + 1;
      }
      refreshFeed();
    }
  }

  function refreshFeed() {
    var feed = document.getElementById('community-feed');
    if (!feed) return;

    if (_communityState.posts.length === 0) {
      feed.innerHTML = renderEmptyState();
      return;
    }

    var html = '';
    for (var i = 0; i < _communityState.posts.length; i++) {
      html += renderPostCard(_communityState.posts[i]);
    }
    feed.innerHTML = html;
  }

  async function loadPosts(append) {
    if (_communityState.loading) return;
    _communityState.loading = true;

    var feed = document.getElementById('community-feed');
    var loadMore = document.getElementById('community-load-more');

    if (!append && feed) {
      feed.innerHTML = renderSkeletons(3);
    }

    var result = await fetchPosts(_communityState.currentPage, _communityState.currentTag);

    _communityState.loading = false;

    if (result) {
      var posts = Array.isArray(result.posts) ? result.posts : [];
      if (posts.length > 0) {
        if (append) {
          _communityState.posts = _communityState.posts.concat(posts);
        } else {
          _communityState.posts = posts;
        }
        _communityState.hasMore = posts.length >= 10;
      } else if (!append) {
        // Supabase 返回空结果，显示空状态
        _communityState.posts = [];
        _communityState.hasMore = false;
      } else {
        _communityState.hasMore = false;
      }
    } else if (!append) {
      _communityState.posts = [];
      _communityState.hasMore = false;
    } else {
      _communityState.hasMore = false;
    }

    refreshFeed();

    if (loadMore) {
      loadMore.style.display = _communityState.hasMore ? 'block' : 'none';
    }
  }

  // ===== 发帖弹窗 =====

  function showComposeModal() {
    var existing = document.getElementById('community-compose-overlay');
    if (existing) return;

    var selectedTags = [];

    var overlay = document.createElement('div');
    overlay.id = 'community-compose-overlay';
    overlay.className = 'community-compose-overlay';

    var tagsHtml = '';
    for (var i = 1; i < TAG_LIST.length; i++) {
      tagsHtml += '<span class="community-compose-tag" data-compose-tag="' + escapeHtml(TAG_LIST[i].key) + '">' + escapeHtml(TAG_LIST[i].label) + '</span>';
    }

    overlay.innerHTML = '<div class="community-compose-modal">' +
      '<div class="community-compose-header">' +
      '<span class="community-compose-title">发帖</span>' +
      '<button class="community-compose-close" id="community-compose-close">&times;</button>' +
      '</div>' +
      '<div class="community-compose-md-toolbar" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;padding:6px;background:var(--color-cream-dark,#f0ebe0);border-radius:8px;">' +
        '<button type="button" class="community-md-btn" data-md="bold" title="加粗 (Ctrl+B)" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-weight:700;font-size:0.85rem;color:var(--text-primary);"><b>B</b></button>' +
        '<button type="button" class="community-md-btn" data-md="italic" title="斜体 (Ctrl+I)" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-style:italic;font-size:0.85rem;color:var(--text-primary);"><i>I</i></button>' +
        '<button type="button" class="community-md-btn" data-md="code" title="行内代码" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-family:monospace;font-size:0.85rem;color:var(--text-primary);">&lt;/&gt;</button>' +
        '<button type="button" class="community-md-btn" data-md="h2" title="标题" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--text-primary);">H</button>' +
        '<button type="button" class="community-md-btn" data-md="quote" title="引用" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--text-primary);">❝</button>' +
        '<button type="button" class="community-md-btn" data-md="list" title="列表" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--text-primary);">•</button>' +
        '<button type="button" class="community-md-btn" data-md="link" title="链接" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--text-primary);">🔗</button>' +
        '<button type="button" class="community-md-btn" data-md="image" title="图片" style="padding:4px 10px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--text-primary);">🖼</button>' +
      '</div>' +
      '<textarea class="community-compose-textarea" id="community-compose-textarea" placeholder="分享你的学习心得、提问或讨论...&#10;&#10;支持 Markdown：**加粗** *斜体* `代码` # 标题 > 引用 - 列表 [链接](url) ![图片](url)"></textarea>' +
      '<div class="community-compose-toolbar">' +
      '<button class="community-compose-img-btn" id="community-compose-img-btn" title="上传图片">图片</button>' +
      '<input type="file" id="community-compose-img-input" accept="image/*" style="display:none">' +
      '<span style="font-size:0.72rem;color:var(--text-muted,#8a8a8a);margin-left:auto;">支持 Markdown · Ctrl+Enter 发布</span>' +
      '</div>' +
      '<div class="community-compose-tags" id="community-compose-tags">' + tagsHtml + '</div>' +
      '<div class="community-compose-footer">' +
      '<button class="community-compose-submit" id="community-compose-submit">发布</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 关闭
    var closeCompose = function () {
      overlay.classList.add('closing');
      overlay.addEventListener('animationend', function () {
        overlay.remove();
        document.body.style.overflow = '';
      }, { once: true });
    };

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCompose();
    });

    document.getElementById('community-compose-close').addEventListener('click', closeCompose);

    // 标签选择
    var composeTags = document.getElementById('community-compose-tags');
    composeTags.addEventListener('click', function (e) {
      var tag = e.target.closest('.community-compose-tag');
      if (!tag) return;
      var tagKey = tag.getAttribute('data-compose-tag');
      var idx = selectedTags.indexOf(tagKey);
      if (idx >= 0) {
        selectedTags.splice(idx, 1);
        tag.classList.remove('selected');
      } else {
        selectedTags.push(tagKey);
        tag.classList.add('selected');
      }
    });

    // 图片上传
    var imgBtn = document.getElementById('community-compose-img-btn');
    var imgInput = document.getElementById('community-compose-img-input');
    if (imgBtn && imgInput) {
      imgBtn.addEventListener('click', function () { imgInput.click(); });
      imgInput.addEventListener('change', function () {
        var file = imgInput.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { _showToast('图片不能超过2MB'); return; }
        var reader = new FileReader();
        reader.onload = function (e) {
          var textarea = document.getElementById('community-compose-textarea');
          var imgMd = '\n![' + file.name + '](' + e.target.result + ')\n';
          textarea.value += imgMd;
        };
        reader.readAsDataURL(file);
      });
    }

    // Markdown 工具栏：在选区周围插入对应语法
    var mdToolbar = document.querySelector('.community-compose-md-toolbar');
    if (mdToolbar) {
      mdToolbar.addEventListener('click', function (e) {
        var btn = e.target.closest('.community-md-btn');
        if (!btn) return;
        var textarea = document.getElementById('community-compose-textarea');
        if (!textarea) return;
        var type = btn.dataset.md;
        var start = textarea.selectionStart, end = textarea.selectionEnd;
        var sel = textarea.value.substring(start, end);
        var before = textarea.value.substring(0, start);
        var after = textarea.value.substring(end);
        var wrap = {
          bold:   { pre: '**', post: '**', placeholder: '加粗文字' },
          italic: { pre: '*',  post: '*',  placeholder: '斜体文字' },
          code:   { pre: '`',  post: '`',  placeholder: '代码' },
          h2:     { pre: '## ',post: '',    placeholder: '标题' },
          quote:  { pre: '> ', post: '',    placeholder: '引用' },
          list:   { pre: '- ', post: '',    placeholder: '列表项' },
          link:   { pre: '[',  post: '](https://)', placeholder: '链接文字' },
          image:  { pre: '![', post: '](https://)', placeholder: '图片描述' }
        }[type];
        if (!wrap) return;
        var insertText = sel || wrap.placeholder;
        var newText = before + wrap.pre + insertText + wrap.post + after;
        textarea.value = newText;
        var newCursorStart = start + wrap.pre.length;
        var newCursorEnd = newCursorStart + insertText.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
      });
    }

    // Ctrl+Enter 发布 + Ctrl+B/I 快捷键
    var composeTextarea = document.getElementById('community-compose-textarea');
    if (composeTextarea) {
      composeTextarea.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('community-compose-submit').click();
        }
      });
    }

    // 发布
    document.getElementById('community-compose-submit').addEventListener('click', async function () {
      var textarea = document.getElementById('community-compose-textarea');
      var content = textarea.value.trim();
      if (!content) return;

      var submitBtn = document.getElementById('community-compose-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = '发布中...';

      try {
        var ok = await createPost(content, selectedTags);
        if (ok) {
          closeCompose();
          // 刷新列表
          _communityState.currentPage = 1;
          _communityState.posts = [];
          loadPosts();
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = '发布';
          // Error toast is already shown by createPost
        }
      } catch (e) {
        submitBtn.disabled = false;
        submitBtn.textContent = '发布';
        _showToast('发帖出错，请稍后重试');
      }
    });

    // ESC 关闭
    var onKeydown = function (e) {
      if (e.key === 'Escape') {
        closeCompose();
        document.removeEventListener('keydown', onKeydown);
      }
    };
    document.addEventListener('keydown', onKeydown);

    // 聚焦
    setTimeout(function () {
      var ta = document.getElementById('community-compose-textarea');
      if (ta) ta.focus();
    }, 100);
  }

  // ===== 初始化函数 =====

  function initCommunity(target) {
    try {
      if (!target) {
        if (typeof AppState !== 'undefined' && AppState.rootElement) {
          target = AppState.rootElement;
        } else {
          target = document.getElementById('page-content');
        }
      }
      if (!target) {
        console.error('[BioQuest Community] initCommunity 找不到目标容器');
        return;
      }
      renderCommunityPage(target);
    } catch (err) {
      console.error('[BioQuest Community] initCommunity 异常:', err);
      if (target) {
        target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
          '<p style="color:var(--color-error);font-size:1.1rem;margin-bottom:8px;">社区模块初始化失败</p>' +
          '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">请刷新页面或稍后重试</p>' +
          '<button onclick="location.reload()" style="padding:8px 20px;background:var(--color-sage);color:#fff;border:none;border-radius:8px;cursor:pointer;">刷新页面</button>' +
          '</div>';
      }
    }
  }

  // ===== 暴露到全局 =====
  window.renderCommunityPage = renderCommunityPage;
  window.initCommunity = initCommunity;

})();
