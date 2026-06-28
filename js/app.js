/**
 * ============================================================
 * BioQuest — SPA 路由与全局状态管理
 * 使用 hash-based 路由实现单页应用导航
 * ============================================================
 */

/**
 * 动态加载脚本（返回 Promise），用于延迟加载非首屏 JS
 */
function __loadScriptAsync(src) {
  return new Promise(function(resolve, reject) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing._loaded) return resolve();
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s._loaded = false;
    s.onload = function() { s._loaded = true; resolve(); };
    s.onerror = function() { reject(new Error('Failed to load: ' + src)); };
    document.head.appendChild(s);
  });
}

/**
 * 按顺序加载多个脚本
 */
function __loadScriptChain(sources) {
  var p = Promise.resolve();
  sources.forEach(function(src) {
    p = p.then(function() { return __loadScriptAsync(src); });
  });
  return p;
}

// 获取 JS 基路径（适配子目录部署）
var __jsBase = (function() {
  var scripts = document.querySelectorAll('script[src*="js/app.js"]');
  if (scripts.length > 0) {
    var src = scripts[scripts.length - 1].src;
    var base = src.substring(0, src.lastIndexOf('/js/app.js'));
    return base ? base + '/' : '';
  }
  return '';
})();

/**
 * @typedef {Object} AppState
 * @property {string} currentRoute - 当前路由路径
 * @property {string} theme - 当前主题 ('light' | 'dark')
 * @property {Object} userSettings - 用户偏好设置
 * @property {boolean} initialized - 应用是否已初始化
 */

/** @type {AppState} */
const AppState = {
  currentRoute: '',
  theme: 'light',
  userSettings: {
    fontSize: 'medium',
    questionCount: 30,
    showTimer: true,
    autoSubmit: false
  },
  initialized: false,
  pageModules: {}
};

// 立即暴露到 window 全局，供其他模块使用
window.AppState = AppState;

/**
 * 路由配置表
 * 定义每个路由对应的页面标题和渲染函数
 */
const Routes = {
  '/': {
    title: '首页',
    module: 'home'
  },
  '/practice': {
    title: '练习',
    render: 'renderPracticePage',
    module: 'practice'
  },
  '/photo-quiz': {
    title: '拍照录题',
    render: 'renderPhotoQuizPage',
    module: 'photo-quiz'
  },
  '/exam': {
    title: '模拟考试',
    render: 'renderExamPage',
    module: 'exam'
  },
  '/analytics': {
    title: '学习分析',
    render: 'renderAnalyticsPage',
    module: 'analytics'
  },
  '/user': {
    title: '用户中心',
    render: 'renderUserPage',
    module: 'user'
  },
  '/search': {
    title: '搜索',
    render: 'renderSearchPage',
    module: 'search'
  },
  '/admin': {
    title: '管理员后台',
    render: 'renderAdminPage',
    module: 'admin'
  },
  '/cards': {
    title: '知识卡片',
    render: 'renderCardsPage',
    module: 'cards'
  },
  '/community': {
    title: '社区',
    render: 'renderCommunityPage',
    module: 'community'
  },
  '/leaderboard': {
    title: '排行榜',
    render: 'renderLeaderboardPage',
    module: 'leaderboard'
  },
  '/knowledge-graph': {
    title: '知识图谱',
    render: 'renderKnowledgeGraphPage',
    module: 'knowledge-graph'
  },
  '/diagnosis': {
    title: '智能诊断',
    render: 'renderSmartDiagnosisPage',
    module: 'smart-diagnosis'
  },
  '/pomodoro': {
    title: '专注模式',
    redirect: '/study'
  },
  '/habits': {
    title: '习惯养成',
    redirect: '/study'
  },
  '/review': {
    title: '错题与复盘',
    redirect: '/wrongbook'
  },
  '/bounties': {
    title: '问答悬赏',
    render: 'renderBountiesPage',
    module: 'bounty'
  },
  '/wrongbook': {
    title: '错题与复盘',
    render: 'renderWrongbookPage',
    module: 'wrongbook'
  },
  '/review-deep': {
    title: '错题与复盘',
    redirect: '/wrongbook'
  },
  '/study': {
    title: '学习管理',
    render: 'renderStudyPage',
    module: 'study'
  },
  '/bio-animation': {
    title: '生物过程动画',
    render: 'renderBioAnimationPage',
    module: 'bio-animation'
  },
  '/dashboard': {
    title: '仪表盘',
    render: 'renderDashboardPage',
    module: 'dashboard'
  },
  '/tutor': {
    title: 'AI 生物导师',
    render: 'renderTutorPage',
    module: 'tutor'
  },
  '/discussion': {
    title: '生物学家圆桌讨论',
    render: 'renderDiscussionPage',
    module: 'discussion'
  },
  '/bio-lab': {
    title: '虚拟生物实验室',
    render: 'renderBioLabPage',
    module: 'bio-lab'
  },
  '/trends': {
    title: '学情趋势',
    render: 'renderTrendsPage',
    module: 'trends'
  },
  '/teacher': {
    title: '教师协同视图',
    render: 'renderTeacherPage',
    module: 'teacher'
  }
};

/**
 * 获取当前 hash 对应的路由路径
 * @returns {string} 路由路径，如 '/', '/practice', '/exam'
 */
function getRouteFromHash() {
  const hash = window.location.hash.slice(1) || '/';
  if (hash.startsWith('/')) {
    const cleanHash = hash.split('?')[0];
    return Routes[cleanHash] ? cleanHash : '/';
  }
  return '/';
}

/**
 * 导航到指定路由
 * @param {string} route - 目标路由路径
 * @param {Object} [options] - 导航选项
 * @param {boolean} [options.replace=false] - 是否替换当前历史记录
 */
function navigateTo(route, options = {}) {
  const { replace = false } = options;

  if (!Routes[route]) {
    console.warn(`[BioQuest] 未知路由: ${route}，回退到首页`);
    route = '/';
  }

  if (route === AppState.currentRoute) {
    return;
  }

  if (replace) {
    window.location.replace(`#${route}`);
  } else {
    window.location.hash = route;
  }
}

window.navigateTo = navigateTo;

/**
 * 更新页面标题
 * @param {string} route - 当前路由
 */
function updatePageTitle(route) {
  const routeConfig = Routes[route];
  if (routeConfig) {
    document.title = `${routeConfig.title} - BioQuest 生物竞赛学习平台`;
  }
}

/**
 * 更新导航栏的激活状态
 * @param {string} route - 当前路由
 */
function updateNavActive(route) {
  document.querySelectorAll('.header-nav a, .mobile-nav a[data-route]').forEach((link) => {
    const linkRoute = link.getAttribute('data-route') || link.getAttribute('href');
    const normalized = linkRoute ? linkRoute.replace('#', '') : '';

    if (normalized === route || (route === '/' && (normalized === '/' || normalized === ''))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * 练习页面渲染
 * @param {HTMLElement} target - 渲染目标元素
 */
function renderPracticePage(target) {
  console.log('[BioQuest] app.js:renderPracticePage 调用, window.initPractice:', typeof window.initPractice);
  if (typeof window.initPractice === 'function') {
    window.initPractice(target);
  } else {
    target.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:2rem;margin-bottom:12px;"></div>
        <p style="color:var(--text-muted);">练习模块加载中…</p>
      </div>
    `;
    // 如果全局函数还没有，延迟再试
    setTimeout(() => {
      if (typeof window.initPractice === 'function') {
        window.initPractice(target);
      }
    }, 200);
  }
}

/**
 * 模拟考试页面渲染
 * @param {HTMLElement} target - 渲染目标元素
 */
function renderExamPage(target) {
  console.log('[BioQuest] app.js:renderExamPage 调用, window.initExam:', typeof window.initExam);
  
  // 确保 target 正确
  if (!target) {
    target = document.getElementById('page-content');
  }
  
  if (typeof window.initExam === 'function') {
    try {
      window.initExam(target);
    } catch (err) {
      console.error('初始化考试模块失败:', err);
      target.innerHTML = `
        <div style="text-align:center;padding:64px 24px;">
          <div style="font-size:2rem;margin-bottom:12px;"></div>
          <p style="color:var(--color-error);">加载考试模块失败，请刷新页面重试</p>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-top:8px;">错误信息: ${err.message || '未知错误'}</p>
        </div>
      `;
    }
  } else {
    target.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:2rem;margin-bottom:12px;"></div>
        <p style="color:var(--text-muted);">考试模块加载中…</p>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px;">如长时间未响应，请刷新页面</p>
      </div>
    `;
    
    // 多次尝试初始化
    let attempts = 0;
    const tryInit = () => {
      attempts++;
      if (typeof window.initExam === 'function') {
        window.initExam(target);
      } else if (attempts < 10) {
        setTimeout(tryInit, 200);
      } else {
        target.innerHTML = `
          <div style="text-align:center;padding:64px 24px;">
            <div style="font-size:2rem;margin-bottom:12px;"></div>
            <p style="color:var(--color-error);">考试模块加载超时，请刷新页面重试</p>
            <button style="margin-top:16px;padding:8px 20px;background:var(--color-amber);border:none;border-radius:8px;cursor:pointer;" onclick="location.reload()">刷新页面</button>
          </div>
        `;
      }
    };
    tryInit();
  }
}

/**
 * 学习分析页面渲染
 * @param {HTMLElement} target - 渲染目标元素
 */
function renderAnalyticsPage(target) {
  console.log('渲染学习分析页面');
  if (typeof window.initAnalytics === 'function') {
    window.initAnalytics(target);
  } else {
    target.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:2rem;margin-bottom:12px;"></div>
        <p style="color:var(--text-muted);">分析模块加载中…</p>
      </div>
    `;
    setTimeout(() => {
      if (typeof window.initAnalytics === 'function') {
        window.initAnalytics(target);
      }
    }, 200);
  }
}

/**
 * 用户中心页面渲染
 * @param {HTMLElement} target - 渲染目标元素
 */
function renderUserPage(target) {
  console.log('渲染用户中心页面');
  if (typeof window.initUser === 'function') {
    window.initUser(target);
  } else {
    target.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:2rem;margin-bottom:12px;"></div>
        <p style="color:var(--text-muted);">用户模块加载中…</p>
      </div>
    `;
    setTimeout(() => {
      if (typeof window.initUser === 'function') {
        window.initUser(target);
      }
    }, 200);
  }
}

/**
 * 管理员后台页面渲染
 * @param {HTMLElement} target - 渲染目标元素
 */
function renderAdminPage(target) {
  console.log('渲染管理员后台页面');
  if (typeof window.initAdmin === 'function') {
    window.initAdmin(target);
  } else {
    target.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:2rem;margin-bottom:12px;"></div>
        <p style="color:var(--text-muted);">管理员模块加载中...</p>
      </div>
    `;
    setTimeout(() => {
      if (typeof window.initAdmin === 'function') {
        window.initAdmin(target);
      }
    }, 200);
  }
}

/**
 * 知识卡片页面渲染 — Anki 风格间隔重复
 */
function renderCardsPage() {
  var container = document.getElementById('page-content');
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:720px;margin:0 auto;padding:40px 20px 60px;">
      <div class="anki-page-header" style="margin-bottom:32px;">
        <div class="section-label">SPACED REPETITION</div>
        <h2 class="section-title" style="font-size:2rem;">间隔重复记忆卡</h2>
        <p class="section-desc">基于 SM-2 算法的智能复习系统 · 选择牌组开始学习</p>
      </div>

      <!-- 牌组选择器（动态渲染） -->
      <div id="anki-deck-selector"></div>

      <!-- 卡片学习区域 -->
      <div id="anki-card-area">
        <div class="anki-card-container" id="anki-card-area-inner">
          <div class="anki-card" id="anki-card">
              <div class="anki-face anki-front-face" id="anki-front"></div>
              <div class="anki-face anki-back-face" id="anki-back"></div>
          </div>
        </div>
        <div class="anki-progress-bar" id="anki-progress-bar"></div>
      </div>

      <div class="anki-shortcut-hint" style="margin-top:14px;">
        <span><kbd>空格</kbd> 翻转</span>
        <span><kbd>1</kbd> 再来一次</span>
        <span><kbd>2</kbd> 一般</span>
        <span><kbd>3</kbd> 简单</span>
      </div>
    </div>
  `;

  // 加载 cards.js 模块（如果尚未加载）
  if (typeof window.AnkiSystem === 'undefined') {
    var script = document.createElement('script');
    script.src = 'js/cards.js';
    script.onload = function () {
      console.log('[BioQuest] Anki 卡片模块加载完成');
    };
    document.head.appendChild(script);
  } else {
    // 已加载，重新初始化
    if (typeof window.AnkiSystem.loadData === 'function') {
      window.AnkiSystem.loadData();
    }
  }
}

/**
 * 搜索页面渲染 — 独立完整页面
 */
function renderSearchPage() {
  var container = document.getElementById('page-content');
  if (!container) return;

  container.innerHTML = `
    <div class="search-page">
      <div class="search-hero">
        <h1 class="search-hero-title">知识搜索</h1>
        <p class="search-hero-subtitle">搜索全量题库与生竞专业资源</p>
        <div class="search-bar" style="position:relative;">
          <input type="text" class="search-bar-input" id="search-page-input" placeholder="输入生物学关键词，如：细胞膜、光合作用、遗传定律..." autocomplete="off" />
          <button class="search-bar-btn" id="search-page-btn">搜索</button>
          <div class="search-quick-hint" id="search-quick-hint"></div>
        </div>
      </div>
      <div class="search-filters" id="search-filters">
        <span class="search-filter-label">搜索范围：</span>
        <span class="search-filter-chip selected" data-source="local">题库搜索</span>
        <span class="search-filter-chip selected" data-source="zhixin">质心论坛</span>
        <span class="search-filter-chip selected" data-source="baidu">百度</span>
        <span class="search-filter-chip selected" data-source="zhihu">知乎</span>
        <span class="search-filter-chip" data-source="bing">Bing</span>
        <span class="search-filter-chip" data-source="scholar">Scholar</span>
        <span class="search-filter-chip" data-source="wiki">Wikipedia</span>
        <span class="search-filter-chip" data-source="cnki">知网</span>
        <span class="search-filter-chip" data-source="biolib">BioLib</span>
        <span class="search-filter-chip" data-source="biooo">BioOO</span>
        <span class="search-filter-chip" data-source="naoke">脑壳生物</span>
      </div>
      <div class="search-module-filters" id="search-module-filters">
        <span class="search-filter-label">模块筛选：</span>
        <span class="search-module-chip selected" data-module="">全部</span>
        <span class="search-module-chip" data-module="module_1">模块1</span>
        <span class="search-module-chip" data-module="module_2">模块2</span>
        <span class="search-module-chip" data-module="module_3">模块3</span>
        <span class="search-module-chip" data-module="module_4">模块4</span>
        <span class="search-module-chip" data-module="exam">考试题</span>
      </div>
      <div class="search-results-area" id="search-results-area">
        <div class="search-empty-state">
          <div class="search-empty-icon">[BioQuest]</div>
          <p>输入关键词开始搜索</p>
          <p class="search-empty-hint">支持搜索全量题库（20000+ 题目）和多个生竞专业网站</p>
        </div>
      </div>
    </div>
  `;

  // 绑定事件
  var searchInput = document.getElementById('search-page-input');
  var searchBtn = document.getElementById('search-page-btn');
  var resultsArea = document.getElementById('search-results-area');
  var filterChips = document.querySelectorAll('.search-filter-chip');
  var moduleChips = document.querySelectorAll('.search-module-chip');
  var quickHint = document.getElementById('search-quick-hint');

  // 当前选中的模块
  var currentModule = '';

  // 搜索源选择
  filterChips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      chip.classList.toggle('selected');
    });
  });

  // 模块筛选选择
  moduleChips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      moduleChips.forEach(function(c) { c.classList.remove('selected'); });
      chip.classList.add('selected');
      currentModule = chip.getAttribute('data-module');
      // 如果已有搜索词，重新搜索
      if (searchInput.value.trim()) doSearch();
    });
  });

  // 点击外部关闭快速提示
  document.addEventListener('click', function(e) {
    if (quickHint && !quickHint.contains(e.target) && e.target !== searchInput) {
      quickHint.style.display = 'none';
    }
  });

  // 搜索执行
  var searchTimer = null;
  var currentSearchId = 0; // 用于取消过期的搜索请求

  // Supabase 直连搜索题目
  function _searchQuestionsFromSupabase(query, module) {
    var sb = typeof window.getSupabase === 'function' ? window.getSupabase() : null;
    if (!sb || !query) return Promise.resolve({ results: [], total: 0 });
    var q = sb.from('questions').select('*').ilike('question', '%' + query + '%').limit(20);
    if (module) q = q.eq('module', String(module));
    return q.then(function(result) {
      if (result.error || !result.data) return { results: [], total: 0 };
      var results = result.data.map(function(item) {
        return {
          type: item.type, question: item.question,
          subQuestions: item.sub_questions || [],
          explanation: item.explanation || '', subject: item.subject || '',
          difficulty: item.difficulty || 'medium', module: item.module
        };
      });
      return { results: results, total: results.length };
    }).catch(function() { return { results: [], total: 0 }; });
  }

  var doSearch = function() {
    var query = searchInput.value.trim();
    if (!query) {
      resultsArea.innerHTML = '<div class="search-empty-state"><div class="search-empty-icon">暂无结果</div><p>输入关键词开始搜索</p></div>';
      return;
    }

    var selectedSources = [];
    filterChips.forEach(function(c) {
      if (c.classList.contains('selected')) selectedSources.push(c.getAttribute('data-source'));
    });

    if (selectedSources.length === 0) {
      resultsArea.innerHTML = '<div class="search-no-result">请至少选择一个搜索范围</div>';
      return;
    }

    var searchId = ++currentSearchId;
    resultsArea.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div>搜索中...</div>';

    // 本地题库搜索（通过 Supabase 直连）
    var localPromise = selectedSources.indexOf('local') >= 0
      ? _searchQuestionsFromSupabase(query, currentModule)
      : Promise.resolve({ results: [], total: 0 });

    // 外部搜索（暂不支持，返回空结果）
    var externalSources = selectedSources.filter(function(s) { return s !== 'local'; });
    var externalPromise = Promise.resolve({ results: [] });

    Promise.all([localPromise, externalPromise]).then(function(responses) {
      // 检查是否已被新搜索取代
      if (searchId !== currentSearchId) return;

      var localData = responses[0];
      var externalData = responses[1];
      var html = '';

      // ====== 题库搜索结果 ======
      var localResults = localData.results || [];
      var localTotal = localData.total || 0;

      if (localResults.length > 0) {
        html += '<div class="search-section"><div class="search-section-title">题库搜索 <span class="search-section-count">共 ' + localTotal + ' 题匹配</span></div>';
        localResults.forEach(function(item) {
          var stem = item.question || '';
          var shortStem = stem.length > 150 ? stem.slice(0, 150) + '...' : stem;
          var subject = item.subject || '';
          var concept = item.concept || '';
          var difficulty = item.difficulty || '';
          var moduleLabel = item.module || '';
          var explanation = item.explanation || '';

          // 模块显示名
          var moduleDisplay = moduleLabel;
          if (moduleLabel === 'module_1') moduleDisplay = '模块1';
          else if (moduleLabel === 'module_2') moduleDisplay = '模块2';
          else if (moduleLabel === 'module_3') moduleDisplay = '模块3';
          else if (moduleLabel === 'module_4') moduleDisplay = '模块4';
          else if (moduleLabel === 'exam') moduleDisplay = '考试题';

          // 难度徽章
          var diffBadge = '';
          if (difficulty) {
            var diffNum = parseInt(difficulty) || 0;
            var diffLabel = '';
            var diffClass = '';
            if (diffNum >= 1 && diffNum <= 2) { diffLabel = '简单'; diffClass = 'search-diff-easy'; }
            else if (diffNum === 3) { diffLabel = '中等'; diffClass = 'search-diff-medium'; }
            else if (diffNum >= 4 && diffNum <= 5) { diffLabel = '困难'; diffClass = 'search-diff-hard'; }
            else if (typeof difficulty === 'string') {
              diffLabel = difficulty;
              diffClass = 'search-diff-medium';
            }
            if (diffLabel) diffBadge = '<span class="search-diff-badge ' + diffClass + '">' + escapeHtml(diffLabel) + '</span>';
          }

          html += '<div class="search-result-card search-result-local" data-question-id="' + escapeHtml(item.id || '') + '">';
          html += '<div class="search-result-stem">' + highlightMatch(escapeHtml(shortStem), query) + '</div>';
          if (explanation) {
            var shortExp = explanation.length > 100 ? explanation.slice(0, 100) + '...' : explanation;
            html += '<div class="search-result-explanation">' + highlightMatch(escapeHtml(shortExp), query) + '</div>';
          }
          html += '<div class="search-result-meta">';
          if (subject) html += '<span class="search-result-tag">' + highlightMatch(escapeHtml(subject), query) + '</span>';
          if (concept) html += '<span class="search-result-tag">' + highlightMatch(escapeHtml(concept), query) + '</span>';
          if (moduleDisplay) html += '<span class="search-result-module">' + escapeHtml(moduleDisplay) + '</span>';
          html += diffBadge;
          html += '</div></div>';
        });

        // 分页提示
        if (localTotal > 30) {
          html += '<div class="search-more-hint">显示前 30 条，共 ' + localTotal + ' 条匹配</div>';
        }
        html += '</div>';
      }

      // ====== 外部结果 — 按 tag 分组 ======
      var allExternal = externalData.results || [];

      if (allExternal.length > 0) {
        // 为每条结果提取 tags
        var taggedResults = [];
        allExternal.forEach(function(item) {
          var textToTag = (item.abstract || item.title || item.name || '');
          var tags = extractTags(textToTag);
          // 如果提取不到 tags，用来源名作为默认 tag
          if (tags.length === 0) tags = [item.name || '其他'];
          taggedResults.push({
            item: item,
            tags: tags,
            mainTag: tags[0]
          });
        });

        // 按 mainTag 分组
        var groups = {};
        taggedResults.forEach(function(tr) {
          var g = tr.mainTag;
          if (!groups[g]) groups[g] = [];
          groups[g].push(tr);
        });

        // 排序：结果数多的 group 排前面
        var sortedGroups = Object.keys(groups).sort(function(a, b) {
          return groups[b].length - groups[a].length;
        });

        // 渲染每个分组
        sortedGroups.forEach(function(tagName) {
          var itemsInGroup = groups[tagName];

          html += '<div class="search-tag-group">';
          html += '<div class="search-tag-group-header">';
          html += '<span class="search-tag-group-name">#' + escapeHtml(tagName) + '</span>';
          html += '<span class="search-tag-group-count">' + itemsInGroup.length + ' 条结果</span>';
          html += '</div>';
          html += '<div class="search-tag-group-items">';

          itemsInGroup.forEach(function(tr) {
            var item = tr.item;
            var allTags = tr.tags;

            html += '<div class="search-result-card">';

            // 标题（最突出）
            if (item.title) {
              html += '<div class="search-result-title">' + escapeHtml(item.title) + '</div>';
            }

            // 摘要（次要）
            if (item.abstract) {
              html += '<div class="search-result-abstract">' + escapeHtml(item.abstract) + '</div>';
            }

            // 该条的所有 tag（核心：用tag描述内容）
            if (allTags.length > 0) {
              html += '<div class="search-result-tags">';
              allTags.forEach(function(t) {
                var isActive = t === tagName;
                html += '<span class="search-tag' + (isActive ? ' search-tag-active' : '') + '">' + escapeHtml(t) + '</span>';
              });
              html += '</div>';
            }

            // 来源信息（淡化，放在底部）
            if (item.name) {
              html += '<div class="search-result-source">来源: ' + escapeHtml(item.name) + '</div>';
            }

            // 链接
            if (item.url) {
              html += '<a class="search-result-goto" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">查看原文 &rarr;</a>';
            }

            html += '</div>';
          });

          html += '</div></div>'; // group-items + tag-group
        });
      }

      // 无结果
      if (!html && localResults.length === 0) {
        html = '<div class="search-no-result">未找到与"' + escapeHtml(query) + '"相关的结果</div>';
      } else if (!html) {
        html = '<div class="search-no-result">未找到外部结果</div>';
      }

      resultsArea.innerHTML = html;

      // 本地题目点击跳转练习
      resultsArea.querySelectorAll('.search-result-local').forEach(function(card) {
        card.addEventListener('click', function() {
          var qId = card.getAttribute('data-question-id');
          if (qId && typeof navigateTo === 'function') {
            sessionStorage.setItem('bioquest_redo_question', qId);
            navigateTo('/practice');
          }
        });
      });
    });
  };

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
  });

  // 输入时实时搜索（防抖 300ms）
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      var query = searchInput.value.trim();
      if (query.length >= 2) {
        // 实时搜索题库（Supabase 直连）
        _searchQuestionsFromSupabase(query, null)
          .then(function(data) {
            var results = data.results || [];
            if (results.length > 0) {
              var hintHtml = '';
              results.slice(0, 5).forEach(function(item) {
                var stem = (item.question || '').slice(0, 60);
                hintHtml += '<div class="search-quick-item" data-qid="' + (item.id || '') + '">' + escapeHtml(stem) + '</div>';
              });
              quickHint.innerHTML = hintHtml;
              quickHint.style.display = 'block';

              quickHint.querySelectorAll('.search-quick-item').forEach(function(el) {
                el.addEventListener('click', function() {
                  sessionStorage.setItem('bioquest_redo_question', el.getAttribute('data-qid'));
                  if (typeof navigateTo === 'function') navigateTo('/practice');
                });
              });
            } else {
              quickHint.style.display = 'none';
            }
          })
          .catch(function() {
            quickHint.style.display = 'none';
          });
      } else {
        quickHint.style.display = 'none';
      }
    }, 300);
  });

  // URL 参数支持
  var urlQuery = new URLSearchParams(window.location.hash.split('?')[1] || '').get('q');
  if (urlQuery) {
    searchInput.value = urlQuery;
    doSearch();
  } else {
    searchInput.focus();
  }
}

/**
 * 高亮匹配文本
 */
function highlightMatch(text, query) {
  if (!query || !text) return text;
  // 对查询中的特殊正则字符进行转义
  var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re = new RegExp('(' + escaped + ')', 'gi');
  return text.replace(re, '<mark class="search-highlight">$1</mark>');
}

/**
 * 本地搜索函数 — 搜索错题和练习记录（保留用于离线场景）
 */
function searchLocalQuestions(query) {
  if (!query || query.length < 1) return [];
  var lower = query.toLowerCase();
  var results = [];

  // 从 localStorage 中搜索错题和收藏
  var wrongQuestions = typeof getWrongQuestions === 'function' ? (getWrongQuestions() || []) : [];
  wrongQuestions.forEach(function(w) {
    var text = (w.questionText || '').toLowerCase();
    if (text.indexOf(lower) >= 0) {
      results.push({
        question: w.questionText,
        subject: w.subject || '',
        concept: '',
        module: w.module || '',
        id: w.qId || '',
        source: 'wrong'
      });
    }
  });

  // 从练习记录中搜索
  var records = typeof getRecords === 'function' ? (getRecords() || []) : [];
  records.forEach(function(r) {
    if (r.questions) {
      r.questions.forEach(function(q) {
        var text = (q.question || '').toLowerCase();
        var concept = (q.concept || '').toLowerCase();
        if (text.indexOf(lower) >= 0 || concept.indexOf(lower) >= 0) {
          results.push({
            question: q.question,
            subject: q.subject || '',
            concept: q.concept || '',
            module: r.module || '',
            id: '',
            source: 'record'
          });
        }
      });
    }
  });

  // 去重
  var seen = {};
  return results.filter(function(r) {
    var questionText = r.question || '';
    var key = questionText.slice(0, 50);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0, 30);
}

/**
 * 从文本中提取关键词标签
 */
function extractTags(text) {
  if (!text || text.length < 4) return [];

  // 清理 HTML 标签
  text = text.replace(/<[^>]+>/g, ' ');

  // 中文停用词
  var stopWords = {
    '的':1,'了':1,'是':1,'在':1,'有':1,'和':1,'与':1,'或':1,'等':1,'及':1,'其':1,
    '这':1,'那':1,'个':1,'一':1,'二':1,'三':1,'可以':1,'进行':1,'通过':1,
    '关于':1,'以及':1,'对':1,'中':1,'上':1,'下':1,'内':1,'外':1,'以':1,
    '为':1,'被':1,'由':1,'将':1,'把':1,'让':1,'使':1,'会':1,'能':1,'可能':1,
    'the':1,'a':1,'an':1,'is':1,'are':1,'was':1,'were':1,'of':1,'to':1,'in':1,
    'for':1,'and':1,'or':1,'not':1,'with':1,'on':1,'at':1,'by':1,'from':1,'as':1,
    'it':1,'this':1,'that':1,'which':1,'who':1,'what':1,'how':1,'when':1,'where':1,
    'also':1,'more':1,'than':1,'some':1,'such':1,'into':1,'over':1,'after':1,'before':1,
    'between':1,'under':1,'during':1,'without':1,'within':1,'about':1,'above':1,'below':1,
    '我们':1,'他们':1,'它们':1,'她':1,'他':1,'我':1,'你':1,'大家':1,'通常':1,
    '一般':1,'包括':1,'主要':1,'重要':1,'相关':1,'不同':1,'相同':1,'各种':1,
    '一种':1,'一个':1,'这个':1,'那个':1,'什么':1,'如何':1,'为什么':1,'因为':1,
    '所以':1,'但是':1,'然而':1,'因此':1,'另外':1,'此外':1,'首先':1,'其次':1,
    '最后':1,'然后':1,'或者':1,'而且':1,'并且':1,'同时':1,'虽然':1,'尽管':1,
    '如果':1,'除非':1,'只要':1,'无论':1,'不管':1,'即使':1,'就算':1
  };

  // 分词：按标点、空格、常见分隔符分割
  var segments = text.split(/[\s,.;:!?"'（）【】《》\[\]{}、，。！？；：""''—–\-\n\r\t\/\\|@#\$%^&*()+<>=~`]+/);

  var freq = {};
  segments.forEach(function(s) {
    s = s.trim();
    // 过滤条件：长度 2-15 字符，不是纯数字，不是停用词
    if (s.length >= 2 && s.length <= 15 && !stopWords[s.toLowerCase()] && !/^\d+$/.test(s)) {
      freq[s] = (freq[s] || 0) + 1;
    }
  });

  // 取频率最高的 5 个
  var topTags = Object.keys(freq).sort(function(a, b) { return freq[b] - freq[a]; }).slice(0, 5);

  return topTags;
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 重新初始化首页关键组件（倒计时、Hero 动画、滚动动画）
 * 这些组件位于首屏或影响全局交互，需要立即执行
 */
function reinitHomeComponents() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (daysEl || hoursEl || minsEl || secsEl) {
    const TARGET_DATE = new Date('2026-08-16T09:00:00+08:00');
    function pad(n) { return String(n).padStart(2, '0'); }
    function update() {
      const now = new Date();
      const diff = Math.max(0, TARGET_DATE - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minsEl) minsEl.textContent = pad(mins);
      if (secsEl) secsEl.textContent = pad(secs);
    }
    update();
    if (AppState._countdownTimer) clearInterval(AppState._countdownTimer);
    AppState._countdownTimer = setInterval(update, 1000);
  }

  if (typeof initHeroSketch === 'function') {
    setTimeout(function () { initHeroSketch(); }, 150);
  }

  // 初始化平滑滚动动画（全局，首屏可见元素立即触发动画）
  initScrollAnimations();

  // 非关键模块延迟执行，避免阻塞首屏交互
  scheduleIdleWork(initNonCriticalHomeModules, { delay: 80 });
}

/**
 * 将任务调度到浏览器空闲时段执行
 * 优先使用 requestIdleCallback，不支持时使用 setTimeout(0) 兜底
 */
function scheduleIdleWork(fn, options) {
  options = options || {};
  var execute = function () {
    try {
      fn();
    } catch (e) {
      console.warn('[BioQuest] 空闲任务执行失败:', e);
    }
  };

  if (!options.immediate && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(execute, { timeout: options.timeout || 2000 });
  } else {
    setTimeout(execute, options.delay || 0);
  }
}
window.scheduleIdleWork = scheduleIdleWork;

/**
 * 初始化首页非关键模块
 * 每日一题、公告、生物学史时间轴、能力雷达、社区摘要等首屏下方内容
 * 在首屏渲染完成后再按需加载，不阻塞 DOMContentLoaded 后的交互
 */
function initNonCriticalHomeModules() {
  // 每日一题：首屏下方，按需渲染
  if (typeof window.renderDailyQuestion === 'function') {
    scheduleIdleWork(function () { window.renderDailyQuestion(); }, { delay: 50 });
  } else if (typeof window.loadModule === 'function') {
    window.loadModule('daily-question');
  }

  // 首页公告
  scheduleIdleWork(function () { loadHomeAnnouncements(); }, { delay: 100 });

  // 生物学史时间轴：由另一个 agent 负责添加 DOM，检测到容器后按需加载
  var bioSection = document.getElementById('biologyHistorySection');
  if (bioSection) {
    if (typeof window.initBiologyTimeline === 'function') {
      scheduleIdleWork(function () { window.initBiologyTimeline(bioSection); }, { delay: 120 });
    } else if (typeof window.loadModule === 'function') {
      window.loadModule('biology-history').then(function () {
        if (typeof window.initBiologyTimeline === 'function') {
          window.initBiologyTimeline(bioSection);
        }
      }).catch(function (err) {
        console.warn('[BioQuest] 生物学史模块加载失败:', err);
      });
    }
  }

  // 能力雷达：仅在 DOM 存在时加载
  var radarEl = document.getElementById('radarChart') || document.querySelector('[data-radar-chart]');
  if (radarEl && typeof window.loadModule === 'function') {
    window.loadModule('analytic');
  }

  // 社区摘要：仅在 DOM 存在时加载
  var communityEl = document.querySelector('[data-section="community-summary"]');
  if (communityEl && typeof window.loadModule === 'function') {
    window.loadModule('community');
  }
}
window.initNonCriticalHomeModules = initNonCriticalHomeModules;

/**
 * 加载首页公告
 */
var _announcementList = [];
var _announcementIndex = 0;

async function loadHomeAnnouncements() {
  var banner = document.getElementById('announcementBanner');
  if (!banner) return;

  try {
    var announcements = [];
    if (typeof window.getAnnouncements === 'function') {
      announcements = await window.getAnnouncements({ onlyActive: true, limit: 10 });
    }
    if (!announcements || announcements.length === 0) {
      banner.style.display = 'none';
      return;
    }
    _announcementList = announcements;
    _announcementIndex = 0;
    banner.style.display = 'block';
    showAnnouncementAtIndex(0);

    var nav = document.getElementById('announcementNav');
    if (announcements.length > 1 && nav) {
      nav.style.display = 'flex';
      document.getElementById('announcementPrev').onclick = function() {
        _announcementIndex = (_announcementIndex - 1 + _announcementList.length) % _announcementList.length;
        showAnnouncementAtIndex(_announcementIndex);
      };
      document.getElementById('announcementNext').onclick = function() {
        _announcementIndex = (_announcementIndex + 1) % _announcementList.length;
        showAnnouncementAtIndex(_announcementIndex);
      };
    }
  } catch (e) {
    banner.style.display = 'none';
  }
}

function showAnnouncementAtIndex(index) {
  var textEl = document.getElementById('announcementText');
  var counterEl = document.getElementById('announcementCounter');
  if (!textEl || !_announcementList[index]) return;
  var ann = _announcementList[index];
  var prefix = ann.is_pinned ? '[置顶] ' : '';
  textEl.textContent = prefix + ann.title + (ann.content ? ' | ' + ann.content.substring(0, 100) : '');
  textEl.style.animation = 'none';
  textEl.offsetHeight; // reflow
  textEl.style.animation = '';
  if (counterEl) {
    counterEl.textContent = (index + 1) + '/' + _announcementList.length;
  }
}

/**
 * 更新底部标签栏高亮状态
 */
function updateBottomTabBar(route) {
  var bar = document.getElementById('bottomTabBar');
  if (!bar) return;
  var tabs = bar.querySelectorAll('.bottom-tab');
  if (!tabs || tabs.length === 0) return;

  // 路由到标签的映射
  var tabMap = {
    '/': 'home',
    '/practice': 'practice',
    '/exam': 'exam',
    '/dashboard': 'dashboard',
    '/user': 'user'
  };

  var activeTab = tabMap[route] || '';

  tabs.forEach(function(tab) {
    var tabName = tab.getAttribute('data-tab');
    if (tabName === activeTab) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

/**
 * 初始化主页滚动动画
 * 使用 Intersection Observer 实现 section 入场动画
 */
function initScrollAnimations() {
  // 清理旧的 observer
  if (AppState._scrollObserver) {
    AppState._scrollObserver.disconnect();
  }

  // 为主页各区块添加 reveal 类
  var sections = document.querySelectorAll('[data-section]');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.add('section-reveal');
  }

  // 为模块卡片添加子级 reveal
  var moduleBlocks = document.querySelectorAll('.module-block');
  for (var i = 0; i < moduleBlocks.length; i++) {
    moduleBlocks[i].classList.add('section-reveal-child');
    moduleBlocks[i].style.transitionDelay = (i * 0.08) + 's';
  }

  // 为统计项添加子级 reveal
  var statItems = document.querySelectorAll('.stat-item');
  for (var i = 0; i < statItems.length; i++) {
    statItems[i].classList.add('section-reveal-child');
    statItems[i].style.transitionDelay = (i * 0.1) + 's';
  }

  // 为流程步骤添加子级 reveal
  var processSteps = document.querySelectorAll('.process-step');
  for (var i = 0; i < processSteps.length; i++) {
    processSteps[i].classList.add('section-reveal-child');
    processSteps[i].style.transitionDelay = (i * 0.12) + 's';
  }

  AppState._scrollObserver = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('section-reveal-child')) {
          entry.target.classList.add('section-reveal-child--visible');
        } else {
          entry.target.classList.add('section-reveal--visible');
        }
        // 区块可见后不再观察，但子元素继续观察以便 stagger
        if (!entry.target.classList.contains('section-reveal-child')) {
          AppState._scrollObserver.unobserve(entry.target);
        }
      }
    }
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  // 观察所有目标元素
  var allReveals = document.querySelectorAll('.section-reveal, .section-reveal-child');
  for (var i = 0; i < allReveals.length; i++) {
    AppState._scrollObserver.observe(allReveals[i]);
  }

  // 创建或更新滚动指示器
  setupScrollIndicator();
}

/**
 * 设置滚动指示器按钮
 */
function setupScrollIndicator() {
  var existing = document.getElementById('scrollIndicator');
  if (existing) return;

  var btn = document.createElement('button');
  btn.id = 'scrollIndicator';
  btn.className = 'scroll-down-indicator';
  btn.setAttribute('aria-label', '向下滚动');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
  btn.addEventListener('click', function () {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  });
  document.body.appendChild(btn);

  // 监听滚动以显示/隐藏指示器
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY || window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollY > 200 && scrollY < docHeight - 100) {
          btn.classList.add('scroll-down-indicator--visible');
        } else {
          btn.classList.remove('scroll-down-indicator--visible');
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
}

/**
 * 路由处理 — 根据当前路由渲染页面
 * @param {string} route - 路由路径
 */
var _routingInProgress = false;
var _pendingRoute = null;

function handleRoute(route) {
  // 路由重定向（用于合并相似模块，如 /review-deep → /wrongbook）
  var routeCfg = Routes[route];
  if (routeCfg && routeCfg.redirect) {
    if (typeof navigateTo === 'function') {
      navigateTo(routeCfg.redirect);
    } else if (typeof window.location !== 'undefined') {
      window.location.hash = '#' + routeCfg.redirect;
    }
    return;
  }

  // 防止递归调用导致栈溢出；同时把最新请求记下来，当前渲染结束后补跑
  if (_routingInProgress) {
    _pendingRoute = route;
    console.warn('[BioQuest] handleRoute 被递归调用，已暂存:', route);
    return;
  }
  _routingInProgress = true;
  _pendingRoute = null;

  AppState.currentRoute = route;
  updatePageTitle(route);
  updateNavActive(route);

  var target = AppState.rootElement || document.getElementById('page-content');
  if (!target) {
    _routingInProgress = false;
    _flushPendingRoute();
    return;
  }

  // 清除旧状态
  target.classList.remove('animate-fade-out', 'animate-fade-in-up', 'page-content--home');
  target.style.opacity = '';
  target.style.transform = '';
  target.style.pointerEvents = '';
  target.style.visibility = '';

  // 延迟加载对应模块 — 动态加载 JS 文件
  var moduleMap = {
    '/practice': 'practice',
    '/photo-quiz': 'photo-quiz',
    '/exam': 'exam',
    '/analytics': 'analytic',
    '/user': 'user',
    '/admin': 'admin',
    '/community': 'community',
    '/knowledge-graph': 'knowledge-graph',
    '/diagnosis': 'smart-diagnosis',
    '/pomodoro': 'pomodoro',
    '/habits': 'habits',
    '/review': 'review',
    '/bounties': 'bounty',
    '/wrongbook': 'wrongbook',
    '/review-deep': 'review-deep',
    '/study': 'study',
    '/bio-animation': 'bio-animation',
    '/dashboard': 'dashboard',
    '/tutor': 'tutor',
    '/discussion': 'discussion',
    '/bio-lab': 'bio-lab',
    '/trends': 'trends',
    '/teacher': 'teacher'
  };
  var modName = moduleMap[route];

  var renderFn = function() {
    doRouteRender(route, target);
  };

  function finishRouting() {
    _routingInProgress = false;
    _flushPendingRoute();
  }

  function showModuleError(modName, err) {
    console.error('[BioQuest] 模块加载失败:', modName, err);
    target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
      '<p style="color:var(--color-error);font-size:1.1rem;margin-bottom:8px;">模块加载失败</p>' +
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">' + escapeHtml(err && err.message ? err.message : '请检查网络或刷新页面重试') + '</p>' +
      '<button onclick="location.reload()" style="padding:8px 20px;background:var(--color-sage);color:#fff;border:none;border-radius:8px;cursor:pointer;">刷新页面</button>' +
      '</div>';
  }

  if (modName && typeof window.loadModule === 'function') {
    window.loadModule(modName).then(function() {
      // 模块脚本执行后，再次确认初始化函数确实已暴露
      var initFnName = {
        '/practice': 'initPractice',
        '/photo-quiz': 'initPhotoQuiz',
        '/exam': 'initExam',
        '/analytics': 'initAnalytics',
        '/user': 'initUser',
        '/admin': 'initAdmin',
        '/community': 'initCommunity',
        '/knowledge-graph': 'initKnowledgeGraph',
        '/diagnosis': 'initSmartDiagnosis',
        '/pomodoro': 'initPomodoro',
        '/habits': 'initHabits',
        '/review': 'initReview',
        '/bounties': 'initBounties',
        '/wrongbook': 'initWrongbook',
        '/review-deep': 'initReviewDeep',
        '/study': 'initStudy',
        '/bio-animation': 'initBioAnimation',
        '/dashboard': 'initDashboard',
        '/tutor': 'initTutor',
        '/discussion': 'initDiscussion',
        '/bio-lab': 'initBioLab',
        '/trends': 'initTrends',
        '/teacher': 'initTeacher'
      }[route];
      if (initFnName && typeof window[initFnName] !== 'function') {
        // 给脚本一个微任务时间完成初始化
        setTimeout(function() {
          renderFn();
          finishRouting();
        }, 50);
        return;
      }
      renderFn();
      finishRouting();
    }).catch(function(err) {
      showModuleError(modName, err);
      finishRouting();
    });
  } else {
    renderFn();
    finishRouting();
  }
}

function _flushPendingRoute() {
  if (_pendingRoute && _pendingRoute !== AppState.currentRoute) {
    var r = _pendingRoute;
    _pendingRoute = null;
    handleRoute(r);
  }
}

/**
 * 动态加载 JS 模块文件
 * 特性：并发去重、失败重试、超时保护、子目录自适应
 */
var _loadedModules = {};
var _loadingModules = {};

function _resolveModuleUrl(modName) {
    // 适配子目录部署：取当前页面最后一个 js/app.js 的目录作为基路径
    var base = '';
    var scripts = document.querySelectorAll('script[src*="js/app.js"]');
    if (scripts.length > 0) {
      var src = scripts[scripts.length - 1].src;
      base = src.substring(0, src.lastIndexOf('/js/app.js'));
      if (base) base += '/';
    }
    return base + 'js/' + modName + '.js?v=20260628i';
  }

// 模块依赖表：加载某模块前先加载其依赖
var _moduleDeps = {
  'practice': ['question-utils', 'loader'],
  'exam': ['question-utils', 'loader'],
  'review': ['question-utils', 'loader'],
  'wrongbook': ['question-utils', 'loader', 'review-deep'],
  'review-deep': ['question-utils', 'loader']
};

window.loadModule = function(modName, options) {
  options = options || {};
  if (_loadedModules[modName]) return Promise.resolve();
  if (_loadingModules[modName]) return _loadingModules[modName];

  // 先加载依赖模块
  var deps = _moduleDeps[modName] || [];
  var depsPromise = deps.length > 0
    ? Promise.all(deps.map(function(d) { return window.loadModule(d, options); }))
    : Promise.resolve();

  _loadingModules[modName] = depsPromise.then(function() {
    var maxRetries = options.maxRetries || 2;
    var timeoutMs = options.timeout || 15000;
    return new Promise(function(resolve, reject) {
    var attempt = 0;
    var script = null;
    var timer = null;

    function cleanup() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    function onSuccess() {
      cleanup();
      _loadedModules[modName] = true;
      delete _loadingModules[modName];
      resolve();
    }

    function onFailure(err) {
      cleanup();
      attempt++;
      if (attempt <= maxRetries) {
        setTimeout(loadOnce, 300 * attempt);
      } else {
        delete _loadingModules[modName];
        reject(err || new Error('Failed to load module: ' + modName));
      }
    }

    function loadOnce() {
      script = document.createElement('script');
      script.src = _resolveModuleUrl(modName);
      script.async = true;

      timer = setTimeout(function() {
        timer = null;
        onFailure(new Error('加载模块超时: ' + modName));
      }, timeoutMs);

      script.onload = onSuccess;
      script.onerror = function() {
        onFailure(new Error('加载模块失败: ' + modName));
      };

      document.head.appendChild(script);
    }

    loadOnce();
    });
  });

  return _loadingModules[modName];
};

var _doRouteRenderCount = 0;

/**
 * 渲染模块初始化错误提示
 */
function _renderModuleError(target, route, err) {
  try {
    target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
      '<p style="color:var(--color-error);font-size:1.1rem;margin-bottom:8px;">页面加载失败</p>' +
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">' +
      escapeHtml((err && err.message) ? err.message : '模块初始化异常，请刷新页面重试') +
      '</p>' +
      '<button onclick="location.reload()" style="padding:8px 20px;background:var(--color-sage);color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:8px;">刷新页面</button>' +
      '<button onclick="window.location.hash=\'/\'" style="padding:8px 20px;background:transparent;border:1px solid var(--color-sage);color:var(--color-sage);border-radius:8px;cursor:pointer;">返回首页</button>' +
      '</div>';
  } catch (e2) { /* ignore */ }
}

/**
 * 安全调用模块初始化函数
 */
function _safeInit(initFnName, route, target) {
  if (typeof window[initFnName] === 'function') {
    try {
      window[initFnName](target);
    } catch (err) {
      console.error('[BioQuest] 模块初始化失败:', route, initFnName, err);
      _renderModuleError(target, route, err);
    }
  } else {
    console.error('[BioQuest] 模块初始化函数未找到:', route, initFnName);
    _renderModuleError(target, route, new Error('模块初始化函数未找到: ' + initFnName));
  }
}

function doRouteRender(route, target) {
  _doRouteRenderCount++;
  if (_doRouteRenderCount > 2) {
    var recErr = new Error('[BioQuest] doRouteRender 递归检测! count=' + _doRouteRenderCount + ' route=' + route);
    console.error(recErr.stack);
    _doRouteRenderCount--;
    return;
  }
  try {
    // 权限检查（仅用于需要登录才能查看的页面；社区允许游客浏览，发帖/评论在社区模块内部校验）
    var routePermissions = {
      '/exam': 'guest',
      '/practice': 'guest',
      '/community': 'guest',
      '/analytics': 'verified'
    };
    var requiredGroup = routePermissions[route];
    if (requiredGroup && typeof hasPermission === 'function' && !hasPermission(requiredGroup)) {
      var groupLabels = { admin: '管理员', premium: '高级会员', verified: '认证会员', member: '普通会员', guest: '访客' };
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
        '<div style="font-size:48px;margin-bottom:16px;opacity:0.3;">需要登录</div>' +
        '<h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">权限不足</h2>' +
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">此功能需要【' + (groupLabels[requiredGroup] || requiredGroup) + '】及以上权限</p>' +
        '<button onclick="window.showAuthModal && window.showAuthModal()" style="background:var(--color-sage);color:#fff;border:none;padding:10px 24px;border-radius:20px;cursor:pointer;">升级权限</button>' +
        '</div>';
      return;
    }

    switch (route) {
      case '/':
        target.classList.add('page-content--home');
        if (AppState._homeHTML) {
          target.innerHTML = AppState._homeHTML;
          reinitHomeComponents();
        }
        break;
      case '/practice':
        _safeInit('initPractice', route, target);
        break;
      case '/photo-quiz':
        _safeInit('initPhotoQuiz', route, target);
        break;
      case '/exam':
        _safeInit('initExam', route, target);
        break;
      case '/analytics':
        _safeInit('initAnalytics', route, target);
        break;
      case '/user':
        _safeInit('initUser', route, target);
        break;
      case '/search':
        renderSearchPage();
        break;
      case '/admin':
        _safeInit('initAdmin', route, target);
        break;
      case '/cards':
        renderCardsPage();
        break;
      case '/community':
        _safeInit('initCommunity', route, target);
        break;
      case '/leaderboard':
        renderLeaderboardPage(target);
        break;
      case '/knowledge-graph':
        _safeInit('initKnowledgeGraph', route, target);
        break;
      case '/diagnosis':
        _safeInit('initSmartDiagnosis', route, target);
        break;
      case '/pomodoro':
        _safeInit('initPomodoro', route, target);
        break;
      case '/habits':
        _safeInit('initHabits', route, target);
        break;
      case '/review':
        _safeInit('initReview', route, target);
        break;
      case '/bounties':
        _safeInit('initBounties', route, target);
        break;
      case '/wrongbook':
        _safeInit('initWrongbook', route, target);
        break;
      case '/review-deep':
        _safeInit('initReviewDeep', route, target);
        break;
      case '/study':
        _safeInit('initStudy', route, target);
        break;
      case '/bio-animation':
        _safeInit('initBioAnimation', route, target);
        break;
      case '/dashboard':
        _safeInit('initDashboard', route, target);
        break;
      case '/tutor':
        _safeInit('initTutor', route, target);
        break;
      case '/discussion':
        _safeInit('initDiscussion', route, target);
        break;
      case '/bio-lab':
        _safeInit('initBioLab', route, target);
        break;
      case '/trends':
        _safeInit('initTrends', route, target);
        break;
      case '/teacher':
        _safeInit('initTeacher', route, target);
        break;
      case '/reset-password':
        renderResetPasswordPage(target);
        break;
      default:
        target.classList.add('page-content--home');
        if (AppState._homeHTML) {
          target.innerHTML = AppState._homeHTML;
          reinitHomeComponents();
        }
    }

    // 非首页路由添加页面进入动画
    if (route !== '/') {
      target.classList.add('page-enter');
      target.addEventListener('animationend', function handler() {
        target.classList.remove('page-enter');
        target.removeEventListener('animationend', handler);
      });
    }

    // 更新底部标签栏高亮
    updateBottomTabBar(route);
  } catch (err) {
    console.error('[BioQuest] 路由渲染错误:', route, err);
    try {
      target.innerHTML = '<div style="text-align:center;padding:64px 24px;"><p style="color:var(--color-error);">页面加载失败，请刷新重试</p><p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px;">路由: ' + route + '</p></div>';
    } catch (e2) { /* ignore */ }
  } finally {
    _doRouteRenderCount--;
  }
}

/**
 * 主题切换
 * @param {string} [theme] - 目标主题，不传则在 light/dark 之间切换
 */
function toggleTheme(theme) {
  const current = AppState.theme;
  let nextTheme;

  if (theme === 'light' || theme === 'dark') {
    nextTheme = theme;
  } else {
    nextTheme = current === 'light' ? 'dark' : 'light';
  }

  AppState.theme = nextTheme;

  if (nextTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  if (typeof saveSetting === 'function') {
    saveSetting('theme', nextTheme);
  } else {
    try {
      localStorage.setItem('bioquest-theme', nextTheme);
    } catch (e) {
    }
  }

  const themeIcons = document.querySelectorAll('.theme-toggle');
  themeIcons.forEach((btn) => {
    btn.setAttribute('aria-label', nextTheme === 'dark' ? '切换浅色模式' : '切换深色模式');
    btn.setAttribute('title', nextTheme === 'dark' ? '切换浅色模式' : '切换深色模式');
  });
}

window.toggleTheme = toggleTheme;

/**
 * 汉堡菜单切换
 */
function toggleMobileMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileOverlay');

  if (!hamburger || !mobileNav || !overlay) return;

  const isActive = hamburger.classList.contains('active');

  if (isActive) {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * 关闭汉堡菜单
 */
function closeMobileMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileOverlay');

  if (hamburger) {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  if (mobileNav) mobileNav.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * 绑定全局事件
 */
function bindEvents() {
  window.addEventListener('hashchange', () => {
    const route = getRouteFromHash();
    handleRoute(route);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (link) {
      const route = link.getAttribute('data-route');
      if (route && Routes[route]) {
        e.preventDefault();
        const target = AppState.rootElement || document.getElementById('page-content');
        if (target) {
          target.setAttribute('data-page-transition', 'exiting');
        }
        navigateTo(route);
        closeMobileMenu();
        return;
      }
    }

    if (e.target.closest('#themeToggle') || e.target.closest('#themeToggleMobile')) {
      e.preventDefault();
      toggleTheme();
      return;
    }

    if (e.target.closest('#hamburgerBtn')) {
      e.preventDefault();
      toggleMobileMenu();
      return;
    }

    if (e.target.closest('#mobileOverlay') || e.target.closest('#mobileNavClose')) {
      closeMobileMenu();
      return;
    }

    // 排行榜按钮点击处理
    if (e.target.closest('#nav-leaderboard-btn-desktop') || e.target.closest('#nav-leaderboard-btn')) {
      e.preventDefault();
      if (typeof showLeaderboard === 'function') showLeaderboard();
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      if (typeof closeLeaderboard === 'function') closeLeaderboard();
    }
  });
}

/**
 * 延迟加载页面模块脚本
 * @param {string} moduleName - 模块名称
 * @returns {Promise<void>}
 */
async function loadPageModule(moduleName) {
  if (AppState.pageModules[moduleName]) {
    return;
  }

  try {
    const module = await import(`./${moduleName}.js`);
    AppState.pageModules[moduleName] = module;
  } catch (err) {
    console.warn(`[BioQuest] 模块 ${moduleName} 加载失败:`, err.message);
  }
}

/**
 * 恢复用户设置
 */
function restoreSettings() {
  try {
    if (typeof loadSetting === 'function') {
      const theme = loadSetting('theme', 'light');
      const fontSize = loadSetting('fontSize', 'medium');
      const questionCount = loadSetting('questionCount', 30);
      const showTimer = loadSetting('showTimer', true);
      const autoSubmit = loadSetting('autoSubmit', false);

      AppState.userSettings = { fontSize, questionCount, showTimer, autoSubmit };
      toggleTheme(theme);
    } else {
      const theme = localStorage.getItem('bioquest-theme') || 'light';
      if (theme === 'dark') {
        toggleTheme('dark');
      }
    }
  } catch (e) {
    console.warn('[BioQuest] 设置恢复失败:', e);
  }
}

/**
 * 诊断后端 API 连通性（暴露到全局供调试）
 */
window.testSupabaseAPI = async function() {
  console.log('[Test] 正在测试 Supabase 连通性...');
  try {
    var sb = typeof window.getSupabase === 'function' ? window.getSupabase() : null;
    if (!sb) { console.log('[Test] Supabase 客户端未初始化'); return { status: 'error', msg: 'Supabase 未初始化' }; }
    var { data, error } = await sb.from('profiles').select('id,username').limit(1);
    if (error) { console.log('[Test] 查询失败:', error.message); return { status: 'error', msg: error.message }; }
    console.log('[Test] 连接成功! 数据:', data);
    return { status: 'ok', data: data };
  } catch (err) {
    console.log('[Test] 异常:', err.message);
    return { status: 'error', msg: err.message };
  }
};

/**
 * 初始化 Supabase 云端同步
 * 先动态加载 supabase 相关脚本（首屏不加载，节省 ~140KB）
 */
async function initSupabase() {
  try {
    // 等待 Supabase SDK 加载完成（由 HTML 中的 requestIdleCallback 触发加载）
    var sdkWait = 0;
    while (typeof window.supabase === 'undefined' && sdkWait < 10000) {
      await new Promise(function(r) { setTimeout(r, 200); });
      sdkWait += 200;
    }
    if (typeof window.supabase === 'undefined') {
      console.warn('[BioQuest] Supabase SDK 加载超时，使用本地模式');
      showStorageStatus('local');
      updateAuthUI();
      return;
    }

    // 动态加载 supabase 相关脚本（按依赖顺序）
    var v = '20260621m';
    var supabaseScripts = [
      __jsBase + 'js/supabase-client.js?v=' + v,
      __jsBase + 'js/supabase.js?v=' + v,
      __jsBase + 'js/storage.js?v=' + v
    ];
    await __loadScriptChain(supabaseScripts);
    console.log('[BioQuest] Supabase 脚本加载完成');

    // 先检测 API 基地址
    if (typeof initApi === 'function') {
      await initApi();
    }

    // 恢复会话 —— 注意 await！restoreSession 是 async 函数
    var restored = await restoreSession();
    if (restored) {
      var user = getCurrentUser();
      console.log('[BioQuest] 已恢复登录会话:', user ? user.email : 'unknown');
      showStorageStatus('cloud');
      updateAuthUI();
      await mergeCloudData();
      return;
    }

    // 尝试恢复游客会话
    if (typeof restoreGuestSession === 'function' && restoreGuestSession()) {
      console.log('[BioQuest] 已恢复游客会话');
      showStorageStatus('local');
      updateAuthUI();
      return;
    }

    // 未登录用户使用本地存储
    showStorageStatus('local');
  } catch (e) {
    console.warn('[BioQuest] Supabase 初始化失败，使用本地模式:', e.message);
    showStorageStatus('local');
  }
  updateAuthUI();
}

/**
 * 更新认证 UI
 */
function updateAuthUI() {
  var authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;

  if (isLoggedIn()) {
    var user = getCurrentUser();
    var groupLabels = { admin: '管理员', premium: '高级会员', verified: '认证会员', member: '会员', guest: '访客' };
    var groupLabel = groupLabels[user.user_group] || '会员';
    var displayName = user.display_name || user.username || '用户';
    var isGuest = user.isGuest || user.user_group === 'guest';
    // 头像：优先 getAvatarUrl()，无头像时用首字母兜底
    var avatarUrl = (typeof getAvatarUrl === 'function') ? getAvatarUrl() : null;
    var initial = displayName.charAt(0).toUpperCase();
    var avatarHtml;
    if (avatarUrl) {
      avatarHtml = '<img src="' + avatarUrl + '" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;">';
    } else {
      avatarHtml = '<span style="width:24px;height:24px;border-radius:50%;background:var(--color-warm,#c4956a);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;flex-shrink:0;">' + initial + '</span>';
    }
    authBtn.innerHTML = avatarHtml + '<span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + displayName + '</span> <span style="font-size:0.7rem;opacity:0.7;">' + groupLabel + '</span>';
    authBtn.style.cssText = 'background: var(--color-deep, #1a3a2a); color: #fff; border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px; max-width: 240px;';
    authBtn.onclick = function() {
      navigateTo('/user');
    };
    authBtn.title = groupLabel + (isGuest ? ' · 点击进入用户中心（可升级为正式会员）' : ' · 点击进入用户中心');
  } else {
    authBtn.textContent = '登录';
    authBtn.style.cssText = 'background: linear-gradient(135deg, #3a8c5c, #2d6a47); color: #fff; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.85rem;';
    authBtn.onclick = showAuthModal;
    authBtn.title = '登录/注册 BioQuest 账号';
  }
}

/**
 * 显示登录注册弹窗 — Tab 切换设计
 */
function showAuthModal(mode) {
  var existing = document.getElementById('auth-modal');
  if (existing) {
    existing.classList.add('visible');
    if (mode === 'register') authSwitchToRegister();
    else authSwitchToLogin();
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.className = 'auth-modal-overlay';
  overlay.innerHTML = `
    <div class="auth-container" id="auth-container">
      <button class="auth-close-btn" onclick="closeAuthModal()" title="关闭">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="auth-tabs" id="auth-tabs">
        <span class="auth-tab-indicator" id="auth-tab-indicator"></span>
        <button class="auth-tab active" id="auth-tab-login" onclick="authSwitchToLogin()">登录</button>
        <button class="auth-tab" id="auth-tab-register" onclick="authSwitchToRegister()">注册</button>
        <button class="auth-tab" id="auth-tab-forgot" onclick="authSwitchToForgot()">找回密码</button>
      </div>
      <div class="auth-form-panel active" id="auth-form-login">
        <h2 class="auth-form-title">欢迎回来</h2>
        <p class="auth-form-sub">登录你的 BioQuest 账号继续探索</p>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
          <input type="text" class="auth-input" id="auth-login-username" placeholder="用户名 / 邮箱" autocomplete="username">
        </div>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" class="auth-input" id="auth-login-password" placeholder="密码" autocomplete="current-password">
        </div>
        <div class="auth-form-extra">
          <a href="javascript:void(0)" onclick="authSwitchToForgot()">忘记密码？</a>
        </div>
        <button type="button" class="auth-btn" onclick="handleLogin();return false">登 录</button>
        <p class="auth-error" id="auth-login-error"></p>
        <div style="text-align:center;margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">
          <div class="auth-field">
            <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input type="password" class="auth-input" id="auth-guest-password" placeholder="设置密码（可选，用于找回账号）" autocomplete="new-password">
          </div>
          <button type="button" class="auth-btn-guest" onclick="handleGuestLogin();return false" style="background:linear-gradient(135deg,#c4956a,#d4a574);border:none;color:#1a2f1d;padding:10px 20px;border-radius:20px;cursor:pointer;font-size:0.9rem;font-weight:600;width:100%;transition:all 0.2s;box-shadow:0 2px 8px rgba(196,149,106,0.3);"
            onmouseenter="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 14px rgba(196,149,106,0.45)';"
            onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(196,149,106,0.3)';">
            🚀 游客登录（无需注册）
          </button>
        </div>
        <div style="text-align:center;margin-top:6px;">
          <a href="#/admin" onclick="closeAuthModal()" class="auth-link" style="font-size:0.72rem;">管理员入口</a>
        </div>
      </div>
      <div class="auth-form-panel" id="auth-form-register">
        <h2 class="auth-form-title">创建账号</h2>
        <p class="auth-form-sub">加入 BioQuest 开启生物学习之旅</p>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
          <input type="text" class="auth-input" id="auth-register-username" placeholder="用户名" autocomplete="username">
        </div>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7-4-4"/></svg>
          <input type="email" class="auth-input" id="auth-register-email" placeholder="邮箱（必填）" autocomplete="email" required>
        </div>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <input type="text" class="auth-input" id="auth-register-name" placeholder="昵称（选填）" autocomplete="nickname">
        </div>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" class="auth-input" id="auth-register-password" placeholder="密码（至少6位）" autocomplete="new-password">
        </div>
        <button type="button" class="auth-btn" onclick="handleRegister();return false">注 册</button>
        <p class="auth-error" id="auth-register-error"></p>
        <p id="auth-register-debug" style="font-size:0.65rem;color:#889;text-align:center;margin:4px 0;line-height:1.5;word-break:break-all;display:none;"></p>
      </div>
      <div class="auth-form-panel" id="auth-form-forgot">
        <h2 class="auth-form-title">重置密码</h2>
        <p class="auth-form-sub">输入注册邮箱，我们将发送重置链接</p>
        <div class="auth-field">
          <svg class="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7-4-4"/></svg>
          <input type="email" class="auth-input" id="auth-forgot-email" placeholder="注册邮箱" autocomplete="email">
        </div>
        <button type="button" class="auth-btn" onclick="handleForgotPassword();return false">发送重置邮件</button>
        <p class="auth-error" id="auth-forgot-error"></p>
        <div style="text-align:center;margin-top:10px;">
          <a href="javascript:void(0)" onclick="authSwitchToLogin()" class="auth-link">返回登录</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeAuthModal();
  });

  setTimeout(function() { overlay.classList.add('visible'); }, 10);
  if (mode === 'register') setTimeout(authSwitchToRegister, 20);
  else setTimeout(updateAuthTabIndicator, 20);
}

/**
 * 关闭登录弹窗
 */
function closeAuthModal() {
  var modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('visible');
}

/**
 * 切换到登录表单
 */
function authSwitchToLogin() {
  setActiveAuthTab('auth-tab-login', 'auth-form-login');
}
function authSwitchToRegister() {
  setActiveAuthTab('auth-tab-register', 'auth-form-register');
}
function authSwitchToForgot() {
  setActiveAuthTab('auth-tab-forgot', 'auth-form-forgot');
}

function updateAuthTabIndicator() {
  var indicator = document.getElementById('auth-tab-indicator');
  var container = document.getElementById('auth-tabs');
  var activeTab = container ? container.querySelector('.auth-tab.active') : null;
  if (indicator && container && activeTab) {
    var cr = container.getBoundingClientRect();
    var tr = activeTab.getBoundingClientRect();
    indicator.style.left = (tr.left - cr.left) + 'px';
    indicator.style.width = tr.width + 'px';
  }
}

function setActiveAuthTab(tabId, panelId) {
  // Tabs
  document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
  var tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  // Panels
  document.querySelectorAll('.auth-form-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  // Sliding indicator
  var indicator = document.getElementById('auth-tab-indicator');
  var container = document.getElementById('auth-tabs');
  if (indicator && container && tab) {
    var cr = container.getBoundingClientRect();
    var tr = tab.getBoundingClientRect();
    indicator.style.left = (tr.left - cr.left) + 'px';
    indicator.style.width = tr.width + 'px';
  }
}

/**
 * 处理忘记密码
 */
async function handleForgotPassword() {
  // 确保 supabase 脚本已加载
  if (typeof resetPassword !== 'function') {
    try { await initSupabase(); } catch(e) { /* ignore */ }
  }
  var email = document.getElementById('auth-forgot-email').value.trim();
  var errorEl = document.getElementById('auth-forgot-error');

  if (!email) {
    errorEl.textContent = '请输入邮箱地址';
    return;
  }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorEl.textContent = '请输入有效的邮箱地址';
    return;
  }

  var btn = document.querySelector('#auth-form-forgot .auth-btn');
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '发送中...';
  }
  errorEl.textContent = '';
  try {
    var result = await resetPassword(email);
    if (btn) { btn.disabled = false; btn.textContent = '发送重置邮件'; }

    if (result && result.ok) {
      var forgotForm = document.getElementById('auth-form-forgot');
      if (forgotForm) {
        forgotForm.innerHTML = '<div style="text-align:center;padding:20px 0;">' +
          '<div style="font-size:2rem;margin-bottom:12px;">&#9993;</div>' +
          '<h3 style="font-size:1.1rem;margin-bottom:8px;color:var(--color-sage,#3a8c5c);">重置邮件已发送</h3>' +
          '<p style="font-size:0.85rem;color:var(--text-secondary,#8a8a8a);line-height:1.6;margin-bottom:12px;">' +
            '密码重置邮件已发送至 <strong>' + escapeHtml(email) + '</strong><br>' +
            '请点击邮件中的链接设置新密码。<br>' +
            '<span style="font-size:0.78rem;opacity:0.7;">（如未收到，请检查垃圾邮件箱）</span>' +
          '</p>' +
          '<button onclick="authSwitchToLogin()" ' +
            'style="background:var(--color-sage,#3a8c5c);color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:0.85rem;margin-top:8px;">' +
            '返回登录</button>' +
        '</div>';
      }
    } else {
      errorEl.textContent = (result && result.error) || '发送失败，请稍后重试';
    }
  } catch (e) {
    console.error('[BioQuest] handleForgotPassword 异常:', e);
    errorEl.textContent = '发送异常: ' + (e.message || String(e));
  }
}

/**
 * 处理登录
 */
async function handleLogin() {
  // 确保 supabase 脚本已加载
  if (typeof loginUser !== 'function') {
    try { await initSupabase(); } catch(e) { /* ignore */ }
  }
  var username = document.getElementById('auth-login-username').value.trim();
  var password = document.getElementById('auth-login-password').value;
  var errorEl = document.getElementById('auth-login-error');

  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码';
    return;
  }

  // 客户端冷却检查
  if (errorEl) {
    var cooldown = checkAuthCooldown('login');
    if (cooldown.blocked) {
      errorEl.textContent = '登录尝试过于频繁，请 ' + cooldown.remaining + ' 秒后再试';
      return;
    }
  }

  var btn = document.querySelector('#auth-form-login .auth-btn');
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '登录中...';
  }
  errorEl.textContent = '';
  try {
    var result = await loginUser(username, password);
    console.log('[BioQuest] loginUser result:', result);

    if (result && result.ok) {
      setAuthCooldown('login');
      closeAuthModal();
      showStorageStatus('cloud');
      updateAuthUI();
      if (typeof _setCurrentUser === 'function') _setCurrentUser(result.user);
      await mergeCloudData();
      var uname = (result.user || {}).username || '用户';
      console.log('[BioQuest] 登录成功:', uname);
    } else {
      errorEl.textContent = (result && result.error) || '登录失败';
    }
  } catch (e) {
    console.error('[BioQuest] handleLogin 异常:', e);
    errorEl.textContent = '登录异常: ' + (e.message || String(e));
  }
  if (btn) { btn.disabled = false; btn.textContent = '登 录'; }
}

/**
 * 游客登录
 */
async function handleGuestLogin() {
  if (typeof guestLogin !== 'function') {
    var errorEl = document.getElementById('auth-login-error');
    if (errorEl) errorEl.textContent = '系统未就绪，请刷新页面后重试';
    return;
  }

  var password = (document.getElementById('auth-guest-password') || {}).value || null;
  var errorEl = document.getElementById('auth-login-error');

  // 检查是否存在已有的游客会话
  var existingSession = null;
  try {
    existingSession = JSON.parse(localStorage.getItem('bioquest_guest_session') || 'null');
  } catch (e) {}

  var result;
  if (existingSession && existingSession.username && password) {
    // 已有游客会话，验证密码后恢复
    if (typeof guestLoginWithPassword === 'function') {
      result = guestLoginWithPassword(existingSession.username, password);
    } else {
      result = guestLogin(password);
    }
  } else {
    result = guestLogin(password);
  }

  if (result && result.ok) {
    closeAuthModal();
    showStorageStatus('local');
    updateAuthUI();
    if (typeof showToast === 'function') {
      showToast('已作为游客登录，数据保存在本地');
    }
  } else if (result && result.error) {
    if (errorEl) errorEl.textContent = result.error;
  }
}

/**
 * 检查注册/登录操作冷却时间
 * @returns {boolean} true 表示在冷却期内
 */
function checkAuthCooldown(action) {
  try {
    var key = 'bioquest_cooldown_' + action;
    var lastAttempt = parseInt(localStorage.getItem(key) || '0', 10);
    var now = Date.now();
    var cooldowns = { register: 30000, login: 15000, resetPassword: 60000 };
    var cooldownMs = cooldowns[action] || 30000;
    var elapsed = now - lastAttempt;
    if (elapsed < cooldownMs) {
      return { blocked: true, remaining: Math.ceil((cooldownMs - elapsed) / 1000) };
    }
    return { blocked: false, remaining: 0 };
  } catch (e) {
    return { blocked: false, remaining: 0 };
  }
}

/**
 * 更新认证操作的冷却时间戳（仅在操作成功时调用）
 */
function setAuthCooldown(action) {
  try {
    var key = 'bioquest_cooldown_' + action;
    localStorage.setItem(key, String(Date.now()));
  } catch (e) { /* 静默 */ }
}

/**
 * 处理注册
 */
async function handleRegister() {
  // 确保 supabase 脚本已加载
  if (typeof registerUser !== 'function') {
    try { await initSupabase(); } catch(e) { /* ignore */ }
  }
  var username = document.getElementById('auth-register-username').value.trim();
  var email = document.getElementById('auth-register-email').value.trim();
  var displayName = document.getElementById('auth-register-name').value.trim();
  var password = document.getElementById('auth-register-password').value;
  var errorEl = document.getElementById('auth-register-error');

  console.log('[BioQuest] 点击注册按钮', { username: username, email: email, displayName: displayName, hasPassword: !!password });

  // 客户端冷却检查
  if (errorEl) {
    var cooldown = checkAuthCooldown('register');
    if (cooldown.blocked) {
      errorEl.textContent = '操作过于频繁，请 ' + cooldown.remaining + ' 秒后再试';
      return;
    }
  }

  if (!username || !password || !email) {
    errorEl.textContent = '请填写用户名、邮箱和密码';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = '密码至少6位';
    return;
  }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorEl.textContent = '请输入有效的邮箱地址';
    return;
  }

  if (typeof registerUser !== 'function') {
    errorEl.textContent = '系统未就绪，请刷新页面后重试';
    console.error('[BioQuest] registerUser 函数未定义！');
    return;
  }

  // 防止重复提交
  var btn = document.querySelector('#auth-form-register .auth-btn');
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '注册中...';
  }
  errorEl.textContent = '';

  try {
    var result = await registerUser(username, password, displayName, email);
    console.log('[BioQuest] registerUser result:', result);
  } catch (e) {
    console.error('[BioQuest] handleRegister 异常:', e);
    errorEl.textContent = '注册异常: ' + (e.message || String(e));
    if (btn) { btn.disabled = false; btn.textContent = '注 册'; }
    return;
  }

  // 恢复按钮
  if (btn) { btn.disabled = false; btn.textContent = '注 册'; }

  if (result && result.ok) {
    setAuthCooldown('register');
    if (result.needEmailConfirm) {
      var formBox = document.getElementById('auth-form-register');
      if (formBox) {
        formBox.innerHTML = '<div style="text-align:center;padding:20px 0;">' +
          '<div style="font-size:2rem;margin-bottom:12px;">&#9993;</div>' +
          '<h3 style="font-size:1.1rem;margin-bottom:8px;color:var(--color-sage,#3a8c5c);">验证邮件已发送</h3>' +
          '<p style="font-size:0.85rem;color:var(--text-secondary,#8a8a8a);line-height:1.6;margin-bottom:12px;">' +
            '验证邮件已发送至 <strong>' + escapeHtml(email) + '</strong><br>' +
            '请点击邮件中的链接完成验证后即可登录。<br>' +
            '<span style="font-size:0.78rem;opacity:0.7;">（如未收到，请检查垃圾邮件箱）</span>' +
          '</p>' +
          '<button id="resend-email-btn" onclick="handleResendEmail(\'' + escapeHtml(email) + '\')" ' +
            'style="background:transparent;border:1px solid var(--color-sage,#3a8c5c);color:var(--color-sage,#3a8c5c);padding:8px 20px;border-radius:20px;cursor:pointer;font-size:0.85rem;margin-bottom:8px;">' +
            '重新发送验证邮件</button>' +
          '<p id="resend-email-status" style="font-size:0.78rem;color:var(--text-muted,#8a8a8a);min-height:1.2em;"></p>' +
          '<button onclick="closeAuthModal();showAuthModal(\'login\')" ' +
            'style="background:var(--color-sage,#3a8c5c);color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:0.85rem;margin-top:8px;">' +
            '前往登录</button>' +
        '</div>';
      }
      return;
    }
    closeAuthModal();
    showStorageStatus('cloud');
    updateAuthUI();
    if (typeof _setCurrentUser === 'function') _setCurrentUser(result.user);
    var uname = (result.user || {}).username || '用户';
    console.log('[BioQuest] 注册成功:', uname);
  } else {
    // 不显示调试信息，只显示用户友好的错误提示
    var rawError = (result && result.error) || '注册失败';
    if (rawError.indexOf('after') !== -1 && rawError.indexOf('seconds') !== -1) {
      errorEl.textContent = '操作太频繁，请稍等片刻后再试';
    } else {
      errorEl.textContent = rawError;
    }
  }
}

window.updateAuthUI = updateAuthUI;
window.showAuthModal = showAuthModal;
window.handleLogin = handleLogin;
window.handleGuestLogin = handleGuestLogin;
window.handleRegister = handleRegister;

/**
 * 重发验证邮件
 */
async function handleResendEmail(email) {
  var statusEl = document.getElementById('resend-email-status');
  var btn = document.getElementById('resend-email-btn');
  if (statusEl) statusEl.textContent = '发送中...';
  if (btn) btn.disabled = true;

  var result = await resendConfirmationEmail(email);
  if (result.ok) {
    if (statusEl) statusEl.textContent = '验证邮件已重新发送';
    if (statusEl) statusEl.style.color = 'var(--color-sage,#3a8c5c)';
  } else {
    if (statusEl) statusEl.textContent = result.error || '发送失败，请稍后重试';
    if (statusEl) statusEl.style.color = 'var(--color-error,#e53e3e)';
    if (btn) btn.disabled = false;
  }
  // 60秒冷却
  setTimeout(function() {
    if (btn) btn.disabled = false;
    if (statusEl) statusEl.textContent = '';
  }, 60000);
}
window.handleResendEmail = handleResendEmail;
window.closeAuthModal = closeAuthModal;
window.authSwitchToLogin = authSwitchToLogin;
window.authSwitchToRegister = authSwitchToRegister;
window.authSwitchToForgot = authSwitchToForgot;
window.handleForgotPassword = handleForgotPassword;
window.showLeaderboard = showLeaderboard;
window.switchLbTab = switchLbTab;

/** 当前排行榜 tab */
var _currentLbTab = 'bio';

/**
 * 显示排行榜弹窗（三 tab 版本：Bio 分 / 练习量 / 正确率）
 */
async function showLeaderboard() {
  // 关闭移动端菜单
  if (typeof closeMobileMenu === 'function') closeMobileMenu();

  var existing = document.getElementById('leaderboard-modal');
  if (existing) {
    existing.classList.add('visible');
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = 'leaderboard-modal';
  overlay.className = 'leaderboard-overlay';
  overlay.innerHTML = `
    <div class="leaderboard-box">
      <button class="lb-close" onclick="closeLeaderboard()">&times;</button>
      <div class="lb-header">
        <div class="lb-title">排行榜</div>
        <div class="lb-tabs">
          <button class="lb-tab active" id="lb-tab-bio" onclick="switchLbTab('bio')">Bio 分</button>
          <button class="lb-tab" id="lb-tab-practice" onclick="switchLbTab('practice')">练习量</button>
          <button class="lb-tab" id="lb-tab-checkin" onclick="switchLbTab('checkin')">签到</button>
        </div>
      </div>
      <div class="lb-body" id="lb-list">
        <div class="lb-loading">加载中...</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeLeaderboard();
  });

  setTimeout(function() { overlay.classList.add('visible'); }, 10);

  _currentLbTab = 'bio';
  await loadLbData('bio');
}

/**
 * 切换排行榜 tab
 */
async function switchLbTab(tabName) {
  if (!tabName || tabName === _currentLbTab) return;
  _currentLbTab = tabName;

  var tabs = ['bio', 'practice', 'checkin'];
  for (var i = 0; i < tabs.length; i++) {
    var btn = document.getElementById('lb-tab-' + tabs[i]);
    if (btn) btn.classList.toggle('active', tabs[i] === tabName);
  }

  await loadLbData(tabName);
}

/**
 * 加载排行榜数据
 */
async function loadLbData(tabName) {
  var listEl = document.getElementById('lb-list') || document.querySelector('.lb-body');
  if (!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">加载中...</div>';

  // 未登录直接提示，不再本地降级
  if (typeof window.isLoggedIn !== 'function' || !window.isLoggedIn()) {
    listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">请先登录后查看全国排行<br><button onclick="window.showAuthModal && window.showAuthModal()" style="margin-top:12px;padding:8px 22px;border:none;border-radius:18px;background:var(--color-sage,#5a7d5c);color:#fff;font-size:0.86rem;cursor:pointer;">立即登录</button></div>';
    return;
  }

  try {
    var items = [];
    if (typeof window.getLeaderboard === 'function') {
      items = await window.getLeaderboard(tabName, 20);
    }

    if (items && items.length > 0) {
      var myRank = items._myRank;
      listEl.innerHTML = renderLbItems(items, tabName) + (myRank ? renderMyRank(myRank) : '');
    } else {
      listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">暂无排行数据<br><span style="font-size:0.78rem;color:#8a8a8a;">完成练习后即可上榜</span></div>';
    }
  } catch (err) {
    if (listEl) {
      listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">排行榜数据暂不可用<br><span style="font-size:0.78rem;color:#8a8a8a;">' + (err && err.message ? err.message : '请稍后重试') + '</span></div>';
    }
  }
}

// 本地排行榜降级（无网络/未登录时用本地数据）
function _generateLocalLeaderboard(tabName) {
  try {
    var history = JSON.parse(localStorage.getItem('bioquest_history') || '[]');
    var stats = JSON.parse(localStorage.getItem('bioquest_stats') || '{}');
    var myScore = stats.bio_score || 0;
    var myAnswered = stats.total_answered || history.length;
    var myStreak = stats.current_streak || 0;
    var myName = (typeof getCurrentUser === 'function' && getCurrentUser())
      ? (getCurrentUser().display_name || getCurrentUser().username || '我')
      : '我';

    // 构造几个虚拟对手 + 自己
    var bots = [
      { name: '生物小达人', score: Math.max(85, myScore + 5), answered: myAnswered + 12, streak: Math.max(7, myStreak + 1) },
      { name: '细胞分裂侠', score: Math.max(78, myScore - 2), answered: Math.max(10, myAnswered - 5), streak: Math.max(3, myStreak - 1) },
      { name: 'DNA探索者', score: Math.max(72, myScore - 8), answered: Math.max(8, myAnswered - 10), streak: Math.max(2, myStreak - 2) },
      { name: '光合作用师', score: Math.max(68, myScore - 12), answered: Math.max(5, myAnswered - 15), streak: 1 }
    ];
    var me = { name: myName, score: myScore, answered: myAnswered, streak: myStreak, isMe: true };
    var all = bots.concat([me]);

    // 按排序
    if (tabName === 'practice') {
      all.sort(function(a, b) { return b.answered - a.answered; });
    } else if (tabName === 'checkin') {
      all.sort(function(a, b) { return b.streak - a.streak; });
    } else {
      all.sort(function(a, b) { return b.score - a.score; });
    }

    return all.map(function(p, i) {
      return {
        rank: i + 1,
        display_name: p.name + (p.isMe ? '（我）' : ''),
        bio_score: p.score,
        total_answered: p.answered,
        current_streak: p.streak,
        accuracy: 0,
        grade: p.score >= 90 ? 'S' : p.score >= 80 ? 'A' : p.score >= 70 ? 'B' : p.score >= 60 ? 'C' : 'D'
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * 渲染排行榜列表项（无 emoji）
 */
function renderLbItems(items, tabName) {
  var scoreLabel = '';
  if (tabName === 'bio') {
    scoreLabel = 'Bio分';
  } else if (tabName === 'practice') {
    scoreLabel = '练习题数';
  } else if (tabName === 'checkin') {
    scoreLabel = '签到天数';
  } else {
    scoreLabel = '分数';
  }

  var html = '<div class="lb-table-header">' +
    '<span class="lb-col-rank">#</span>' +
    '<span class="lb-col-name">用户</span>' +
    '<span class="lb-col-score">' + scoreLabel + '</span>';
  if (tabName === 'bio' || tabName === 'checkin') {
    html += '<span class="lb-col-grade">等级</span>';
  }
  html += '</div>';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var rankClass = '';
    if (i === 0) rankClass = 'leaderboard-rank-1';
    else if (i === 1) rankClass = 'leaderboard-rank-2';
    else if (i === 2) rankClass = 'leaderboard-rank-3';

    var displayScore = '';
    if (tabName === 'practice') {
      displayScore = String(item.total_answered || item.practice_count || 0);
    } else if (tabName === 'checkin') {
      displayScore = String(item.total_checkins || item.current_streak || 0);
    } else {
      displayScore = String(item.bio_score || 0);
    }

    html += '<div class="leaderboard-item">' +
      '<span class="leaderboard-rank ' + rankClass + '">' + (item.rank || i + 1) + '</span>' +
      '<span class="leaderboard-name">' + escapeHtml(item.display_name || item.username || '匿名用户') + '</span>' +
      '<span class="leaderboard-score">' + displayScore + '</span>';
    if (tabName === 'bio' || tabName === 'checkin') {
      html += '<span class="leaderboard-grade">' + (item.grade || '-') + '</span>';
    }
    html += '</div>';
  }

  return html;
}

/**
 * 关闭排行榜弹窗
 */
function closeLeaderboard() {
  var modal = document.getElementById('leaderboard-modal');
  if (modal) modal.classList.remove('visible');
}
window.closeLeaderboard = closeLeaderboard;

/**
 * 渲染"我的位置"信息条
 */
function renderMyRank(rank) {
  return '<div style="text-align:center;padding:12px 20px;margin-top:16px;background:rgba(58,140,92,0.1);border-radius:10px;border:1px solid rgba(58,140,92,0.15);font-size:0.9rem;color:var(--color-sage,#3a8c5c);">' +
    '我的位置: <strong style="font-size:1.1rem;">#' + rank + '</strong>' +
  '</div>';
}

/**
 * 排行榜独立页面渲染（/leaderboard 路由）
 */
/**
 * 重置密码页面（从邮件链接跳转）
 */
function renderResetPasswordPage(target) {
  target.innerHTML = '<div style="max-width:400px;margin:60px auto;padding:32px 24px;background:var(--card-bg,#1a1f1c);border-radius:16px;border:1px solid rgba(58,140,92,0.15);">' +
    '<h2 style="text-align:center;font-size:1.2rem;margin-bottom:8px;color:var(--color-sage,#3a8c5c);">设置新密码</h2>' +
    '<p style="text-align:center;font-size:0.85rem;color:var(--text-secondary,#8a8a8a);margin-bottom:20px;">请输入您的新密码</p>' +
    '<input type="password" class="auth-input" id="reset-new-password" placeholder="新密码（至少6位）" autocomplete="new-password" style="margin-bottom:12px;width:100%;box-sizing:border-box;">' +
    '<input type="password" class="auth-input" id="reset-confirm-password" placeholder="确认新密码" autocomplete="new-password" style="margin-bottom:16px;width:100%;box-sizing:border-box;">' +
    '<button class="auth-btn" onclick="handleResetPasswordSubmit()">确认修改</button>' +
    '<p id="reset-password-error" class="auth-error"></p>' +
  '</div>';
}
window.renderResetPasswordPage = renderResetPasswordPage;

/**
 * 提交新密码
 */
async function handleResetPasswordSubmit() {
  var newPwd = document.getElementById('reset-new-password').value;
  var confirmPwd = document.getElementById('reset-confirm-password').value;
  var errorEl = document.getElementById('reset-password-error');

  if (!newPwd || newPwd.length < 6) {
    errorEl.textContent = '密码至少6位';
    return;
  }
  if (newPwd !== confirmPwd) {
    errorEl.textContent = '两次输入的密码不一致';
    return;
  }

  errorEl.textContent = '';
  var sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) {
    errorEl.textContent = '系统未初始化，请刷新页面';
    return;
  }

  try {
    var { error } = await sb.auth.updateUser({ password: newPwd });
    if (error) {
      errorEl.textContent = error.message.includes('same') ? '新密码不能与旧密码相同' : '修改失败：' + error.message;
      return;
    }
    var target = AppState.rootElement || document.getElementById('page-content');
    if (target) {
      target.innerHTML = '<div style="text-align:center;padding:80px 20px;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">&#10003;</div>' +
        '<h2 style="font-size:1.3rem;margin-bottom:8px;color:var(--color-sage,#3a8c5c);">密码修改成功</h2>' +
        '<p style="font-size:0.9rem;color:var(--text-secondary,#8a8a8a);margin-bottom:24px;">请使用新密码登录</p>' +
        '<button onclick="window.location.hash=\'/\'" style="background:var(--color-sage,#3a8c5c);color:#fff;border:none;padding:10px 24px;border-radius:20px;cursor:pointer;font-size:0.9rem;">返回首页</button>' +
      '</div>';
    }
  } catch (e) {
    errorEl.textContent = '修改失败，请稍后重试';
  }
}
window.handleResetPasswordSubmit = handleResetPasswordSubmit;

function renderLeaderboardPage(target) {
  target.innerHTML = '<div class="lb-page-container">' +
    '<div class="lb-page-header">' +
      '<h2 class="lb-page-title">排行榜</h2>' +
      '<div class="lb-tabs" id="lb-page-tabs">' +
        '<button class="lb-tab active" id="lb-page-tab-bio" onclick="switchLbPageTab(\'bio\')">Bio 分</button>' +
        '<button class="lb-tab" id="lb-page-tab-practice" onclick="switchLbPageTab(\'practice\')">练习量</button>' +
        '<button class="lb-tab" id="lb-page-tab-checkin" onclick="switchLbPageTab(\'checkin\')">签到</button>' +
      '</div>' +
    '</div>' +
    '<div class="lb-page-body" id="lb-page-list">' +
      '<div style="text-align:center;color:#6b7f74;padding:40px 0;">加载中...</div>' +
    '</div>' +
  '</div>';

  _currentLbTab = 'bio';
  loadLbPageData('bio');
}

var _currentLbPageTab = 'bio';

async function switchLbPageTab(tabName) {
  if (!tabName || tabName === _currentLbPageTab) return;
  _currentLbPageTab = tabName;

  var tabs = ['bio', 'practice', 'checkin'];
  for (var i = 0; i < tabs.length; i++) {
    var btn = document.getElementById('lb-page-tab-' + tabs[i]);
    if (btn) btn.classList.toggle('active', tabs[i] === tabName);
  }

  await loadLbPageData(tabName);
}

async function loadLbPageData(tabName) {
  var listEl = document.getElementById('lb-page-list');
  if (!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">加载中...</div>';

  // 未登录直接提示，不再本地降级
  if (typeof window.isLoggedIn !== 'function' || !window.isLoggedIn()) {
    listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">请先登录后查看全国排行<br><button onclick="window.showAuthModal && window.showAuthModal()" style="margin-top:12px;padding:8px 22px;border:none;border-radius:18px;background:var(--color-sage,#5a7d5c);color:#fff;font-size:0.86rem;cursor:pointer;">立即登录</button></div>';
    return;
  }

  try {
    var items = [];
    if (typeof window.getLeaderboard === 'function') {
      items = await window.getLeaderboard(tabName, 20);
    }

    if (items && items.length > 0) {
      var myRank = items._myRank;
      listEl.innerHTML = renderLbItems(items, tabName) + (myRank ? renderMyRank(myRank) : '');
    } else {
      listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">暂无排行数据<br><span style="font-size:0.78rem;color:#8a8a8a;">完成练习后即可上榜</span></div>';
    }
  } catch (err) {
    listEl.innerHTML = '<div style="text-align:center;color:#6b7f74;padding:40px 0;">排行榜数据暂不可用<br><span style="font-size:0.78rem;color:#8a8a8a;">' + (err && err.message ? err.message : '请稍后重试') + '</span></div>';
  }
}

window.renderLeaderboardPage = renderLeaderboardPage;
window.switchLbPageTab = switchLbPageTab;

function showStorageStatus(status) {
  var existing = document.getElementById('storage-status');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.id = 'storage-status';
  var labels = {
    syncing: { text: '云端同步中...', color: '#f59e0b' },
    cloud:   { text: '云端已连接',   color: '#22c55e' },
    local:   { text: '本地存储模式', color: '#94a3b8' }
  };
  var info = labels[status] || labels.local;
  el.style.cssText = [
    'position:fixed',
    'bottom:16px',
    'right:16px',
    'z-index:9999',
    'background:' + info.color,
    'color:#fff',
    'padding:6px 12px',
    'border-radius:20px',
    'font-size:12px',
    'font-weight:500',
    'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
    'pointer-events:none',
    'transition:opacity 0.3s'
  ].join(';');
  el.textContent = info.text;
  document.body.appendChild(el);

  if (status !== 'syncing') {
    setTimeout(function () {
      if (document.getElementById('storage-status') === el) {
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, 300);
      }
    }, 3000);
  }
}

/**
 * 从云端拉取数据合并到本地
 */
/**
 * 初始化应用 — 在 DOMContentLoaded 时执行
 */
function initApp() {
  if (AppState.initialized) {
    return;
  }

  restoreSettings();

  // 异步初始化 Supabase — 不阻塞页面首次渲染
  // 使用 requestIdleCallback 在空闲时初始化，确保首屏交互优先
  var _initSupabase = function() {
    initSupabase().catch(function(e) {
      console.warn('[BioQuest] Supabase 初始化失败，使用本地模式:', e.message);
      showStorageStatus('local');
      updateAuthUI();
    });
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(_initSupabase, { timeout: 5000 });
  } else {
    setTimeout(_initSupabase, 500);
  }

  const root = document.getElementById('page-content');
  if (!root) {
    console.error('[BioQuest] 找不到 #page-content 元素');
    return;
  }

  AppState.rootElement = root;
  AppState._homeHTML = root.innerHTML;
  AppState._countdownTimer = null;

  const route = getRouteFromHash();

  bindEvents();

  requestAnimationFrame(() => {
    handleRoute(route);
  });

  AppState.initialized = true;
  console.log('[BioQuest] 应用初始化完成，当前路由:', route);
}

function openDonation() {
  const styleId = 'bioquest-donation-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .donation-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(5, 10, 7, 0.75);
        backdrop-filter: blur(20px) saturate(180%);
        animation: donationFadeIn 0.25s ease;
      }

      .donation-overlay.closing {
        animation: donationFadeOut 0.2s ease forwards;
      }

      @keyframes donationFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes donationFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .donation-modal {
        position: relative;
        width: 90vw;
        max-width: 400px;
        max-height: 90vh;
        overflow-y: auto;
        background: #111613;
        border: 1px solid rgba(58, 140, 92, 0.2);
        border-radius: var(--radius-lg, 20px);
        padding: 36px 32px 28px;
        box-shadow: 0 0 30px rgba(58, 140, 92, 0.15),
                    0 20px 48px rgba(26, 42, 24, 0.25);
        animation: donationSlideUp 0.3s ease;
      }

      @keyframes donationSlideUp {
        from { opacity: 0; transform: translateY(24px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .donation-close {
        position: absolute;
        top: 12px;
        right: 14px;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        color: #e8e6e2;
        font-size: 1.4rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        line-height: 1;
      }
      .donation-close:hover {
        background: rgba(232, 168, 48, 0.2);
        color: #f5d491;
      }

      .donation-title {
        font-family: var(--font-serif, 'Noto Serif SC', serif);
        font-size: 1.45rem;
        font-weight: 700;
        color: #f5d491;
        text-align: center;
        margin-bottom: 16px;
        text-shadow: 0 0 12px rgba(232, 168, 48, 0.35);
      }

      .donation-desc {
        font-size: 0.95rem;
        color: #e8e6e2;
        text-align: center;
        line-height: 1.7;
        margin-bottom: 28px;
      }

      .donation-qr-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(232, 168, 48, 0.08);
        border: 1px solid rgba(232, 168, 48, 0.25);
        border-radius: var(--radius-md, 12px);
        margin-bottom: 20px;
      }

      .donation-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        border-radius: var(--radius-md, 12px);
        background: linear-gradient(135deg, #e8a830, #c4956a);
        color: #1a2f1d;
        font-weight: 700;
        font-size: 1rem;
        text-decoration: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 4px 16px rgba(232, 168, 48, 0.35);
      }
      .donation-link-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(232, 168, 48, 0.5);
      }
      .donation-link-btn svg {
        width: 22px;
        height: 22px;
        stroke-width: 2.5;
      }

      .donation-thanks {
        text-align: center;
        font-size: 0.95rem;
        font-weight: 600;
        color: #e8a830;
        text-shadow: 0 0 8px rgba(232, 168, 48, 0.35);
      }

      [data-theme="dark"] .donation-overlay {
        background: rgba(0, 0, 0, 0.75);
      }

      [data-theme="light"] .donation-modal {
        background: #1a2a1e;
      }
      [data-theme="light"] .donation-desc {
        color: #f0eee9;
      }
      [data-theme="light"] .donation-title {
        color: #f5d491;
      }

      @media (max-width: 480px) {
        .donation-modal {
          padding: 24px 20px 20px;
        }
        .donation-title {
          font-size: 1.25rem;
        }
        .donation-qr-img {
          width: 160px;
          height: 160px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.className = 'donation-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', '赞赏支持');

  overlay.innerHTML = `
    <div class="donation-modal">
      <button class="donation-close" aria-label="关闭">&times;</button>
      <div class="donation-title">赞赏支持</div>
      <div class="donation-desc">BioQuest 是开源免费的生物竞赛学习平台。如果您觉得这个项目有帮助，欢迎通过爱发电支持我们持续维护和更新。</div>
      <div class="donation-qr-area">
        <a href="https://ifdian.net/a/astrnox" target="_blank" rel="noopener noreferrer" class="donation-link-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          在爱发电支持我们
        </a>
      </div>
      <div class="donation-thanks">感谢您的支持！</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeDonation = () => {
    overlay.classList.add('closing');
    overlay.addEventListener('animationend', () => {
      overlay.remove();
      document.body.style.overflow = '';
    }, { once: true });
    document.removeEventListener('keydown', onKeydown);
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') closeDonation();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDonation();
  });

  overlay.querySelector('.donation-close').addEventListener('click', closeDonation);

  document.addEventListener('keydown', onKeydown);
}

// ============================================================
// 聚合搜索功能
// ============================================================

function showSearchModal(prefillQuery) {
  if (typeof navigateTo === 'function') {
    navigateTo('/search');
    setTimeout(function() {
      var input = document.getElementById('search-page-input');
      if (input && prefillQuery) {
        input.value = prefillQuery;
        var btn = document.getElementById('search-page-btn');
        if (btn) btn.click();
      }
    }, 200);
  }
}

function closeSearchModal() {
  // 兼容性保留空函数
}

window.openDonation = openDonation;
window.showSearchModal = showSearchModal;
window.closeSearchModal = closeSearchModal;
window.renderSearchPage = renderSearchPage;
window.searchLocalQuestions = searchLocalQuestions;
window.extractTags = extractTags;
window.handleRoute = handleRoute;
window.navigateTo = navigateTo;

// ============================================================
// 用户反馈系统
// ============================================================

/**
 * 显示反馈弹窗
 */
function showFeedbackModal() {
  var existing = document.getElementById('feedback-modal');
  if (existing) {
    existing.classList.add('visible');
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = 'feedback-modal';
  overlay.className = 'auth-modal-overlay';
  overlay.innerHTML = `
    <div class="auth-container" style="max-width:500px;">
      <button class="auth-close-btn" onclick="closeFeedbackModal()" title="关闭">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:24px 20px;">
        <h2 class="auth-form-title" style="margin-bottom:4px;">用户反馈</h2>
        <p class="auth-form-sub" style="margin-bottom:20px;">告诉我们你的想法，帮助我们改进 BioQuest</p>

        <div class="auth-field" style="margin-bottom:14px;">
          <label style="display:block;font-size:0.82rem;color:var(--text-secondary,#8a8a8a);margin-bottom:6px;">反馈类型</label>
          <select id="feedback-type" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:var(--text-primary,#e0e0e0);font-size:0.9rem;outline:none;">
            <option value="bug">Bug 报告</option>
            <option value="feature">功能建议</option>
            <option value="suggestion">其他建议</option>
          </select>
        </div>

        <div class="auth-field" style="margin-bottom:14px;">
          <label style="display:block;font-size:0.82rem;color:var(--text-secondary,#8a8a8a);margin-bottom:6px;">标题</label>
          <input type="text" id="feedback-title" class="auth-input" placeholder="简要描述你的反馈" style="width:100%;box-sizing:border-box;">
        </div>

        <div class="auth-field" style="margin-bottom:14px;">
          <label style="display:block;font-size:0.82rem;color:var(--text-secondary,#8a8a8a);margin-bottom:6px;">详细描述</label>
          <textarea id="feedback-description" class="auth-input" placeholder="请详细描述问题或建议..." style="width:100%;box-sizing:border-box;min-height:100px;resize:vertical;font-family:inherit;" rows="4"></textarea>
        </div>

        <div class="auth-field" style="margin-bottom:20px;">
          <label style="display:block;font-size:0.82rem;color:var(--text-secondary,#8a8a8a);margin-bottom:6px;">联系方式（选填）</label>
          <input type="text" id="feedback-contact" class="auth-input" placeholder="QQ/微信/邮箱，方便我们回复" style="width:100%;box-sizing:border-box;">
        </div>

        <button type="button" class="auth-btn" onclick="handleFeedbackSubmit();return false" style="width:100%;">提交反馈</button>
        <p class="auth-error" id="feedback-error" style="margin-top:8px;"></p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeFeedbackModal();
  });

  setTimeout(function() { overlay.classList.add('visible'); }, 10);
}

/**
 * 关闭反馈弹窗
 */
function closeFeedbackModal() {
  var modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.remove('visible');
}

/**
 * 提交反馈
 */
function handleFeedbackSubmit() {
  var type = document.getElementById('feedback-type').value;
  var title = document.getElementById('feedback-title').value.trim();
  var description = document.getElementById('feedback-description').value.trim();
  var contact = document.getElementById('feedback-contact').value.trim();
  var errorEl = document.getElementById('feedback-error');

  if (!title) {
    if (errorEl) errorEl.textContent = '请填写标题';
    return;
  }
  if (!description) {
    if (errorEl) errorEl.textContent = '请填写详细描述';
    return;
  }

  var currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  var feedback = {
    id: 'fb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: type,
    title: title,
    description: description,
    contact: contact || '',
    user: currentUser ? { id: currentUser.id, username: currentUser.username } : null,
    createdAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // 存储到 localStorage
  try {
    var existing = [];
    var raw = localStorage.getItem('bioquest_feedbacks');
    if (raw) existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
    existing.push(feedback);
    localStorage.setItem('bioquest_feedbacks', JSON.stringify(existing));
  } catch (e) {
    if (errorEl) {
      errorEl.textContent = '存储失败：' + (e.message || '未知错误');
      return;
    }
  }

  // 尝试发送到 Supabase（如果已登录）
  if (currentUser && !currentUser.isGuest) {
    try {
      var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
      if (sb) {
        sb.from('feedbacks').insert({
          type: type,
          title: title,
          description: description,
          contact: contact || '',
          user_id: currentUser.id,
          user_agent: navigator.userAgent
        }).then(function() { /* 静默 */ }).catch(function() { /* 静默 */ });
      }
    } catch (e) { /* 静默 */ }
  }

  closeFeedbackModal();
  if (typeof showToast === 'function') {
    showToast('感谢你的反馈！我们会认真查看每一条建议');
  }
}

/**
 * 显示 Toast 通知
 */
function showToast(message, duration) {
  var existing = document.getElementById('bioquest-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'bioquest-toast';
  toast.style.cssText = [
    'position:fixed',
    'bottom:80px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:99999',
    'background:rgba(26,58,42,0.95)',
    'color:#fff',
    'padding:12px 24px',
    'border-radius:24px',
    'font-size:0.9rem',
    'font-weight:500',
    'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
    'border:1px solid rgba(58,140,92,0.3)',
    'animation:toastSlideUp 0.3s ease',
    'max-width:90vw',
    'text-align:center',
    'pointer-events:none'
  ].join(';');
  toast.textContent = message;
  document.body.appendChild(toast);

  // 添加动画样式
  if (!document.getElementById('toast-style')) {
    var style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = '@keyframes toastSlideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@keyframes toastSlideDown{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(20px);opacity:0}}';
    document.head.appendChild(style);
  }

  setTimeout(function() {
    toast.style.animation = 'toastSlideDown 0.3s ease forwards';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration || 3000);
}

// 暴露到全局
window.showFeedbackModal = showFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', initApp);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  setTimeout(initApp, 0);
}