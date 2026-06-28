/**
 * ============================================================
 * BioQuest - Service Worker（离线缓存）
 * 基于 PWA 标准，完全免费，无需任何后端服务
 * ============================================================
 */

var CACHE_VERSION = 'bioquest-v1.0.0';
var CACHE_NAME = 'bioquest-cache-' + CACHE_VERSION;

// 预缓存核心资源（骨架页面）
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/globals.css',
  './css/home.css',
  './css/quiz.css',
  './css/analytics.css',
  './css/cards.css',
  './css/countdown.css',
  './js/app.js',
  './js/utils.js',
  './js/cards.js',
  './js/quiz.js',
  './js/exam.js',
  './js/fsrs-algorithm.js',
  './js/ai-diagnostic-engine.js',
  './js/analytic.js',
  './js/knowledge-graph.js',
  './js/pomodoro.js',
  './js/smart-diagnosis.js',
  './js/storage.js',
  './js/community.js',
  './data/cards.json',
  './data/quiz.json',
  './data/quiz_m1.json',
  './data/quiz_m2.json',
  './data/quiz_m3.json',
  './data/quiz_m4.json',
  './data/resources.json'
];

// ==================== 安装阶段：预缓存核心资源 ====================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(CORE_ASSETS).catch(function (err) {
          console.warn('[SW] 部分资源缓存失败:', err);
        });
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

// ==================== 激活阶段：清理旧缓存 ====================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (key) {
            return key.startsWith('bioquest-') && key !== CACHE_NAME;
          }).map(function (key) {
            return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// ==================== 请求拦截：Cache First + Network Fallback ====================
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  // 忽略非 http(s) 请求
  var url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 策略 1: 页面导航 - 网络优先，回退到离线页面
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request) || caches.match('./index.html');
        })
    );
    return;
  }

  // 策略 2: JSON 数据 - 网络优先，缓存回退
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request);
        })
    );
    return;
  }

  // 策略 3: CSS/JS - 缓存优先，网络更新
  if (url.pathname.match(/\.(css|js)$/i)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        var networkFetch = fetch(request).then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // 策略 4: 图片 - 缓存优先，永不更新
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        return cached || fetch(request).then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        }).catch(function () {
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
    return;
  }

  // 策略 5: 其他资源 - 缓存优先
  event.respondWith(
    caches.match(request).then(function (cached) {
      return cached || fetch(request).then(function (response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
        return response;
      }).catch(function () {
        return cached;
      });
    })
  );
});

// ==================== 消息处理：手动触发更新 ====================
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
