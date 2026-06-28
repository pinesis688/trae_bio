/**
 * ============================================================
 * BioQuest — Hero 粒子动画 "Cytoplasmic Drift"
 * ============================================================
 * 算法哲学：生命的流动
 *  - 粒子沿 Perlin 噪声流场漂移（模拟细胞质流动）
 *  - 粒子有生命周期，老化后于边缘重生（细胞生命周期）
 *  - 相邻粒子以 DNA 状连线连接（生物网络）
 *  - 鼠标交互：粒子向光标汇聚（趋化性）
 *  - Trae 设计色：鼠尾草绿 / 琥珀橙 / 橄榄 / 米色
 *  - 加性混合：粒子重叠处自然发光
 * ============================================================
 */

var __heroSketch = null;
var __heroSeed = 20260628;  // 固定种子，保证可复现

function initHeroSketch() {
  if (typeof p5 === 'undefined') {
    // p5.js 加载失败（CDN 阻断），使用纯 CSS 粒子动画兜底
    initHeroCSSFallback();
    return;
  }

  if (__heroSketch) {
    __heroSketch.remove();
    __heroSketch = null;
  }

  var container = document.getElementById('heroCanvas');
  if (!container || container.offsetWidth === 0) return;

  __heroSketch = new p5(function (p) {
    var particles = [];
    var flowField = [];
    var cols = 0, rows = 0;
    var SCALE = 22;          // 流场网格大小
    var NOISE_Z = 0;         // Perlin 噪声 z 轴（时间演化）
    var w = 1, h = 1;
    var mouse = { x: -9999, y: -9999, active: false };

    // Trae 设计色板（RGB 数组 + alpha）
    var PALETTE = [
      [90, 125, 92],     // 鼠尾草绿 --color-sage
      [196, 149, 106],   // 琥珀橙 --color-amber
      [139, 168, 136],   // 橄榄 --color-olive
      [212, 165, 116],   // 浅琥珀 --color-amber-light
      [58, 140, 92]      // 深绿 --color-success
    ];

    p.setup = function () {
      var c = p.createCanvas(1, 1);
      c.parent('heroCanvas');
      w = container.clientWidth || p.windowWidth;
      h = container.clientHeight || p.windowHeight;
      p.resizeCanvas(w, h);

      // 固定种子，保证粒子初始位置可复现
      p.randomSeed(__heroSeed);
      p.noiseSeed(__heroSeed);

      p.noStroke();
      p.frameRate(30);

      cols = Math.ceil(w / SCALE) + 1;
      rows = Math.ceil(h / SCALE) + 1;
      flowField = new Array(cols * rows);

      initParticles();
    };

    function initParticles() {
      particles = [];
      var count = Math.min(85, Math.floor((w * h) / 11000));
      for (var i = 0; i < count; i++) {
        particles.push(_spawnParticle(true));
      }
    }

    function _spawnParticle(initial) {
      var colorIdx = Math.floor(p.random(PALETTE.length));
      var isLarge = p.random() > 0.88;  // 12% 为"细胞"级大粒子
      return {
        x: initial ? p.random(w) : (p.random() < 0.5 ? -10 : w + 10),
        y: initial ? p.random(h) : p.random(h),
        vx: 0,
        vy: 0,
        px: 0,
        py: 0,
        r: isLarge ? p.random(3.5, 5.5) : p.random(1.5, 3),
        color: PALETTE[colorIdx],
        maxLife: p.random(180, 360),
        age: initial ? p.random(0, 180) : 0,
        isLarge: isLarge,
        phase: p.random(p.TWO_PI)
      };
    }

    p.draw = function () {
      p.clear();

      // === 1. 更新 Perlin 噪声流场 ===
      var yoff = 0;
      for (var y = 0; y < rows; y++) {
        var xoff = 0;
        for (var x = 0; x < cols; x++) {
          var angle = p.noise(xoff, yoff, NOISE_Z) * p.TWO_PI * 2;
          flowField[x + y * cols] = { x: Math.cos(angle), y: Math.sin(angle) };
          xoff += 0.12;
        }
        yoff += 0.12;
      }
      NOISE_Z += 0.0028;

      // === 2. 更新并绘制粒子 ===
      var t = p.millis() * 0.001;
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        pt.px = pt.x;
        pt.py = pt.y;

        // 采样流场力
        var col = Math.max(0, Math.min(cols - 1, Math.floor(pt.x / SCALE)));
        var row = Math.max(0, Math.min(rows - 1, Math.floor(pt.y / SCALE)));
        var force = flowField[col + row * cols];
        if (force) {
          pt.vx += force.x * 0.14;
          pt.vy += force.y * 0.14;
        }

        // 鼠标交互：趋化性（粒子向鼠标轻柔汇聚）
        if (mouse.active) {
          var dx = mouse.x - pt.x;
          var dy = mouse.y - pt.y;
          var distSq = dx * dx + dy * dy;
          if (distSq < 22500 && distSq > 100) {  // 150px 内吸引
            var dist = Math.sqrt(distSq);
            pt.vx += (dx / dist) * 0.35;
            pt.vy += (dy / dist) * 0.35;
          }
        }

        // 阻尼
        pt.vx *= 0.92;
        pt.vy *= 0.92;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.age++;

        // 边界处理：超出或老化则重生
        if (pt.x < -15 || pt.x > w + 15 || pt.y < -15 || pt.y > h + 15 || pt.age > pt.maxLife) {
          var np = _spawnParticle(false);
          particles[i] = np;
          continue;
        }

        // 计算 alpha（淡入淡出）
        var fadeIn = Math.min(1, pt.age / 30);
        var fadeOut = Math.min(1, (pt.maxLife - pt.age) / 40);
        var lifeAlpha = Math.min(fadeIn, fadeOut);
        var pulse = Math.sin(t * 1.5 + pt.phase) * 0.2 + 0.8;
        var alpha = 180 * lifeAlpha * pulse;

        // 大粒子绘制（带光晕）
        if (pt.isLarge) {
          p.noStroke();
          p.fill(pt.color[0], pt.color[1], pt.color[2], alpha * 0.25);
          p.circle(pt.x, pt.y, pt.r * 4.5);
          p.fill(pt.color[0], pt.color[1], pt.color[2], alpha * 0.6);
          p.circle(pt.x, pt.y, pt.r * 2);
        }

        // 粒子主体
        p.noStroke();
        p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
        p.circle(pt.x, pt.y, pt.r * 1.8);

        // 轨迹线（细线连接前后位置，形成流动感）
        if (pt.age > 3) {
          p.stroke(pt.color[0], pt.color[1], pt.color[2], alpha * 0.5);
          p.strokeWeight(pt.r * 0.4);
          p.line(pt.px, pt.py, pt.x, pt.y);
          p.noStroke();
        }
      }

      // === 3. 绘制 DNA 状连线（生物网络） ===
      var maxDist = 110;
      var maxDistSq = maxDist * maxDist;
      for (var i = 0; i < particles.length; i++) {
        var px = particles[i].x, py = particles[i].y;
        for (var j = i + 1; j < particles.length; j++) {
          var dx = px - particles[j].x;
          var dy = py - particles[j].y;
          var dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            var dist = Math.sqrt(dSq);
            // 连线强度随距离衰减，并加入正弦波动模拟 DNA 双螺旋呼吸
            var breathe = Math.sin(t * 0.8 + dist * 0.05) * 0.15 + 0.85;
            var a = p.map(dist, 0, maxDist, 50, 0) * breathe;
            p.stroke(90, 125, 92, a);
            p.strokeWeight(0.45);
            p.line(px, py, particles[j].x, particles[j].y);
          }
        }
      }
      p.noStroke();
    };

    p.mouseMoved = function () {
      if (p.mouseX >= 0 && p.mouseX <= w && p.mouseY >= 0 && p.mouseY <= h) {
        mouse.x = p.mouseX;
        mouse.y = p.mouseY;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    p.mouseOut = function () {
      mouse.active = false;
    };

    p.windowResized = function () {
      w = container.clientWidth || p.windowWidth;
      h = container.clientHeight || p.windowHeight;
      p.resizeCanvas(w, h);
      cols = Math.ceil(w / SCALE) + 1;
      rows = Math.ceil(h / SCALE) + 1;
      flowField = new Array(cols * rows);
      initParticles();
    };
  });
}

/* ---------- CSS 兜底动画（p5.js CDN 失败时使用） ---------- */
function initHeroCSSFallback() {
  var container = document.getElementById('heroCanvas');
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  var count = 35;
  for (var i = 0; i < count; i++) {
    var dot = document.createElement('div');
    var size = Math.random() * 5 + 2;
    var palette = [
      'rgba(90,125,92,0.6)',     // sage
      'rgba(196,149,106,0.6)',   // amber
      'rgba(139,168,136,0.55)',  // olive
      'rgba(212,165,116,0.55)'   // amber-light
    ];
    var color = palette[Math.floor(Math.random() * palette.length)];
    var isLarge = Math.random() > 0.85;
    if (isLarge) size *= 1.8;
    dot.style.cssText = [
      'position:absolute',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'border-radius:50%',
      'left:' + (Math.random() * 100) + '%',
      'top:' + (Math.random() * 100) + '%',
      'background:' + color,
      'animation:heroFloat ' + (Math.random() * 7 + 7) + 's ease-in-out infinite',
      'animation-delay:' + (Math.random() * -12) + 's',
      'pointer-events:none',
      'box-shadow:0 0 ' + (size * (isLarge ? 4 : 2)) + 'px ' + color
    ].join(';');
    container.appendChild(dot);
  }

  if (!document.getElementById('hero-fallback-style')) {
    var style = document.createElement('style');
    style.id = 'hero-fallback-style';
    style.textContent =
      '@keyframes heroFloat {' +
      '  0%,100% { transform: translate(0,0) scale(1); opacity:0.45; }' +
      '  33% { transform: translate(14px,-10px) scale(1.18); opacity:0.85; }' +
      '  66% { transform: translate(-10px,12px) scale(0.88); opacity:0.6; }' +
      '}';
    document.head.appendChild(style);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroSketch);
} else {
  setTimeout(initHeroSketch, 100);
}
