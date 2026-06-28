/**
 * BioQuest — Canvas 生物过程可视化（严谨审定版）
 * 覆盖：有丝分裂、减数分裂、DNA 复制、转录与翻译、光合作用、细胞呼吸、膜运输与动作电位
 * 每个流程均按生物学教材的步骤拆分，并标注关键分子/结构
 */
(function() {
  'use strict';

  /* ---------- 流程定义 ---------- */
  var _processes = {
    mitosis: {
      id: 'mitosis', name: '有丝分裂', desc: '真核细胞将间期复制后的染色体精确均分到两个子细胞中，保证遗传物质稳定传递。',
      steps: [
        { name: '间期（G₂ 末）', desc: 'DNA 已完成复制；中心体复制为两个；染色质尚未凝集，核膜核仁完整。' },
        { name: '前期', desc: '染色质螺旋化→可见含两条姐妹染色单体的染色体；核仁消失；中心体移向两极，星射线形成纺锤体。' },
        { name: '中期', desc: '核膜解体；纺锤丝连接染色体着丝粒；所有染色体着丝粒排列在赤道板（细胞中央假想平面）上。' },
        { name: '后期', desc: '着丝粒一分为二；姐妹染色单体分开成为独立染色体；纺锤丝缩短将染色体拉向两极。' },
        { name: '末期与胞质分裂', desc: '染色体解螺旋恢复染色质状态；核膜核仁重新出现；细胞膜中部缢裂，形成两个子细胞。' }
      ]
    },
    meiosis: {
      id: 'meiosis', name: '减数分裂', desc: '生殖细胞特有的两次连续分裂（MI + MII），产生染色体数减半且遗传组成各异的四个子细胞。',
      steps: [
        { name: '前期 I（联会与交叉互换）', desc: '同源染色体两两配对（联会）形成四分体；非姐妹染色单体间发生交叉互换，产生新的等位基因组合。' },
        { name: '中期 I', desc: '四分体排列在赤道板两侧；来自父方和母方的同源染色体随机朝向两极（自由组合定律的细胞学基础）。' },
        { name: '后期 I', desc: '同源染色体分离，分别移向两极；非同源染色体自由组合；姐妹染色单体仍由着丝粒相连。' },
        { name: '末期 I 与胞质分裂', desc: '核膜可短暂重建；细胞一分为二，各含 n 条染色体（每条仍由两条染色单体组成）。' },
        { name: '中期 II', desc: '染色体再次排列在赤道板上，纺锤体重新形成。' },
        { name: '后期 II', desc: '着丝粒分裂，姐妹染色单体分开并移向两极。' },
        { name: '末期 II', desc: '核膜重建，胞质分裂完成；四个单倍体子细胞（n）形成，遗传组成各不相同。' }
      ]
    },
    dna: {
      id: 'dna', name: 'DNA 半保留复制', desc: '以亲代两条链分别为模板，按碱基互补配对原则合成子链，每个子代 DNA 含一条母链和一条新链。',
      steps: [
        { name: '起始与解旋', desc: '复制起点被识别；解旋酶破坏氢键，双向解开双链形成两个复制叉；单链结合蛋白（SSB）稳定单链；拓扑异构酶释放超螺旋张力。' },
        { name: '引物合成', desc: '引物酶合成 ~10 nt 的 RNA 引物，为 DNA 聚合酶提供游离 3\'-OH。' },
        { name: '前导链连续合成', desc: 'DNA 聚合酶以 3\'→5\' 模板链为模板，沿 5\'→3\' 方向连续合成前导链。' },
        { name: '后随链不连续合成', desc: '在另一条模板链上，DNA 聚合酶以 5\'→3\' 方向合成若干冈崎片段；DNA 聚合酶 I 切除 RNA 引物并以 DNA 填补。' },
        { name: '连接与校对', desc: 'DNA 连接酶将冈崎片段连接成完整后随链；错配修复系统校对；最终两个子代 DNA 各含一条母链和一条新链。' }
      ]
    },
    transcription: {
      id: 'transcription', name: '转录与翻译', desc: '遗传信息从 DNA 经 mRNA 传递到蛋白质——基因表达的核心过程。',
      steps: [
        { name: '转录起始', desc: 'RNA 聚合酶结合启动子；DNA 局部解旋形成转录泡；以模板链（3\'→5\'）为模板合成互补 mRNA（5\'→3\'）。' },
        { name: '转录延伸', desc: 'RNA 聚合酶沿 DNA 移动，mRNA 链延伸；已转录的 DNA 重新形成双螺旋。' },
        { name: 'mRNA 加工（真核）', desc: '5\' 端加 7-甲基鸟苷帽、3\' 端加 poly-A 尾；剪接体切除内含子、连接外显子；成熟 mRNA 出核。' },
        { name: '翻译起始', desc: '核糖体小亚基识别 mRNA 5\' 帽并扫描至 AUG 起始密码子；起始 tRNA（Met）进入 P 位；大亚基结合。' },
        { name: '翻译延伸', desc: '氨酰-tRNA 按密码子-反密码子配对进入 A 位；肽酰转移酶（23S/28S rRNA）催化肽键形成；核糖体移位。' },
        { name: '翻译终止', desc: '释放因子（RF）识别终止密码子（UAA/UAG/UGA）；多肽链水解释放；核糖体大小亚基解离。' }
      ]
    },
    photosynthesis: {
      id: 'photosynthesis', name: '光合作用', desc: '光反应（类囊体膜）将光能转为化学能（ATP、NADPH），暗反应（基质）利用化学能固定 CO₂。',
      steps: [
        { name: '光能吸收与电荷分离', desc: '类囊体膜上的天线色素将光能传递至 PSII 反应中心 P680；P680 被激发释放高能电子，自身被水的电子还原。' },
        { name: '水的光解与电子传递', desc: 'PSII 的放氧复合体（OEC）裂解 2 H₂O → 4 H⁺ + 4 e⁻ + O₂↑；电子经 PQ → cyt b6f → PC 传递至 PSI。' },
        { name: 'NADPH 与 ATP 生成', desc: 'PSI 反应中心 P700 被激发；电子经 Fd → NADP⁺ 还原酶生成 NADPH；cyt b6f 泵出质子建立梯度，ATP 合酶合成 ATP。' },
        { name: 'CO₂ 固定（Calvin 循环）', desc: 'Rubisco 催化 1 CO₂ + 1 RuBP → 2 分子 3-PGA；每循环固定 3 CO₂ 净产 1 分子 G3P。' },
        { name: '还原与 RuBP 再生', desc: '3-PGA 被 ATP 磷酸化、NADPH 还原为 G3P；5/6 的 G3P 经系列反应再生 RuBP，1/6 的 G3P 输出合成葡萄糖。' }
      ]
    },
    respiration: {
      id: 'respiration', name: '细胞呼吸', desc: '细胞氧化分解有机物释放能量合成 ATP。分为糖酵解→丙酮酸氧化→TCA 循环→氧化磷酸化。',
      steps: [
        { name: '糖酵解（细胞质）', desc: '1 葡萄糖 + 2 NAD⁺ + 2 ADP + 2 Pi → 2 丙酮酸 + 2 NADH + 2 ATP（净）；不需氧。' },
        { name: '丙酮酸氧化（线粒体基质）', desc: '丙酮酸脱氢酶复合体催化：丙酮酸 + CoA + NAD⁺ → 乙酰-CoA + CO₂ + NADH。' },
        { name: '三羧酸循环（TCA / Krebs）', desc: '乙酰-CoA + 草酰乙酸 → 柠檬酸 → 经 8 步反应回草酰乙酸；每轮产 3 NADH + 1 FADH₂ + 1 GTP + 2 CO₂。' },
        { name: '电子传递链（线粒体内膜）', desc: 'NADH→复合体 I→Q→复合体 III→Cyt c→复合体 IV→O₂→H₂O；FADH₂→复合体 II→Q→…；电子传递同时将 H⁺ 泵至膜间隙。' },
        { name: '氧化磷酸化（ATP 合酶）', desc: 'H⁺ 顺梯度经 ATP 合酶（F₀F₁）回流基质，驱动 ADP + Pi → ATP；1 NADH ≈ 2.5 ATP，1 FADH₂ ≈ 1.5 ATP。' }
      ]
    },
    membrane: {
      id: 'membrane', name: '膜运输与动作电位', desc: '物质跨膜转运方式及神经细胞兴奋时膜电位的快速、可逆变化。',
      steps: [
        { name: '被动运输（自由扩散）', desc: 'O₂、CO₂、N₂ 及脂溶性小分子顺浓度梯度直接穿过磷脂双分子层，不耗能、不需载体。' },
        { name: '协助扩散（载体与通道）', desc: '葡萄糖经 GLUT 载体、水经水通道蛋白（AQP）、离子经离子通道顺电化学梯度转运，不耗 ATP。' },
        { name: '主动运输（钠钾泵）', desc: 'Na⁺-K⁺-ATPase 每水解 1 ATP 泵出 3 Na⁺、泵入 2 K⁺；维持膜内外 Na⁺/K⁺ 浓度梯度。' },
        { name: '静息电位', desc: '膜对 K⁺ 通透性较高，K⁺ 外流达平衡电位（~ -70 mV）；胞外 Na⁺ 高、胞内 K⁺ 高。' },
        { name: '去极化与反极化', desc: '阈上刺激→电压门控 Na⁺ 通道开放→Na⁺ 快速内流→膜电位上升至 +30~+40 mV。' },
        { name: '复极化与超极化', desc: 'Na⁺ 通道失活；电压门控 K⁺ 通道开放→K⁺ 外流→膜电位恢复并短暂超射（后超极化），随后 Na⁺/K⁺ 泵恢复离子分布。' }
      ]
    }
  };

  /* ---------- 全局状态 ---------- */
  var _state = {
    process: 'mitosis', step: 0, progress: 0, playing: false, speed: 1,
    zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0,
    lastTime: 0, animId: null, hotSpots: [], time: 0
  };

  /* ---------- 样式 ---------- */
  function _addStyles() {
    if (document.getElementById('bio-animation-styles')) return;
    var s = document.createElement('style');
    s.id = 'bio-animation-styles';
    s.textContent = '.ba-page{max-width:1200px;margin:0 auto;padding:20px}' +
      '.ba-header{text-align:center;margin-bottom:16px}' +
      '.ba-header h1{margin:0;color:var(--color-deep,#2c4a3b);font-family:"LXGW WenKai",var(--font-serif,serif);font-size:1.8rem;letter-spacing:0.5px;text-shadow:0 2px 4px rgba(0,0,0,0.05)}' +
      '.ba-header p{margin:6px 0 0;color:var(--text-muted,#888);font-size:.9rem;font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}' +
      '.ba-process-select{padding:8px 12px;border-radius:8px;border:1px solid #ddd;font-size:.95rem;background:var(--input-bg,#fff);color:var(--text-primary,#222);max-width:220px;font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '.ba-btn{padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;background:var(--color-sage,#5a7d5c);color:#fff;font-family:"LXGW WenKai",var(--font-sans,sans-serif);transition:all 0.2s ease;box-shadow:0 2px 8px rgba(90,125,92,0.2)}' +
      '.ba-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(90,125,92,0.3)}' +
      '.ba-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}' +
      '.ba-btn--secondary{background:#e5e7eb;color:#374151}' +
      '.ba-speed{display:flex;align-items:center;gap:6px;font-size:.85rem;color:var(--text-secondary,#555);font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-canvas-wrap{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#0b1a10 0%,#1a2f1d 100%);box-shadow:0 8px 32px rgba(0,0,0,.25),0 2px 8px rgba(0,0,0,.15)}' +
      '.ba-canvas{display:block;width:100%;height:560px;cursor:grab}.ba-canvas:active{cursor:grabbing}' +
      '.ba-info{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}' +
      '.ba-step-card{background:rgba(255,255,255,.98);border-radius:12px;padding:14px 18px;max-width:440px;box-shadow:0 4px 16px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.08);pointer-events:auto;border:1px solid rgba(90,125,92,0.1)}' +
      '.ba-step-title{font-weight:700;color:var(--color-deep,#2c4a3b);margin:0 0 6px;font-size:.95rem;font-family:"LXGW WenKai",var(--font-serif,serif)}' +
      '.ba-step-desc{font-size:.88rem;color:var(--text-secondary,#555);margin:0;line-height:1.6;font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-progress{position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,#5a7d5c,#7dbd7f);box-shadow:0 0 8px rgba(90,125,92,0.5)}' +
      '.ba-hint{text-align:center;color:var(--text-muted,#888);font-size:.85rem;margin-top:10px;font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-hotspot-card{position:absolute;background:rgba(15,35,20,.97);color:#fff;border-radius:10px;padding:10px 14px;font-size:.85rem;max-width:260px;pointer-events:none;display:none;z-index:10;border:1px solid rgba(167,243,208,.4);box-shadow:0 4px 12px rgba(0,0,0,0.3);backdrop-filter:blur(8px)}' +
      '.ba-hotspot-card h4{margin:0 0 4px;color:#a7f3d0;font-family:"LXGW WenKai",var(--font-serif,serif);font-size:0.9rem}' +
      '.ba-hotspot-card p{margin:0;line-height:1.5;font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;justify-content:center;font-size:.85rem;color:var(--text-secondary,#555);font-family:"LXGW WenKai",var(--font-sans,sans-serif)}' +
      '.ba-legend-item{display:flex;align-items:center;gap:6px}.ba-legend-dot{width:12px;height:12px;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2)}' +
      '@media(max-width:720px){.ba-canvas{height:400px}.ba-step-card{max-width:260px;padding:10px}.ba-step-desc{font-size:.8rem}.ba-process-select{max-width:160px}}';
    document.head.appendChild(s);
  }

  /* ---------- 工具函数 ---------- */
  function _ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function _lerp(a, b, t) { return a + (b - a) * t; }
  var _z = function(v) { return v * _state.zoom; };
  function _toWorldX(x, c) { return (x - c.width / 2 - _state.panX) / _state.zoom + c.width / 2; }
  function _toWorldY(y, c) { return (y - c.height / 2 - _state.panY) / _state.zoom + c.height / 2; }

  /* ---------- 通用绘图 ---------- */
  function _chr(ctx, x, y, rot, gap, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha || 1;
    ctx.strokeStyle = color; ctx.lineWidth = _z(5); ctx.lineCap = 'round';
    // 染色体发光效果
    ctx.shadowColor = color;
    ctx.shadowBlur = _z(6);
    ctx.beginPath(); ctx.moveTo(-gap, -_z(28)); ctx.quadraticCurveTo(-gap - _z(5), 0, -gap, _z(28)); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, _z(5), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(gap, -_z(28)); ctx.quadraticCurveTo(gap + _z(5), 0, gap, _z(28)); ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  function _cell(ctx, cx, cy, rx, ry, fill, stroke, split) {
    ctx.strokeStyle = stroke; ctx.lineWidth = _z(3); ctx.fillStyle = fill;
    // 添加细胞膜发光效果
    ctx.shadowColor = stroke;
    ctx.shadowBlur = _z(8);
    if (split > 0) {
      ctx.beginPath(); ctx.ellipse(cx - split, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + split, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.shadowColor = 'transparent';
  }

  function _nuke(ctx, cx, cy, rx, ry, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(200,200,255,0.7)'; ctx.lineWidth = _z(2);
    ctx.setLineDash([_z(6), _z(4)]); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  function _spindle(ctx, poles, targets) {
    ctx.strokeStyle = 'rgba(180,210,255,0.3)'; ctx.lineWidth = _z(1);
    poles.forEach(function(p) {
      targets.forEach(function(t) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      });
    });
  }

  function _lbl(ctx, x, y, text, bg) {
    ctx.font = 'bold ' + (_z(12) < 11 ? 11 : _z(12)) + 'px "LXGW WenKai",sans-serif';
    var tw = ctx.measureText(text).width;
    // 渐变背景
    var grad = ctx.createLinearGradient(x - tw / 2 - _z(8), y - _z(13), x + tw / 2 + _z(8), y + _z(9));
    grad.addColorStop(0, bg || 'rgba(0,0,0,0.65)');
    grad.addColorStop(1, bg || 'rgba(20,40,30,0.65)');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = _z(4);
    ctx.shadowOffsetY = _z(2);
    ctx.beginPath(); ctx.roundRect(x - tw / 2 - _z(8), y - _z(13), tw + _z(16), _z(22), _z(6)); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(text, x, y + _z(3));
  }

  function _arrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color; ctx.lineWidth = _z(2); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - _z(8) * Math.cos(ang - 0.5), y2 - _z(8) * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - _z(8) * Math.cos(ang + 0.5), y2 - _z(8) * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill();
  }

  /* ========== 1. 有丝分裂 ========== */
  function _drawMitosis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    var rx = _z(190), ry = _z(130);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var split = step === 4 ? _lerp(0, _z(40), t) : 0;
    _cell(ctx, cx, cy, rx, ry, 'rgba(90,125,92,0.1)', '#5a7d5c', split);

    // 核膜和核仁
    if (step <= 1) {
      var neAlpha = step === 0 ? 0.7 : _lerp(0.7, 0, t);
      _nuke(ctx, cx, cy, rx * 0.75, ry * 0.75, neAlpha);
      // 核仁（间期存在，前期消失）
      if (step === 0) {
        ctx.fillStyle = 'rgba(167,139,250,0.3)';
        ctx.beginPath(); ctx.arc(cx + _z(20), cy - _z(15), _z(12), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(167,139,250,0.5)';
        ctx.beginPath(); ctx.arc(cx + _z(20), cy - _z(15), _z(6), 0, Math.PI * 2); ctx.fill();
        _state.hotSpots.push({ x: cx + _z(20), y: cy - _z(15), r: _z(16), title: '核仁', text: '间期核仁明显，负责核糖体RNA的合成和核糖体亚基的组装。前期核仁消失。' });
      }
      if (step === 0) _state.hotSpots.push({ x: cx, y: cy, r: _z(80), title: '核膜', text: '间期核膜完整，染色质在核内。前期核膜开始解体。' });
    }
    if (step === 4) {
      _nuke(ctx, cx - split, cy, rx * 0.75, ry * 0.75, 0.5 + 0.3 * t);
      _nuke(ctx, cx + split, cy, rx * 0.75, ry * 0.75, 0.5 + 0.3 * t);
      // 末期核仁重建
      if (t > 0.6) {
        var nucleolusAlpha = (t - 0.6) / 0.4;
        ctx.fillStyle = 'rgba(167,139,250,' + (0.3 * nucleolusAlpha) + ')';
        ctx.beginPath(); ctx.arc(cx - split + _z(15), cy - _z(10), _z(10), 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + split - _z(15), cy - _z(10), _z(10), 0, Math.PI * 2); ctx.fill();
      }
    }

    // 中心体（间期已复制，位于细胞中心附近）
    var poleL = { x: cx - _z(30), y: cy };
    var poleR = { x: cx + _z(30), y: cy };
    if (step === 0) {
      // 间期：中心体刚复制完成，仍在细胞中心附近
      ctx.fillStyle = '#f472b6'; [poleL, poleR].forEach(function(p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, _z(6), 0, Math.PI * 2); ctx.fill();
      });
      _state.hotSpots.push({ x: poleL.x, y: poleL.y, r: _z(16), title: '中心体（已复制）', text: '间期中心体已完成复制，但仍位于细胞中心附近。前期将移向两极形成纺锤体。' });
    }
    // 前期开始向两极移动
    if (step >= 1) {
      poleL = { x: cx - rx + _z(15), y: cy };
      poleR = { x: cx + rx - _z(15), y: cy };
      var centrosomeX = step === 1 ? _lerp(_z(30), rx - _z(15), t) : rx - _z(15);
      ctx.fillStyle = '#f472b6';
      ctx.beginPath(); ctx.arc(cx - centrosomeX, cy, _z(6), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + centrosomeX, cy, _z(6), 0, Math.PI * 2); ctx.fill();
      // 星射线（微管）从中心体辐射
      if (step >= 1 && step <= 3) {
        ctx.strokeStyle = 'rgba(244,114,182,0.3)'; ctx.lineWidth = _z(1);
        for (var a = 0; a < 8; a++) {
          var ang = a * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(cx - centrosomeX, cy);
          ctx.lineTo(cx - centrosomeX + Math.cos(ang) * _z(25), cy + Math.sin(ang) * _z(25));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + centrosomeX, cy);
          ctx.lineTo(cx + centrosomeX + Math.cos(ang) * _z(25), cy + Math.sin(ang) * _z(25));
          ctx.stroke();
        }
      }
      if (step === 1) _state.hotSpots.push({ x: cx - centrosomeX, y: cy, r: _z(16), title: '中心体', text: '中心体移向两极，发射星射线（微管）形成纺锤体。' });
    }

    // 染色体
    var chrs = [
      { x: cx - _z(55), y: cy - _z(35), color: '#e8a830' },
      { x: cx + _z(45), y: cy - _z(25), color: '#e8a830' },
      { x: cx - _z(25), y: cy + _z(45), color: '#5eead4' },
      { x: cx + _z(65), y: cy + _z(35), color: '#5eead4' }
    ];
    var targets = [];
    chrs.forEach(function(chr, i) {
      var sx = chr.x, sy = chr.y, rot = 0, gap = _z(10), alpha = 1;
      if (step === 0) {
        // 间期：染色质细丝
        ctx.strokeStyle = chr.color; ctx.globalAlpha = 0.5; ctx.lineWidth = _z(2);
        ctx.beginPath(); ctx.moveTo(sx - _z(30), sy); ctx.bezierCurveTo(sx - _z(5), sy - _z(15), sx + _z(5), sy + _z(15), sx + _z(30), sy); ctx.stroke();
        ctx.globalAlpha = 1;
        gap = _z(2);
      } else if (step === 1) {
        gap = _lerp(_z(2), _z(10), t);
        rot = _lerp(0, Math.PI / 8 * (i % 2 ? 1 : -1), t);
      } else if (step === 2) {
        // 中期：着丝粒严格排列在赤道板(y=cy)上
        sx = _lerp(chr.x, cx + (i - 1.5) * _z(38), t);
        sy = _lerp(chr.y, cy, t);  // 着丝粒精确对齐赤道板
        rot = _lerp(Math.PI / 8 * (i % 2 ? 1 : -1), 0, t);
        _state.hotSpots.push({ x: cx + (i - 1.5) * _z(38), y: cy, r: _z(28), title: '中期染色体', text: '所有染色体的着丝粒精确排列在赤道板（细胞中央假想平面）上，动粒微管张力平衡。' });
      } else if (step === 3) {
        sx = cx + (i - 1.5) * _z(38); sy = cy;
        gap = _lerp(_z(10), _z(65), t);
        _state.hotSpots.push({ x: sx, y: sy, r: _z(30), title: '后期分离', text: '着丝粒分裂，姐妹染色单体成为独立染色体。' });
      } else if (step === 4) {
        var side = i < 2 ? -1 : 1;
        sx = _lerp(cx + (i - 1.5) * _z(38), cx + side * (_z(40) + (i % 2) * _z(25)), t);
        sy = _lerp(cy, cy + (i % 2 - 0.5) * _z(30), t);
        alpha = _lerp(1, 0.5, t);
      }
      targets.push({ x: sx, y: sy });
      if (step > 0) _chr(ctx, sx, sy, rot, gap, chr.color, alpha);
    });

    if (step >= 1 && step <= 3) _spindle(ctx, [poleL, poleR], targets);

    // 分裂沟
    if (step === 4 && t > 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.moveTo(cx, cy - ry * 0.5); ctx.lineTo(cx, cy + ry * 0.5); ctx.stroke();
    }

    ctx.restore();
  }

  /* ========== 2. 减数分裂 ========== */
  function _drawMeiosis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    var rx = _z(170), ry = _z(120);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var s1 = step >= 3 ? (step === 3 ? _lerp(0, _z(45), t) : _z(45)) : 0;
    var s2 = step >= 6 ? (step === 6 ? _lerp(_z(45), _z(95), t) : _z(95)) : 0;

    if (s2 > 0) {
      [-_z(95), -_z(32), _z(32), _z(95)].forEach(function(dx) {
        _cell(ctx, cx + dx, cy, rx * 0.55, ry * 0.72, 'rgba(90,125,92,0.08)', '#5a7d5c', 0);
      });
    } else if (s1 > 0) {
      _cell(ctx, cx - _z(45), cy, rx, ry, 'rgba(90,125,92,0.1)', '#5a7d5c', 0);
      _cell(ctx, cx + _z(45), cy, rx, ry, 'rgba(90,125,92,0.1)', '#5a7d5c', 0);
    } else {
      _cell(ctx, cx, cy, rx, ry, 'rgba(90,125,92,0.12)', '#5a7d5c', 0);
    }

    var pairs = [
      { p: { x: cx - _z(45), y: cy - _z(25), col: '#e8a830' }, m: { x: cx - _z(5), y: cy - _z(25), col: '#f6d365' } },
      { p: { x: cx + _z(25), y: cy + _z(25), col: '#5eead4' }, m: { x: cx + _z(65), y: cy + _z(25), col: '#a5f3fc' } }
    ];

    pairs.forEach(function(pair, idx) {
      var ax = pair.p.x, ay = pair.p.y, bx = pair.m.x, by = pair.m.y;
      var rA = 0, rB = 0, sX = 0, gap = _z(10);

      if (step === 0) {
        var mx = (ax + bx) / 2, my = (ay + by) / 2;
        ctx.save(); ctx.translate(mx - _z(12) + idx * _z(5), my); ctx.rotate(-0.18);
        _chr(ctx, 0, 0, 0, gap, pair.p.col, 1);
        ctx.restore();
        ctx.save(); ctx.translate(mx + _z(12) - idx * _z(5), my); ctx.rotate(0.18);
        _chr(ctx, 0, 0, 0, gap, pair.m.col, 1);
        ctx.restore();
        // 交叉互换：X 形交叉标记
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = _z(2);
        ctx.beginPath(); ctx.moveTo(mx - _z(6), my - _z(6)); ctx.lineTo(mx + _z(6), my + _z(6)); ctx.stroke();
        // 联会复合体虚线
        ctx.setLineDash([_z(3), _z(3)]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(mx - _z(4), my + _z(4)); ctx.lineTo(mx + _z(4), my - _z(4)); ctx.stroke();
        ctx.setLineDash([]);
        // 交叉互换结果：非姐妹染色单体片段交换（颜色混合）
        if (t > 0.5) {
          var swapAlpha = (t - 0.5) * 2;
          ctx.globalAlpha = swapAlpha * 0.5;
          ctx.fillStyle = pair.m.col; ctx.beginPath(); ctx.arc(mx - _z(8), my - _z(10), _z(4), 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = pair.p.col; ctx.beginPath(); ctx.arc(mx + _z(8), my + _z(10), _z(4), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        _state.hotSpots.push({ x: mx, y: my, r: _z(38), title: '四分体（联会复合体）', text: '同源染色体配对形成四分体，非姐妹染色单体交叉互换产生新等位基因组合。' });
        return;
      }
      if (step === 1) {
        ax = _lerp((ax + bx) / 2 - _z(18), cx + (idx - 0.5) * _z(80) - _z(18), t);
        bx = _lerp((ax + bx) / 2 + _z(18), cx + (idx - 0.5) * _z(80) + _z(18), t);
        ay = by = cy;
        rA = _lerp(-0.18, 0, t); rB = _lerp(0.18, 0, t);
      } else if (step === 2) {
        // 后期 I：同源染色体分离，姐妹染色单体仍相连
        // 初始位置在赤道板附近
        ax = cx + (idx - 0.5) * _z(80) - _z(18); bx = cx + (idx - 0.5) * _z(80) + _z(18);
        ay = by = cy;
        // 同源染色体向相反两极分离（演示独立分配：pair 0 父左母右，pair 1 父右母左）
        var dirA = idx === 0 ? -1 : 1;  // 父方染色体方向
        var dirB = -dirA;                // 母方染色体反方向
        ax = _lerp(ax, cx + dirA * _z(70) - _z(18), t);
        bx = _lerp(bx, cx + dirB * _z(70) + _z(18), t);
        _state.hotSpots.push({ x: cx, y: cy, r: _z(40), title: '同源染色体分离', text: 'MI 后期：同源染色体分开移向两极，非同源染色体自由组合（2ⁿ 种组合）。姐妹染色单体仍由着丝粒相连。' });
      } else if (step === 3 || step === 4) {
        // 末期 I 和 中期 II：染色体在两个子细胞中
        var side = idx === 0 ? -1 : 1;
        ax = cx + side * _z(45) - _z(18); bx = cx + side * _z(45) + _z(18); ay = by = cy;
      } else if (step === 5) {
        // 后期 II：着丝粒分裂，姐妹染色单体分开（增大分离距离）
        var side = idx === 0 ? -1 : 1;
        var cellX = cx + side * _z(45);
        gap = _lerp(_z(10), _z(55), t);
        ax = cellX - _z(18); bx = cellX + _z(18);
        ay = _lerp(cy, cy - _z(45), t);  // 增大到45像素
        by = _lerp(cy, cy + _z(45), t);  // 增大到45像素
        _state.hotSpots.push({ x: cellX, y: cy, r: _z(32), title: '后期 II', text: '着丝粒分裂，姐妹染色单体分开成为独立染色体，移向两极。' });
      } else if (step === 6) {
        // 末期 II：四个单倍体子细胞形成，染色体解螺旋
        // 每个子细胞只含有每个 pair 的 1 个染色单体（后期 II 已分离）
        var side = idx === 0 ? -1 : 1;
        ax = cx + side * _z(45) - _z(18); bx = cx + side * _z(45) + _z(18);
        ay = cy - _z(30); by = cy + _z(30);
        gap = _z(2);  // 染色质解螺旋
        // 标注单倍体数目 n
        if (t > 0.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold ' + _z(10) + 'px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('n', cx + side * _z(45), cy - _z(50));
        }
      }
      if (step === 6) {
        // 末期 II：每个子细胞只含 1 个染色单体（来自该 pair）
        // 父方染色单体进入左侧 2 个细胞，母方进入右侧 2 个细胞
        var cellOffset = idx === 0 ? -_z(32) : _z(32);
        ctx.save(); ctx.translate(ax, ay);
        ctx.strokeStyle = pair.p.col; ctx.lineWidth = _z(5); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -_z(28)); ctx.quadraticCurveTo(-_z(5), 0, 0, _z(28)); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, _z(5), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(bx, by);
        ctx.strokeStyle = pair.m.col; ctx.lineWidth = _z(5); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -_z(28)); ctx.quadraticCurveTo(-_z(5), 0, 0, _z(28)); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, _z(5), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.save(); ctx.translate(ax - sX, ay); ctx.rotate(rA); _chr(ctx, 0, 0, 0, gap, pair.p.col, 1); ctx.restore();
        ctx.save(); ctx.translate(bx + sX, by); ctx.rotate(rB); _chr(ctx, 0, 0, 0, gap, pair.m.col, 1); ctx.restore();
      }
    });
    ctx.restore();
  }

  /* ========== 3. DNA 半保留复制 ========== */
  function _drawDNA(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var baseColors = { a: '#f6ad55', t: '#5eead4', c: '#f472b6', g: '#a78bfa' };
    var pairs = ['a','t','c','g','g','c','t','a','c','g','a','t'];
    var bw = _z(32), startX = cx - (pairs.length * bw) / 2;
    var mid = (pairs.length - 1) / 2; // 5.5，复制起点（中心）
    var maxFork = _z(85);
    var forkFrac = step === 0 ? _lerp(0, 1, t) : 1; // 复制叉从中心向外扩展
    var unzip = step === 0 ? t : 1;

    // 双向复制泡：从中心向两侧打开
    // 两条母链：上链（3'→5'）、下链（5'→3'）
    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = _z(4);
    ctx.beginPath();
    var firstTopY = 0, firstBotY = 0;
    for (var i = 0; i < pairs.length; i++) {
      var px = startX + i * bw;
      var distFromCenter = Math.abs(i - mid);
      var forkRadius = Math.max(0.5, mid * forkFrac);
      var openness = Math.max(0, 1 - distFromCenter / forkRadius);
      var py = cy - maxFork * openness * unzip;
      if (i === 0) { firstTopY = py; ctx.moveTo(px, py); }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    _lbl(ctx, startX - _z(30), firstTopY, "3'", '#5eead4');
    _lbl(ctx, startX + pairs.length * bw + _z(30), firstTopY, "5'", '#5eead4');

    ctx.strokeStyle = '#e8a830';
    ctx.beginPath();
    for (var j = 0; j < pairs.length; j++) {
      var px2 = startX + j * bw;
      var distFromCenter2 = Math.abs(j - mid);
      var forkRadius2 = Math.max(0.5, mid * forkFrac);
      var openness2 = Math.max(0, 1 - distFromCenter2 / forkRadius2);
      var py2 = cy + maxFork * openness2 * unzip;
      if (j === 0) { firstBotY = py2; ctx.moveTo(px2, py2); }
      else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    _lbl(ctx, startX - _z(30), firstBotY, "5'", '#e8a830');
    _lbl(ctx, startX + pairs.length * bw + _z(30), firstBotY, "3'", '#e8a830');

    // 氢键（仅绘制未解链的碱基对）
    for (var k = 0; k < pairs.length; k++) {
      var bx = startX + k * bw;
      var distFromCenter3 = Math.abs(k - mid);
      var forkRadius3 = Math.max(0.5, mid * forkFrac);
      var openness3 = Math.max(0, 1 - distFromCenter3 / forkRadius3);
      if (openness3 < 0.15) { // 仅未解链区域绘制氢键
        var topY = cy - maxFork * openness3 * unzip;
        var botY = cy + maxFork * openness3 * unzip;
        ctx.strokeStyle = baseColors[pairs[k]]; ctx.lineWidth = _z(2);
        var hBonds = (pairs[k] === 'c' || pairs[k] === 'g') ? 3 : 2;
        for (var h = 0; h < hBonds; h++) {
          ctx.beginPath();
          ctx.moveTo(bx + _z(h * 3 - 3), topY + _z(6));
          ctx.lineTo(bx + _z(h * 3 - 3), botY - _z(6));
          ctx.stroke();
        }
      }
      _state.hotSpots.push({ x: bx, y: (cy - maxFork * openness3 * unzip + cy + maxFork * openness3 * unzip) / 2, r: _z(14), title: '碱基对 ' + pairs[k].toUpperCase(), text: 'A-T 形成 2 个氢键，G-C 形成 3 个氢键。' });
    }

    // 解旋酶（双向复制叉尖端）
    var leftForkIdx = mid - mid * forkFrac;
    var rightForkIdx = mid + mid * forkFrac;
    [leftForkIdx, rightForkIdx].forEach(function(fi) {
      if (fi >= 0 && fi < pairs.length) {
        var hx = startX + fi * bw;
        var distFC = Math.abs(fi - mid);
        var forkR = Math.max(0.5, mid * forkFrac);
        var open = Math.max(0, 1 - distFC / forkR);
        var hy = cy - maxFork * open * unzip * 0.5;
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(hx, hy, _z(10), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(8) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('解旋', hx, hy + _z(3));
      }
    });
    _state.hotSpots.push({ x: cx, y: cy, r: _z(20), title: '双向复制叉', text: '复制起点处解旋酶向两侧推进，形成复制泡。双向复制提高效率。' });

    // RNA 引物（step 1 显示引物合成）
    if (step === 1) {
      // 前导链引物（在上链 5' 端）
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(startX + _z(15), cy - maxFork * 0.8 + _z(10), _z(4), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, startX + _z(15), cy - maxFork * 0.8 - _z(8), 'RNA 引物', '#fbbf24');
      // 后随链引物（多个，在下链 3' 端）
      for (var rp = 0; rp < 3; rp++) {
        var rpx = startX + _z(80) + rp * _z(60);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(rpx, cy + maxFork * 0.7 - _z(10), _z(4), 0, Math.PI * 2); ctx.fill();
      }
      _state.hotSpots.push({ x: startX + _z(15), y: cy - maxFork * 0.8 + _z(10), r: _z(16), title: 'RNA 引物', text: '引物酶合成 ~10 nt 的 RNA 引物，为 DNA 聚合酶提供游离 3\'-OH 末端。' });
    }

    // 前导链（以 3'→5' 上链为模板，连续合成，紧邻上链下方）
    if (step >= 2) {
      var leadLen = Math.floor(pairs.length * (step === 2 ? t : 1));
      ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = _z(4);
      ctx.beginPath();
      for (var m = 0; m <= leadLen && m < pairs.length; m++) {
        var p3x = startX + m * bw;
        var distFC4 = Math.abs(m - mid);
        var forkR4 = Math.max(0.5, mid * forkFrac);
        var open4 = Math.max(0, 1 - distFC4 / forkR4);
        var p3y = cy - maxFork * open4 + _z(20);  // 前导链在上链下方
        if (m === 0) ctx.moveTo(p3x, p3y); else ctx.lineTo(p3x, p3y);
      }
      ctx.stroke();
      // 前导链 5' 端引物残留（step 4 前可见）
      if (step < 4) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(startX + _z(15), cy - maxFork + _z(20), _z(3), 0, Math.PI * 2); ctx.fill();
      }
      _lbl(ctx, startX + leadLen * bw, cy - maxFork + _z(36), "5'→3' 前导链", '#a7f3d0');
      // DNA 聚合酶移动方向箭头
      if (step === 2 && leadLen > 0) {
        var arrowX = startX + leadLen * bw;
        var arrowY = cy - maxFork + _z(20);
        ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = _z(2);
        ctx.beginPath(); ctx.moveTo(arrowX, arrowY); ctx.lineTo(arrowX + _z(15), arrowY); ctx.stroke();
        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath(); ctx.moveTo(arrowX + _z(15), arrowY);
        ctx.lineTo(arrowX + _z(10), arrowY - _z(4));
        ctx.lineTo(arrowX + _z(10), arrowY + _z(4));
        ctx.closePath(); ctx.fill();
      }
      if (step === 2) _state.hotSpots.push({ x: startX + leadLen * bw, y: cy - maxFork + _z(20), r: _z(18), title: 'DNA 聚合酶', text: '以 3\'→5\' 模板链合成 5\'→3\' 前导链，连续延伸。' });
    }

    // 后随链（冈崎片段，以 5'→3' 下链为模板，紧邻下链上方）
    if (step >= 3) {
      var frags = Math.ceil(pairs.length / 4);
      var drawn = Math.floor(frags * (step === 3 ? t : 1));
      ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = _z(4);
      for (var f = 0; f < drawn && f < frags; f++) {
        ctx.beginPath();
        var si = f * 4, ei = Math.min(si + 3, pairs.length - 1);
        for (var n = si; n <= ei; n++) {
          var p4x = startX + n * bw;
          var distFC5 = Math.abs(n - mid);
          var forkR5 = Math.max(0.5, mid * forkFrac);
          var open5 = Math.max(0, 1 - distFC5 / forkR5);
          var p4y = cy + maxFork * open5 - _z(20);  // 后随链在下链上方
          if (n === si) ctx.moveTo(p4x, p4y); else ctx.lineTo(p4x, p4y);
        }
        ctx.stroke();
        // 每个冈崎片段 5'→3' 方向箭头（从右向左）
        if (f === drawn - 1) {
          var fragMidX = startX + (si + ei) / 2 * bw;
          var fragMidY = cy + maxFork - _z(20);
          ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = _z(2);
          ctx.beginPath(); ctx.moveTo(fragMidX + _z(10), fragMidY); ctx.lineTo(fragMidX - _z(10), fragMidY); ctx.stroke();
          ctx.fillStyle = '#fcd34d';
          ctx.beginPath(); ctx.moveTo(fragMidX - _z(10), fragMidY);
          ctx.lineTo(fragMidX - _z(5), fragMidY - _z(3));
          ctx.lineTo(fragMidX - _z(5), fragMidY + _z(3));
          ctx.closePath(); ctx.fill();
        }
      }
      _lbl(ctx, startX + pairs.length * bw - _z(40), cy + maxFork - _z(36), '5\'→3\' 冈崎片段', '#fcd34d');
      if (step === 3) _state.hotSpots.push({ x: startX + pairs.length * bw - _z(40), y: cy + maxFork - _z(20), r: _z(20), title: '冈崎片段', text: '后随链方向与解链方向相反，只能以不连续片段合成（5\'→3\'）。' });
    }

    if (step === 4) {
      ctx.globalAlpha = 0.25 + 0.3 * Math.sin(_state.time * 4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = _z(2);
      ctx.strokeRect(startX - _z(12), cy - maxFork - _z(45), pairs.length * bw + _z(24), maxFork * 2 + _z(90));
      ctx.globalAlpha = 1;
      _state.hotSpots.push({ x: cx, y: cy, r: _z(60), title: '半保留复制结果', text: '每个子代 DNA 含一条母链（黄/青）和一条新合成链（绿/黄）。' });
    }

    ctx.restore();
  }

  /* ========== 4. 转录与翻译 ========== */
  function _drawTranscription(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    // DNA: 编码链 5' ATGCCGTACGTA 3' → 模板链 3' TACGGCATGCAT 5' → mRNA: 5' AUGCCGUACGUA 3'
    // 密码子: AUG(Met) | CCG(Pro) | UAC(Tyr) | GUA(Val)
    var dnaTop = ['A','T','G','C','C','G','T','A','C','G','T','A']; // 编码链 5'→3'
    var dnaBot = dnaTop.map(function(b) { return { A:'T',T:'A',C:'G',G:'C' }[b]; }); // 模板链 3'→5'
    // mRNA = 模板链的互补（用U替代T）
    var mrnaSeq = dnaBot.map(function(b) { return { A:'U',T:'A',C:'G',G:'C' }[b]; });
    // 密码子: AUG | CCG | UAC | GUA
    var codons = ['AUG', 'CCG', 'UAC', 'GUA'];
    var aaNames = ['Met', 'Pro', 'Tyr', 'Val'];
    var aaColors = ['#f6ad55', '#5eead4', '#a78bfa', '#f472b6'];

    var bw = _z(34), startX = cx - (dnaTop.length * bw) / 2;
    var dnaY = cy - _z(100);

    // DNA 编码链（上）和模板链（下）
    ctx.strokeStyle = '#e8a830'; ctx.lineWidth = _z(4);
    ctx.beginPath(); for (var i = 0; i < dnaTop.length; i++) { var px = startX + i * bw; if (i === 0) ctx.moveTo(px, dnaY); else ctx.lineTo(px, dnaY); } ctx.stroke();
    _lbl(ctx, startX - _z(28), dnaY, "5'", '#e8a830');

    ctx.strokeStyle = '#5eead4';
    ctx.beginPath(); for (var j = 0; j < dnaBot.length; j++) { var px2 = startX + j * bw; if (j === 0) ctx.moveTo(px2, dnaY + _z(20)); else ctx.lineTo(px2, dnaY + _z(20)); } ctx.stroke();
    _lbl(ctx, startX - _z(28), dnaY + _z(20), "3'", '#5eead4');

    // 碱基对
    for (var k = 0; k < dnaTop.length; k++) {
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.moveTo(startX + k * bw, dnaY + _z(4)); ctx.lineTo(startX + k * bw, dnaY + _z(16)); ctx.stroke();
    }

    // RNA 聚合酶
    var transcribed = step === 0 ? Math.floor(dnaTop.length * t) : dnaTop.length;
    if (step >= 0) {
      var polX = startX + transcribed * bw;
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(polX, dnaY + _z(38), _z(18), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(11) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Pol II', polX, dnaY + _z(42));
      _state.hotSpots.push({ x: polX, y: dnaY + _z(38), r: _z(20), title: 'RNA 聚合酶 II', text: '结合启动子，以模板链（3\'→5\'）合成 mRNA（5\'→3\'）。' });
    }

    // mRNA
    if (step >= 1) {
      var mrnaLen = step === 1 ? Math.floor(mrnaSeq.length * t) : mrnaSeq.length;
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = _z(4);
      ctx.beginPath(); for (var m = 0; m < mrnaLen && m < mrnaSeq.length; m++) { var px3 = startX + m * bw; if (m === 0) ctx.moveTo(px3, dnaY + _z(70)); else ctx.lineTo(px3, dnaY + _z(70)); } ctx.stroke();
      _lbl(ctx, startX - _z(28), dnaY + _z(70), "5'", '#f472b6');
      if (step === 2) {
        ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(startX - _z(8), dnaY + _z(70), _z(5), 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(startX + mrnaSeq.length * bw + _z(8), dnaY + _z(70), _z(5), 0, Math.PI * 2); ctx.fill();
        _lbl(ctx, startX - _z(22), dnaY + _z(88), '帽', '#f472b6');
        _lbl(ctx, startX + mrnaSeq.length * bw + _z(22), dnaY + _z(88), 'poly-A', '#f472b6');
      }
    }

    // 翻译
    if (step >= 3) {
      var ribY = cy + _z(60);
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = _z(3);
      ctx.beginPath(); ctx.moveTo(startX, ribY); ctx.lineTo(startX + mrnaSeq.length * bw, ribY); ctx.stroke();
      _lbl(ctx, startX - _z(28), ribY, "5'", '#f472b6');
      _lbl(ctx, startX + mrnaSeq.length * bw + _z(28), ribY, "3'", '#f472b6');

      var transLen = step === 3 ? Math.floor(codons.length * t) : codons.length;
      var ribX = startX + transLen * 3 * bw;

      // 核糖体移位方向箭头（5'→3'）
      if (step >= 3 && step <= 5) {
        ctx.strokeStyle = 'rgba(244,114,182,0.5)'; ctx.lineWidth = _z(2);
        ctx.beginPath(); ctx.moveTo(ribX + _z(35), ribY); ctx.lineTo(ribX + _z(55), ribY); ctx.stroke();
        ctx.fillStyle = 'rgba(244,114,182,0.5)';
        ctx.beginPath(); ctx.moveTo(ribX + _z(55), ribY);
        ctx.lineTo(ribX + _z(50), ribY - _z(4));
        ctx.lineTo(ribX + _z(50), ribY + _z(4));
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(244,114,182,0.7)'; ctx.font = _z(9) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('5\'→3\' 移位', ribX + _z(45), ribY - _z(10));
      }

      // 核糖体（大小亚基）
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(ribX, ribY - _z(12), _z(32), _z(14), 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(10) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('60S', ribX, ribY - _z(9));
      ctx.fillStyle = 'rgba(200,220,255,0.85)';
      ctx.beginPath(); ctx.ellipse(ribX, ribY + _z(10), _z(28), _z(12), 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a2f1d'; ctx.fillText('40S', ribX, ribY + _z(13));
      // A位/P位/E位标注（step 4-5显示）
      if (step >= 4 && step <= 5) {
        ctx.font = 'bold ' + _z(8) + 'px sans-serif';
        ctx.fillStyle = '#ef4444'; ctx.fillText('A', ribX + _z(18), ribY - _z(2));
        ctx.fillStyle = '#3b82f6'; ctx.fillText('P', ribX, ribY - _z(2));
        ctx.fillStyle = '#10b981'; ctx.fillText('E', ribX - _z(18), ribY - _z(2));
      }
      _state.hotSpots.push({ x: ribX, y: ribY, r: _z(30), title: '核糖体（80S）', text: '由 60S 大亚基和 40S 小亚基组成；A 位（氨酰位）接收氨酰-tRNA，P 位（肽酰位）持有肽酰-tRNA，E 位（出口位）释放空载 tRNA。核糖体沿 mRNA 5\'→3\' 方向移位。' });

      // 多肽链
      ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = _z(5); ctx.lineCap = 'round';
      ctx.beginPath();
      for (var n = 0; n < transLen && n < codons.length; n++) {
        var ppx = startX + n * 3 * bw, ppy = ribY - _z(35) - n * _z(10);
        if (n === 0) ctx.moveTo(ppx, ppy); else ctx.lineTo(ppx, ppy);
        ctx.fillStyle = aaColors[n]; ctx.beginPath(); ctx.arc(ppx, ppy, _z(6), 0, Math.PI * 2); ctx.fill();
        _lbl(ctx, ppx, ppy - _z(14), aaNames[n], aaColors[n]);
      }
      ctx.stroke();

      // tRNA（三叶草简化）与密码子-反密码子配对
      if (step >= 4 && step <= 5) {
        var tX = ribX, tY = ribY + _z(30);
        ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = _z(3);
        ctx.beginPath();
        ctx.moveTo(tX, tY); ctx.lineTo(tX - _z(10), tY + _z(12));
        ctx.moveTo(tX, tY); ctx.lineTo(tX, tY + _z(18));
        ctx.moveTo(tX, tY); ctx.lineTo(tX + _z(10), tY + _z(12));
        ctx.stroke();
        ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(tX, tY + _z(22), _z(5), 0, Math.PI * 2); ctx.fill();
        // 反密码子标注
        ctx.fillStyle = '#fcd34d'; ctx.font = _z(8) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('反密码子', tX, tY + _z(35));
        _state.hotSpots.push({ x: tX, y: tY + _z(12), r: _z(20), title: 'tRNA', text: '反密码子环与 mRNA 密码子互补配对；3\' 端 CCA 携带对应氨基酸。' });
      }
    }

    ctx.restore();
  }

  /* ========== 5. 光合作用 ========== */
  function _drawPhotosynthesis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var memY = cy - _z(65);
    // 类囊体堆叠（基粒）
    for (var g = -1; g <= 1; g++) {
      var gx = cx + g * _z(80);
      ctx.fillStyle = 'rgba(200,180,140,0.5)';
      ctx.fillRect(gx - _z(25), memY - _z(5), _z(50), _z(10));
      ctx.fillRect(gx - _z(25), memY - _z(18), _z(50), _z(10));
      ctx.fillRect(gx - _z(25), memY + _z(8), _z(50), _z(10));
    }
    _lbl(ctx, cx, memY - _z(30), '类囊体（基粒）', '#5a7d5c');

    // PSII（左）和 PSI（右）
    var ps2x = cx - _z(120), ps1x = cx + _z(120);
    ctx.fillStyle = '#e8a830'; ctx.beginPath(); ctx.arc(ps2x, memY, _z(18), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.arc(ps1x, memY, _z(18), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(10) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PSII', ps2x, memY + _z(3)); ctx.fillText('PSI', ps1x, memY + _z(3));
    _state.hotSpots.push({ x: ps2x, y: memY, r: _z(20), title: '光系统 II（P680）', text: '吸收 680 nm 光，裂解水并释放电子。' });
    _state.hotSpots.push({ x: ps1x, y: memY, r: _z(20), title: '光系统 I（P700）', text: '吸收 700 nm 光，将电子传递给铁氧还蛋白（Fd）。' });

    // cyt b6f
    var cytX = cx;
    ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(cytX, memY, _z(12), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('b6f', cytX, memY + _z(4));
    _state.hotSpots.push({ x: cytX, y: memY, r: _z(14), title: 'Cyt b6f 复合体', text: '接受 PQ 电子并泵出质子至类囊体腔，将电子传给 PC。' });

    // 光子动画
    var ph = _state.time * 3;
    [ps2x, ps1x].forEach(function(px) {
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = '#f6e05e';
        ctx.beginPath(); ctx.arc(px + Math.cos(ph + i) * _z(35), memY - _z(35) + Math.sin(ph + i) * _z(6), _z(3), 0, Math.PI * 2); ctx.fill();
      }
    });

    // 电子传递链箭头
    _arrow(ctx, ps2x + _z(20), memY, cytX - _z(16), memY, '#f6e05e');
    _lbl(ctx, (ps2x + cytX) / 2, memY - _z(14), 'PQ', '#f6e05e');
    _arrow(ctx, cytX + _z(16), memY, ps1x - _z(20), memY, '#f6e05e');
    _lbl(ctx, (cytX + ps1x) / 2, memY - _z(14), 'PC', '#f6e05e');
    // 电子流方向标注
    if (step >= 1) {
      ctx.fillStyle = 'rgba(246,224,94,0.6)'; ctx.font = _z(9) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('e⁻ 流向 →', cx, memY - _z(28));
    }

    // 水光解（放氧复合体OEC）
    if (step >= 1) {
      _lbl(ctx, ps2x - _z(40), memY + _z(22), '2H₂O', '#a7f3d0');
      _arrow(ctx, ps2x - _z(40), memY + _z(30), ps2x - _z(10), memY + _z(10), '#a7f3d0');
      var o2p = _state.time * 2;
      ctx.fillStyle = '#a7f3d0'; ctx.beginPath(); ctx.arc(ps2x - _z(50) + Math.cos(o2p) * _z(8), memY + _z(40), _z(5), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, ps2x - _z(50), memY + _z(55), 'O₂↑', '#a7f3d0');
      _lbl(ctx, ps2x - _z(20), memY + _z(35), '→4H⁺+4e⁻', '#a7f3d0');
    }

    // NADPH
    var fdX = ps1x + _z(35), fdY = memY - _z(25);
    ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(fdX, fdY, _z(8), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(9) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Fd', fdX, fdY + _z(3));
    _state.hotSpots.push({ x: fdX, y: fdY, r: _z(10), title: '铁氧还蛋白（Fd）', text: '接受 PSI 的高能电子，传递给 NADP⁺ 还原酶生成 NADPH。' });
    
    _lbl(ctx, ps1x + _z(60), memY - _z(20), 'NADP⁺', '#a78bfa');
    _arrow(ctx, fdX + _z(10), fdY, ps1x + _z(55), memY - _z(15), '#a78bfa');
    if (step >= 2) _lbl(ctx, ps1x + _z(60), memY + _z(22), '→ NADPH', '#047857');

    // ATP合酶（F₀膜内孔道 + F₁基质侧催化头）
    var atpX = cx + _z(180);
    // F₀部分（嵌入膜内的圆形孔道）
    ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(atpX, memY, _z(14), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(9) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('F₀', atpX, memY + _z(3));
    // F₁部分（基质侧的催化头，椭圆形）
    ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.ellipse(atpX, memY + _z(28), _z(16), _z(12), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2f1d'; ctx.fillText('F₁', atpX, memY + _z(31));
    // 连接杆
    ctx.strokeStyle = '#f472b6'; ctx.lineWidth = _z(3);
    ctx.beginPath(); ctx.moveTo(atpX, memY + _z(14)); ctx.lineTo(atpX, memY + _z(16)); ctx.stroke();
    // H⁺ 回流箭头（类囊体腔→基质）
    if (step >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.moveTo(atpX, memY - _z(20)); ctx.lineTo(atpX, memY + _z(45)); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.moveTo(atpX, memY + _z(45));
      ctx.lineTo(atpX - _z(4), memY + _z(40));
      ctx.lineTo(atpX + _z(4), memY + _z(40));
      ctx.closePath(); ctx.fill();
      _lbl(ctx, atpX + _z(25), memY + _z(15), 'H⁺', '#fff');
    }
    _state.hotSpots.push({ x: atpX, y: memY + _z(14), r: _z(20), title: 'ATP合酶（F₀F₁）', text: '类囊体腔内H⁺经F₀孔道回流至基质，驱动F₁催化头合成ATP。旋转催化机制。' });

    // Calvin 循环
    var calvY = cy + _z(115);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.ellipse(cx, calvY, _z(130), _z(55), 0, 0, Math.PI * 2); ctx.stroke();
    _lbl(ctx, cx, calvY - _z(50), '叶绿体基质 — Calvin 循环', '#5a7d5c');

    if (step >= 3) {
      var co2Count = step === 3 ? Math.ceil(3 * t) : 3;
      for (var c = 0; c < co2Count; c++) {
        ctx.fillStyle = '#9ca3af'; ctx.beginPath();
        ctx.arc(cx - _z(90) + c * _z(30), calvY - _z(25), _z(5), 0, Math.PI * 2); ctx.fill();
      }
      _lbl(ctx, cx - _z(80), calvY - _z(40), '3 CO₂', '#9ca3af');
      _state.hotSpots.push({ x: cx - _z(80), y: calvY - _z(25), r: _z(20), title: 'CO₂ 固定', text: 'Rubisco 催化 CO₂ + RuBP → 2×3-PGA。每 3 个 CO₂ 固定产生 1 个净 G3P。' });
    }

    if (step >= 4) {
      _lbl(ctx, cx + _z(90), calvY + _z(30), '1 G3P 输出', '#a7f3d0');
      _lbl(ctx, cx + _z(90), calvY + _z(48), '（合成葡萄糖）', '#a7f3d0');
      _state.hotSpots.push({ x: cx + _z(90), y: calvY + _z(30), r: _z(24), title: '净产物', text: '每 3 轮 Calvin 循环消耗 9 ATP + 6 NADPH，净产 1 G3P。5/6 的 G3P 再生 RuBP。' });
    }

    ctx.restore();
  }

  /* ========== 6. 细胞呼吸 ========== */
  function _drawRespiration(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    // 糖酵解
    var glyX = cx - _z(190), glyY = cy - _z(80);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(glyX - _z(55), glyY - _z(35), _z(110), _z(70), _z(12)); ctx.fill();
    _lbl(ctx, glyX, glyY - _z(45), '糖酵解（细胞质）', '#5a7d5c');

    var gp = step === 0 ? t : 1;
    ctx.fillStyle = '#e8a830'; ctx.beginPath(); ctx.arc(glyX - _z(20), glyY, _z(10), 0, Math.PI * 2); ctx.fill();
    _lbl(ctx, glyX - _z(20), glyY + _z(18), '葡萄糖', '#b45309');
    if (gp > 0.3) {
      ctx.fillStyle = '#f6ad55'; ctx.beginPath(); ctx.arc(glyX + _z(20), glyY, _z(7), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(glyX + _z(35), glyY + _z(12), _z(7), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, glyX + _z(30), glyY + _z(30), '2 丙酮酸', '#b45309');
      _lbl(ctx, glyX + _z(30), glyY - _z(20), '+2 ATP +2 NADH', '#a7f3d0');
    }

    // 线粒体
    var mx = cx + _z(40), my = cy;
    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = _z(4);
    ctx.beginPath(); ctx.ellipse(mx, my, _z(150), _z(90), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(94,234,212,0.06)'; ctx.fill();
    _state.hotSpots.push({ x: mx, y: my, r: _z(100), title: '线粒体', text: '外膜通透性高；内膜折叠为嵴，含电子传递链和 ATP 合酶；基质含 TCA 循环酶系。' });

    // 嵴
    ctx.strokeStyle = 'rgba(94,234,212,0.4)'; ctx.lineWidth = _z(3);
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(mx + i * _z(70), my - _z(55));
      ctx.quadraticCurveTo(mx + i * _z(70) + _z(20), my, mx + i * _z(70), my + _z(55));
      ctx.stroke();
    }

    // 丙酮酸进入
    if (step >= 1) {
      var enter = step === 1 ? t : 1;
      var px = _lerp(glyX + _z(55), mx - _z(100), enter), py = _lerp(glyY, my, enter);
      ctx.fillStyle = '#f6ad55'; ctx.beginPath(); ctx.arc(px, py, _z(7), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, mx - _z(80), my - _z(30), '乙酰-CoA', '#f6ad55');
      if (step === 1) _state.hotSpots.push({ x: px, y: py, r: _z(14), title: '丙酮酸脱氢酶复合体', text: '丙酮酸 + CoA + NAD⁺ → 乙酰-CoA + CO₂ + NADH。' });
    }

    // TCA 循环
    if (step >= 2) {
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = _z(3);
      ctx.beginPath(); ctx.ellipse(mx, my, _z(55), _z(35), 0, 0, Math.PI * 2); ctx.stroke();
      _lbl(ctx, mx, my - _z(42), 'TCA 循环', '#a78bfa');
      var dot = _state.time * 2;
      ctx.fillStyle = '#a78bfa'; ctx.beginPath();
      ctx.arc(mx + Math.cos(dot) * _z(55), my + Math.sin(dot) * _z(35), _z(5), 0, Math.PI * 2); ctx.fill();
      _state.hotSpots.push({ x: mx, y: my, r: _z(40), title: '三羧酸循环', text: '每轮：乙酰-CoA → 2 CO₂ + 3 NADH + 1 FADH₂ + 1 GTP。草酰乙酸再生。' });
    }

    // ETC 复合体（修正排列顺序：I→II→III→IV）
    if (step >= 3) {
      var etcY = my - _z(60);
      var complexes = ['I', 'II', 'III', 'IV'];
      var complexX = [mx - _z(80), mx - _z(25), mx + _z(30), mx + _z(85)];  // 修正间距
      for (var c = 0; c < 4; c++) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.roundRect(complexX[c] - _z(12), etcY - _z(10), _z(24), _z(20), _z(4)); ctx.fill();
        ctx.fillStyle = '#1a2f1d'; ctx.font = 'bold ' + _z(10) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(complexes[c], complexX[c], etcY + _z(4));
      }
      _state.hotSpots.push({ x: mx, y: etcY, r: _z(30), title: '复合体 I-IV', text: 'I: NADH→Q; II: FADH₂→Q; III: Q→Cyt c; IV: Cyt c→O₂。电子传递同时泵出 H⁺。' });

      // Q 和 Cyt c（修正位置）
      _lbl(ctx, mx - _z(52), etcY - _z(20), 'Q', '#f6e05e');
      _lbl(ctx, mx + _z(57), etcY - _z(20), 'Cyt c', '#f6e05e');

      // 电子流路径（修正：I→Q→III→Cyt c→IV）
      ctx.strokeStyle = '#f6e05e'; ctx.lineWidth = _z(2);
      ctx.setLineDash([_z(4), _z(4)]);
      ctx.beginPath();
      // I → Q
      ctx.moveTo(complexX[0] + _z(12), etcY - _z(12));
      ctx.lineTo(mx - _z(52), etcY - _z(18));
      // Q → III
      ctx.lineTo(complexX[2] - _z(12), etcY - _z(12));
      // III → Cyt c
      ctx.lineTo(mx + _z(57), etcY - _z(18));
      // Cyt c → IV
      ctx.lineTo(complexX[3] - _z(12), etcY - _z(12));
      ctx.stroke(); ctx.setLineDash([]);

      // 电子流方向标注
      if (step >= 3) {
        ctx.fillStyle = 'rgba(246,224,94,0.6)'; ctx.font = _z(9) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('e⁻ 流向 →', mx, etcY - _z(30));
      }

      // O₂ → H₂O
      _lbl(ctx, mx + _z(130), etcY, 'O₂ → H₂O', '#a7f3d0');

      // ATP 合酶
      ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(mx + _z(120), etcY, _z(12), 0, Math.PI * 2); ctx.fill();
      _state.hotSpots.push({ x: mx + _z(120), y: etcY, r: _z(16), title: 'ATP 合酶（F₀F₁）', text: 'H⁺ 经 F₀ 回流，F₁ 催化 ADP + Pi → ATP。1 NADH ≈ 2.5 ATP。' });

      // 质子梯度（H⁺ 箭头：膜间隙→基质）
      if (step === 4) {
        for (var h = 0; h < 6; h++) {
          var hx = mx - _z(60) + h * _z(30);
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(hx, etcY + _z(30) + Math.sin(_state.time * 3 + h) * _z(5), _z(3), 0, Math.PI * 2); ctx.fill();
        }
        _lbl(ctx, mx, etcY + _z(45), 'H⁺ 梯度回流（膜间隙→基质）→ ATP', '#fff');
      }
    }

    ctx.restore();
  }

  /* ========== 7. 膜运输与动作电位 ========== */
  function _drawMembrane(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var memY = cy - _z(30), w = _z(420);

    // 磷脂双分子层（亲水头 + 两条疏水尾）
    for (var x = cx - w / 2; x < cx + w / 2; x += _z(18)) {
      // 上排亲水头
      ctx.fillStyle = '#f6ad55'; ctx.beginPath(); ctx.arc(x, memY - _z(8), _z(5), 0, Math.PI * 2); ctx.fill();
      // 上排两条疏水尾（从头基内缘向下延伸到膜中心）
      ctx.strokeStyle = 'rgba(246,173,85,0.4)'; ctx.lineWidth = _z(1);
      ctx.beginPath(); ctx.moveTo(x - _z(2), memY - _z(3)); ctx.lineTo(x - _z(2), memY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + _z(2), memY - _z(3)); ctx.lineTo(x + _z(2), memY); ctx.stroke();
      // 下排两条疏水尾（从头基内缘向上延伸到膜中心）
      ctx.strokeStyle = 'rgba(94,234,212,0.4)';
      ctx.beginPath(); ctx.moveTo(x - _z(2), memY + _z(3)); ctx.lineTo(x - _z(2), memY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + _z(2), memY + _z(3)); ctx.lineTo(x + _z(2), memY); ctx.stroke();
      // 下排亲水头
      ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.arc(x, memY + _z(8), _z(5), 0, Math.PI * 2); ctx.fill();
    }
    _lbl(ctx, cx - w / 2 - _z(40), memY - _z(8), '胞外', '#f6ad55');
    _lbl(ctx, cx - w / 2 - _z(40), memY + _z(8), '胞内', '#5eead4');

    // 自由扩散
    if (step === 0) {
      var ox = _lerp(cx - _z(120), cx + _z(120), t);
      ctx.fillStyle = '#a7f3d0'; ctx.beginPath(); ctx.arc(ox, memY - _z(40), _z(6), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, ox, memY - _z(52), 'O₂', '#a7f3d0');
      _state.hotSpots.push({ x: ox, y: memY - _z(40), r: _z(12), title: '自由扩散', text: 'O₂、CO₂ 等脂溶性小分子顺浓度梯度直接穿过磷脂双分子层，不耗能。' });
    }

    // 协助扩散
    if (step === 1) {
      // 载体蛋白（GLUT）
      var carrierX = cx - _z(80);
      ctx.fillStyle = 'rgba(167,243,208,0.5)';
      ctx.beginPath(); ctx.roundRect(carrierX - _z(16), memY - _z(20), _z(32), _z(40), _z(10)); ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      var glucoseY = _lerp(memY - _z(50), memY + _z(50), t);
      ctx.beginPath(); ctx.arc(carrierX, glucoseY, _z(6), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, carrierX, memY - _z(32), 'GLUT', '#a7f3d0');
      _state.hotSpots.push({ x: carrierX, y: memY, r: _z(24), title: '载体蛋白（GLUT）', text: '葡萄糖等极性分子通过载体蛋白顺浓度梯度转运，不消耗 ATP。载体蛋白发生构象变化。' });

      // 离子通道
      var chX = cx - _z(20);
      ctx.fillStyle = 'rgba(167,243,208,0.4)';
      ctx.beginPath(); ctx.roundRect(chX - _z(14), memY - _z(18), _z(28), _z(36), _z(8)); ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      var ionY = _lerp(memY - _z(50), memY + _z(50), t);
      ctx.beginPath(); ctx.arc(chX, ionY, _z(5), 0, Math.PI * 2); ctx.fill();
      _lbl(ctx, chX, memY - _z(30), '通道', '#a7f3d0');
      _state.hotSpots.push({ x: chX, y: memY, r: _z(22), title: '离子通道', text: '电压门控/配体门控通道允许特定离子顺电化学梯度快速通过，不消耗 ATP。' });
    }

    // 钠钾泵
    if (step === 2) {
      var pX = cx + _z(80);
      ctx.fillStyle = 'rgba(246,173,85,0.6)';
      ctx.beginPath(); ctx.roundRect(pX - _z(18), memY - _z(22), _z(36), _z(44), _z(8)); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + _z(10) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Na⁺/K⁺', pX, memY - _z(2));
      ctx.fillText('ATPase', pX, memY + _z(12));
      // 离子转运动画：3 Na⁺ 出胞、2 K⁺ 入胞
      var pumpPhase = _state.time * 2;
      // 3 Na⁺ 出胞（从胞内到胞外）
      for (var na = 0; na < 3; na++) {
        var naProgress = (pumpPhase + na * 0.3) % 1;
        var naX = pX + _z(20) + na * _z(8);
        var naY = _lerp(memY + _z(15), memY - _z(40), naProgress);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(naX, naY, _z(4), 0, Math.PI * 2); ctx.fill();
      }
      // 2 K⁺ 入胞（从胞外到胞内）
      for (var k = 0; k < 2; k++) {
        var kProgress = (pumpPhase + k * 0.4) % 1;
        var kX = pX - _z(20) - k * _z(8);
        var kY = _lerp(memY - _z(40), memY + _z(15), kProgress);
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath(); ctx.arc(kX, kY, _z(4), 0, Math.PI * 2); ctx.fill();
      }
      _lbl(ctx, pX + _z(35), memY - _z(30), '3 Na⁺', '#fbbf24');
      _lbl(ctx, pX - _z(35), memY + _z(30), '2 K⁺', '#a78bfa');
      _state.hotSpots.push({ x: pX, y: memY, r: _z(26), title: 'Na⁺-K⁺-ATPase', text: '每水解 1 ATP：泵出 3 Na⁺、泵入 2 K⁺。维持胞外高 Na⁺、胞内高 K⁺。' });
    }

    // 动作电位图
    if (step >= 3) {
      var gY = cy + _z(130), gW = _z(380), gH = _z(100);
      var baseline = gY + gH * 0.15; // 静息电位 -70 mV
      // 坐标轴
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.moveTo(cx - gW / 2, gY); ctx.lineTo(cx + gW / 2, gY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - gW / 2, gY + gH / 2); ctx.lineTo(cx - gW / 2, gY - gH / 2); ctx.stroke();
      // 静息电位虚线
      ctx.setLineDash([_z(4), _z(4)]);
      ctx.strokeStyle = 'rgba(94,234,212,0.4)';
      ctx.beginPath(); ctx.moveTo(cx - gW / 2, baseline); ctx.lineTo(cx + gW / 2, baseline); ctx.stroke();
      ctx.setLineDash([]);
      // 阈电位虚线（~-55 mV）
      var thresholdY = baseline - gH * 0.15;
      ctx.setLineDash([_z(3), _z(3)]);
      ctx.strokeStyle = 'rgba(244,114,182,0.3)';
      ctx.beginPath(); ctx.moveTo(cx - gW / 2, thresholdY); ctx.lineTo(cx + gW / 2, thresholdY); ctx.stroke();
      ctx.setLineDash([]);
      _lbl(ctx, cx - gW / 2 - _z(20), gY - gH * 0.35, '+30', '#f472b6');
      _lbl(ctx, cx - gW / 2 - _z(20), thresholdY, '-55', '#f472b6');
      _lbl(ctx, cx - gW / 2 - _z(20), baseline, '-70', '#5eead4');
      _lbl(ctx, cx - gW / 2 - _z(20), gY, '0 mV', '#888');

      // 动作电位经典波形（y 值相对于静息电位 -70 mV，-1 = +30 mV）
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = _z(3);
      ctx.beginPath();
      // phase 直接映射到波形 x 坐标范围
      var phase = step === 3 ? 0.10 * t : (step === 4 ? 0.10 + 0.10 * t : (step === 5 ? 0.20 + 0.35 * t : 0.55));
      // 关键时间点（ms比例）与对应电位偏移（-1=+30mV, 0=-70mV, +0.2=-85mV）
      var wp = [
        { x: 0.00, y: 0 },       // 静息 -70 mV
        { x: 0.10, y: 0 },       // 刺激开始
        { x: 0.15, y: -0.15 },   // 阈电位 ~-55 mV
        { x: 0.20, y: -1.0 },    // 峰值 +30 mV（反极化）
        { x: 0.30, y: -0.05 },   // 复极化接近静息
        { x: 0.42, y: 0.25 },    // 后超极化 ~-85 mV
        { x: 0.55, y: 0 }        // 恢复静息电位
      ];
      var totalDur = 0.55;
      // 渐进式绘制：从左侧开始向右展开
      var drawFrac = Math.min(phase / totalDur, 1);
      var endX = cx - gW / 2 + drawFrac * gW;
      ctx.moveTo(cx - gW / 2, baseline);
      for (var s = 1; s < wp.length; s++) {
        var sx = cx - gW / 2 + (wp[s].x / totalDur) * gW;
        var sy = baseline + wp[s].y * gH * 0.5;
        if (sx <= endX) {
          // 使用二次贝塞尔曲线平滑过渡
          var prevSx = cx - gW / 2 + (wp[s - 1].x / totalDur) * gW;
          var prevSy = baseline + wp[s - 1].y * gH * 0.5;
          var cpx = (prevSx + sx) / 2;
          ctx.quadraticCurveTo(cpx, prevSy, sx, sy);
        } else {
          // 当前段超出绘制范围，插值到边界
          var prevPt = wp[s - 1];
          var prevSx2 = cx - gW / 2 + (prevPt.x / totalDur) * gW;
          var prevSy2 = baseline + prevPt.y * gH * 0.5;
          var ratio = (endX - prevSx2) / (sx - prevSx2);
          var interpY = prevSy2 + (sy - prevSy2) * ratio;
          ctx.quadraticCurveTo((prevSx2 + endX) / 2, prevSy2, endX, interpY);
          break;
        }
      }
      ctx.stroke();

      // 离子流标注（仅在对应阶段显示）
      if (phase >= 0.15 && phase < 0.30) {
        _lbl(ctx, cx - gW / 2 + _z(55), gY - gH * 0.45, 'Na⁺ 内流（去极化）', '#f472b6');
      }
      if (phase >= 0.30 && phase < 0.42) {
        _lbl(ctx, cx - gW / 2 + _z(130), gY + gH * 0.4, 'K⁺ 外流（复极化）', '#5eead4');
      }
      if (phase >= 0.42) {
        _lbl(ctx, cx - gW / 2 + _z(200), gY + gH * 0.3, 'K⁺ 持续外流（超极化）', '#5eead4');
      }
      _state.hotSpots.push({ x: cx, y: gY - _z(20), r: _z(60), title: '动作电位', text: '全或无：阈电位（~-55 mV）→ 电压门控 Na⁺ 通道开放 → 去极化至 +30 mV → Na⁺ 失活/K⁺ 开放 → 复极化 → 短暂超极化（~-85 mV）→ 恢复静息。' });
    }

    ctx.restore();
  }

  /* ---------- 渲染循环 ---------- */
  function _drawFrame(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    switch (_state.process) {
      case 'mitosis': _drawMitosis(ctx, canvas); break;
      case 'meiosis': _drawMeiosis(ctx, canvas); break;
      case 'dna': _drawDNA(ctx, canvas); break;
      case 'transcription': _drawTranscription(ctx, canvas); break;
      case 'photosynthesis': _drawPhotosynthesis(ctx, canvas); break;
      case 'respiration': _drawRespiration(ctx, canvas); break;
      case 'membrane': _drawMembrane(ctx, canvas); break;
    }
    if (canvas.parentNode) {
      var bar = canvas.parentNode.querySelector('.ba-progress');
      if (bar) {
        var total = _processes[_state.process].steps.length;
        bar.style.width = ((_state.step + _state.progress) / total * 100) + '%';
      }
    }
  }

  function _update(dt) {
    if (!_state.playing) return;
    _state.progress += dt / (3500 / _state.speed);
    if (_state.progress >= 1) {
      _state.progress = 0; _state.step++;
      if (_state.step >= _processes[_state.process].steps.length) { _state.step = 0; _state.playing = false; }
    }
  }

  function _loop(timestamp) {
    if (!_state.lastTime) _state.lastTime = timestamp;
    _state.time += (timestamp - _state.lastTime) / 1000;
    _update(timestamp - _state.lastTime);
    _state.lastTime = timestamp;
    _drawFrame(document.getElementById('bio-animation-canvas'));
    _state.animId = requestAnimationFrame(_loop);
  }

  /* ---------- UI ---------- */
  function _renderInfo(container) {
    var proc = _processes[_state.process], step = proc.steps[_state.step];
    container.innerHTML = '<div class="ba-step-card"><div class="ba-step-title">' + (_state.step + 1) + '. ' + step.name + '</div><p class="ba-step-desc">' + step.desc + '</p></div>';
  }

  function _renderControls(container) {
    container.innerHTML = '<select class="ba-process-select" id="ba-process-select">' +
      '<option value="mitosis">有丝分裂</option><option value="meiosis">减数分裂</option>' +
      '<option value="dna">DNA 复制</option><option value="transcription">转录与翻译</option>' +
      '<option value="photosynthesis">光合作用</option><option value="respiration">细胞呼吸</option>' +
      '<option value="membrane">膜运输与动作电位</option></select>' +
      '<div class="ba-controls">' +
      '<button class="ba-btn ba-btn--secondary" id="ba-prev">上一步</button>' +
      '<button class="ba-btn" id="ba-play">' + (_state.playing ? '暂停' : '播放') + '</button>' +
      '<button class="ba-btn ba-btn--secondary" id="ba-next">下一步</button>' +
      '<button class="ba-btn ba-btn--secondary" id="ba-reset">重置</button>' +
      '<label class="ba-speed">速度 <input type="range" id="ba-speed" min="0.25" max="2" step="0.25" value="' + _state.speed + '"><span id="ba-speed-val">' + _state.speed + 'x</span></label></div>';

    document.getElementById('ba-process-select').value = _state.process;
    document.getElementById('ba-process-select').addEventListener('change', function(e) {
      _state.process = e.target.value; _state.step = 0; _state.progress = 0; _state.zoom = 1; _state.panX = 0; _state.panY = 0;
      _renderInfo(document.getElementById('ba-info'));
    });
    document.getElementById('ba-play').addEventListener('click', function() {
      _state.playing = !_state.playing; document.getElementById('ba-play').textContent = _state.playing ? '暂停' : '播放';
    });
    document.getElementById('ba-prev').addEventListener('click', function() {
      _state.progress = 0; _state.step = Math.max(0, _state.step - 1); _renderInfo(document.getElementById('ba-info'));
    });
    document.getElementById('ba-next').addEventListener('click', function() {
      _state.progress = 0; _state.step = Math.min(_processes[_state.process].steps.length - 1, _state.step + 1); _renderInfo(document.getElementById('ba-info'));
    });
    document.getElementById('ba-reset').addEventListener('click', function() {
      _state.step = 0; _state.progress = 0; _state.playing = false; _state.zoom = 1; _state.panX = 0; _state.panY = 0;
      document.getElementById('ba-play').textContent = '播放'; _renderInfo(document.getElementById('ba-info'));
    });
    document.getElementById('ba-speed').addEventListener('input', function(e) {
      _state.speed = parseFloat(e.target.value); document.getElementById('ba-speed-val').textContent = _state.speed + 'x';
    });
  }

  function _setupCanvas(canvas) {
    canvas.addEventListener('wheel', function(e) {
      e.preventDefault(); _state.zoom = _clamp(_state.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.35, 3);
    });
    canvas.addEventListener('mousedown', function(e) {
      _state.dragging = true; _state.lastX = e.clientX; _state.lastY = e.clientY;
    });
    window.addEventListener('mousemove', function(e) {
      if (_state.dragging) { _state.panX += e.clientX - _state.lastX; _state.panY += e.clientY - _state.lastY; _state.lastX = e.clientX; _state.lastY = e.clientY; }
      var card = document.getElementById('ba-hotspot-card'); if (!card) return;
      var r = canvas.getBoundingClientRect();
      var wx = _toWorldX(e.clientX - r.left, canvas), wy = _toWorldY(e.clientY - r.top, canvas);
      var found = _state.hotSpots.find(function(h) { return Math.hypot(h.x - wx, h.y - wy) < h.r; });
      if (found) {
        card.style.display = 'block';
        card.style.left = Math.min(e.clientX - r.left + 12, r.width - 270) + 'px';
        card.style.top = Math.min(e.clientY - r.top + 12, r.height - 80) + 'px';
        card.innerHTML = '<h4>' + found.title + '</h4><p>' + found.text + '</p>';
        canvas.style.cursor = 'pointer';
      } else { card.style.display = 'none'; canvas.style.cursor = _state.dragging ? 'grabbing' : 'grab'; }
    });
    window.addEventListener('mouseup', function() { _state.dragging = false; });
  }

  function initBioAnimation(target) {
    _addStyles();
    var pageTarget = target || document.getElementById('page-content');
    if (!pageTarget) return;
    pageTarget.innerHTML = '<div class="ba-page"><div class="ba-header"><h1>生物过程可视化</h1><p>基于 Canvas 的交互式动画：拖拽平移，滚轮缩放，悬停分子/结构查看原理</p></div>' +
      '<div class="ba-toolbar" id="ba-toolbar"></div><div class="ba-canvas-wrap"><canvas class="ba-canvas" id="bio-animation-canvas"></canvas>' +
      '<div class="ba-info" id="ba-info"></div><div class="ba-hotspot-card" id="ba-hotspot-card"></div><div class="ba-progress"></div></div>' +
      '<p class="ba-hint">提示：黄色/青色标记不同来源的 DNA 链或膜两侧；粉红为酶复合体；绿色为产物/新合成链；悬停高亮区域可查看原理</p>' +
      '<div class="ba-legend">' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#e8a830"></span>母链/编码链/PSII</div>' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#5eead4"></span>互补链/模板链/PSI</div>' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#ef4444"></span>着丝粒</div>' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#a7f3d0"></span>新合成链/产物</div>' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#f472b6"></span>酶/复合体</div>' +
      '<div class="ba-legend-item"><span class="ba-legend-dot" style="background:#fcd34d"></span>冈崎片段/tRNA</div></div></div>';

    _renderControls(document.getElementById('ba-toolbar'));
    _renderInfo(document.getElementById('ba-info'));
    _setupCanvas(document.getElementById('bio-animation-canvas'));
    if (_state.animId) cancelAnimationFrame(_state.animId);
    _state.lastTime = 0; _state.animId = requestAnimationFrame(_loop);
  }

  function renderBioAnimationPage(target) { initBioAnimation(target); }
  window.initBioAnimation = initBioAnimation;
  window.renderBioAnimationPage = renderBioAnimationPage;
})();