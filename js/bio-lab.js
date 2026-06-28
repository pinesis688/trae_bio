/**
 * ============================================================
 * BioQuest — 虚拟生物实验室
 * 首批实验：显微镜观察、叶绿体色素提取与分离、DNA 粗提取、微生物培养
 * ============================================================
 */

(function() {
  'use strict';

  var _experiments = {
    microscope: {
      id: 'microscope',
      name: '显微镜观察',
      goal: '正确使用光学显微镜观察植物细胞结构。',
      steps: [
        { name: '取镜与安放', text: '将显微镜放在实验台距边缘约 7 cm 处，略偏左。', tool: 'microscope', feedback: '显微镜已就位。' },
        { name: '放置装片', text: '把要观察的洋葱表皮装片放在载物台上，用压片夹压住。', tool: 'slide', feedback: '装片已固定。' },
        {
          name: '对光', text: '转动转换器，使低倍物镜对准通光孔，调节反光镜直到视野明亮。', tool: 'light', feedback: '视野已明亮。',
          param: {
            type: 'range', label: '亮度', unit: '', min: 0, max: 100, okMin: 40, okMax: 70,
            prompt: '调节反光镜至合适亮度',
            tooLow: '视野太暗，无法看清细胞结构。请重新对光（中等亮度 40-70 为宜）。',
            tooHigh: '视野过亮，刺眼且细胞细节被淹没。请重新对光（中等亮度 40-70 为宜）。'
          }
        },
        {
          name: '粗准焦螺旋', text: '转动粗准焦螺旋，使镜筒缓缓下降，直到物镜接近装片。', tool: 'coarse', feedback: '物镜已接近装片。',
          param: {
            type: 'range', label: '下降距离', unit: 'mm', min: 0, max: 20, okMin: 8, okMax: 12,
            prompt: '调节粗准焦螺旋下降距离',
            tooLow: '物镜距离装片过远，无法成像。请重新调节（8-12mm 接近装片为宜）。',
            tooHigh: '物镜下降过多，已压碎装片！请重新调节（8-12mm 接近装片但未触碰为宜）。'
          }
        },
        { name: '观察', text: '左眼向目镜内看，反向转动粗准焦螺旋，直到看清物像，再微调细准焦螺旋。', tool: 'fine', feedback: '细胞结构清晰可见！' }
      ],
      observation: {
        prompt: '你在视野中看到了什么？请选择正确的观察结果：',
        choices: [
          {
            label: '规则多边形细胞',
            svg: '<svg width="80" height="60" viewBox="0 0 80 60"><rect x="8" y="10" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><rect x="30" y="10" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><rect x="52" y="10" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><rect x="8" y="26" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><rect x="30" y="26" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><rect x="52" y="26" width="20" height="14" fill="none" stroke="#38a169" stroke-width="1.5"/><circle cx="18" cy="17" r="2" fill="#2f855a"/><circle cx="40" cy="33" r="2" fill="#2f855a"/><circle cx="62" cy="17" r="2" fill="#2f855a"/></svg>',
            correct: true
          },
          {
            label: '圆形动物细胞',
            svg: '<svg width="80" height="60" viewBox="0 0 80 60"><circle cx="22" cy="22" r="11" fill="none" stroke="#3182ce" stroke-width="1.5"/><circle cx="55" cy="38" r="11" fill="none" stroke="#3182ce" stroke-width="1.5"/><circle cx="22" cy="22" r="3" fill="#2c5282"/><circle cx="55" cy="38" r="3" fill="#2c5282"/></svg>',
            correct: false,
            wrong: '这是动物细胞（圆形无细胞壁），但你观察的是洋葱表皮装片，应是植物细胞。'
          },
          {
            label: '杆状细菌',
            svg: '<svg width="80" height="60" viewBox="0 0 80 60"><rect x="8" y="18" width="22" height="6" rx="3" fill="#d69e2e"/><rect x="40" y="30" width="28" height="6" rx="3" fill="#d69e2e"/><rect x="18" y="42" width="20" height="6" rx="3" fill="#d69e2e"/></svg>',
            correct: false,
            wrong: '这是细菌（杆状），洋葱表皮不是细菌，应是植物细胞。'
          }
        ]
      },
      report: '观察到植物细胞呈规则多边形，细胞壁、细胞质、细胞核和液泡清晰可见。'
    },
    pigment: {
      id: 'pigment',
      name: '叶绿体色素提取与分离',
      goal: '用纸层析法分离叶绿体中的色素。',
      steps: [
        { name: '制备滤纸条', text: '将干燥定性滤纸剪成长约 10 cm、宽约 1 cm 的滤纸条，一端剪去两角。', tool: 'paper', feedback: '滤纸条已剪好。' },
        { name: '画滤液细线', text: '用毛细吸管吸取少量滤液，沿铅笔线均匀画一条细而直的滤液细线，待干后再画一两次。', tool: 'capillary', feedback: '滤液细线已画好。' },
        { name: '倒入层析液', text: '在烧杯中倒入适量层析液，注意液面不能没及滤液细线。', tool: 'solvent', feedback: '层析液已倒入。' },
        {
          name: '插入滤纸条', text: '将滤纸条轻轻插入层析液中，盖上培养皿。', tool: 'dip', feedback: '滤纸条正在层析。',
          param: {
            type: 'range', label: '插入深度', unit: '%', min: 0, max: 100, okMin: 30, okMax: 60,
            prompt: '调节滤纸条插入层析液的深度',
            tooLow: '插入过浅，滤纸条未充分接触层析液，层析无法进行。请重新插入（30-60% 为宜）。',
            tooHigh: '插入过深，层析液没过滤液细线，色素溶解丢失。请重新插入（30-60% 为宜，液面不能没过滤液细线）。'
          }
        },
        { name: '观察结果', text: '待色素带分开后，取出滤纸条，观察色素带。', tool: 'observe', feedback: '从上到下依次出现胡萝卜素、叶黄素、叶绿素 a、叶绿素 b。' }
      ],
      report: '滤纸条上出现四条色素带：橙黄色胡萝卜素、黄色叶黄素、蓝绿色叶绿素 a、黄绿色叶绿素 b。'
    },
    dna: {
      id: 'dna',
      name: 'DNA 粗提取与鉴定',
      goal: '从植物组织中粗提取 DNA，并用二苯胺试剂鉴定。',
      steps: [
        { name: '研磨材料', text: '将香蕉或草莓放入研钵中，加入少量洗涤剂和食盐，充分研磨。', tool: 'grind', feedback: '材料已研磨成匀浆。' },
        { name: '过滤', text: '用纱布过滤研磨液，收集滤液于烧杯中。', tool: 'filter', feedback: '已获取含 DNA 的滤液。' },
        {
          name: '加入冷酒精', text: '沿烧杯壁缓缓加入预冷的 95% 乙醇，出现白色丝状物。', tool: 'ethanol', feedback: 'DNA 已析出呈白色絮状。',
          param: {
            type: 'select', label: '倾倒速度', options: ['快', '中', '慢'], ok: '慢',
            prompt: '选择冷酒精倾倒速度',
            wrong: '倾倒过快会破坏 DNA 析出层，DNA 无法析出。请缓慢沿壁加入（应选"慢"）。'
          }
        },
        { name: '鉴定', text: '将 DNA 溶于 2 mol/L NaCl，加入二苯胺试剂，沸水浴加热。', tool: 'test', feedback: '溶液呈现蓝色，证明存在 DNA。' }
      ],
      report: 'DNA 不溶于冷酒精，析出白色丝状物；二苯胺鉴定呈蓝色。'
    },
    microbe: {
      id: 'microbe',
      name: '微生物培养与计数',
      goal: '学习平板划线法和菌落计数。',
      steps: [
        { name: '灭菌', text: '将接种环在酒精灯火焰上灼烧，待冷却后使用。', tool: 'flame', feedback: '接种环已灭菌。' },
        { name: '取菌', text: '用冷却的接种环蘸取少量菌液。', tool: 'sample', feedback: '已蘸取菌液。' },
        { name: '一区划线', text: '在琼脂平板一侧密集划线，作为第一区。', tool: 'streak1', feedback: '第一区划线完成。' },
        { name: '二三区划线', text: '灼烧接种环冷却后，从第一区末端向第二、三区划线，逐渐稀释。', tool: 'streak2', feedback: '平板划线完成。' },
        { name: '培养与计数', text: '倒置平板，37℃ 培养 24-48 小时后计数单菌落。', tool: 'incubate', feedback: '菌落生长良好，可计数。' }
      ],
      report: '平板划线法将菌液逐步稀释，最终获得单个分离菌落；菌落数在 30-300 之间适合计数。'
    }
  };

  var _state = {
    experiment: 'microscope',
    step: 0,
    mistakes: 0,
    finished: false,
    failed: false,
    animPhase: 0,
    lastTime: 0,
    animId: null,
    feedback: '',
    feedbackType: 'info',
    placed: {}
  };

  function _addStyles() {
    if (document.getElementById('bio-lab-styles')) return;
    var style = document.createElement('style');
    style.id = 'bio-lab-styles';
    style.textContent = `
      .bl-page { max-width: 1200px; margin: 0 auto; padding: 20px; }
      .bl-header { text-align: center; margin-bottom: 18px; }
      .bl-header h1 { margin: 0; color: var(--color-deep, #2c4a3b); font-family: var(--font-serif, serif); }
      .bl-header p { margin: 6px 0 0; color: var(--text-muted, #888); }
      .bl-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; }
      .bl-sidebar { background: var(--card-bg, #fff); border-radius: 16px; padding: 18px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
      .bl-exp-select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 14px; font-size: 0.95rem; background: var(--input-bg, #fff); color: var(--text-primary, #222); }
      .bl-goal { font-size: 0.9rem; color: var(--text-secondary, #555); margin-bottom: 14px; line-height: 1.5; }
      .bl-steps { list-style: none; padding: 0; margin: 0; }
      .bl-step { display: flex; gap: 10px; padding: 10px; border-radius: 10px; margin-bottom: 6px; font-size: 0.9rem; color: var(--text-secondary, #555); background: #f9fafb; }
      .bl-step.active { background: rgba(90,125,92,0.12); color: var(--color-deep, #2c4a3b); font-weight: 600; }
      .bl-step.done { background: rgba(16,185,129,0.1); color: #047857; }
      .bl-step-num { width: 22px; height: 22px; border-radius: 50%; background: #e5e7eb; color: #374151; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; }
      .bl-step.active .bl-step-num { background: var(--color-sage, #5a7d5c); color: #fff; }
      .bl-step.done .bl-step-num { background: #10b981; color: #fff; }
      .bl-feedback { margin-top: 14px; padding: 12px; border-radius: 10px; font-size: 0.9rem; line-height: 1.5; min-height: 60px; }
      .bl-feedback.info { background: #eff6ff; color: #1e40af; }
      .bl-feedback.success { background: #ecfdf5; color: #047857; }
      .bl-feedback.error { background: #fef2f2; color: #b91c1c; }
      .bl-bench { background: #1a2f1d; border-radius: 16px; position: relative; overflow: hidden; min-height: 420px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
      .bl-canvas { display: block; width: 100%; height: 420px; }
      .bl-tools { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; justify-content: center; }
      .bl-tool { padding: 10px 16px; border-radius: 10px; border: 1px solid #ddd; background: var(--card-bg, #fff); color: var(--text-primary, #222); cursor: pointer; font-size: 0.9rem; transition: all 0.15s; }
      .bl-tool:hover { border-color: var(--color-sage, #5a7d5c); color: var(--color-sage, #5a7d5c); }
      .bl-tool:disabled { opacity: 0.5; cursor: not-allowed; }
      .bl-report { display: none; background: var(--card-bg, #fff); border-radius: 16px; padding: 20px; margin-top: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
      .bl-report h3 { margin: 0 0 10px; color: var(--color-deep, #2c4a3b); }
      .bl-report p { margin: 0; color: var(--text-secondary, #555); line-height: 1.6; }
      .bl-actions { display: flex; gap: 10px; margin-top: 14px; justify-content: center; }
      .bl-btn { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; background: var(--color-sage, #5a7d5c); color: #fff; }
      .bl-btn--secondary { background: #e5e7eb; color: #374151; }
      .bl-why { margin-top: 10px; font-size: 0.85rem; color: var(--text-muted, #888); }
      .bl-why a { color: var(--color-sage, #5a7d5c); cursor: pointer; }
      @media (max-width: 800px) {
        .bl-layout { grid-template-columns: 1fr; }
        .bl-canvas { height: 340px; }
      }
    `;
    document.head.appendChild(style);
  }

  function _setFeedback(text, type) {
    _state.feedback = text;
    _state.feedbackType = type || 'info';
    var box = document.getElementById('bl-feedback');
    if (box) {
      box.textContent = text;
      box.className = 'bl-feedback ' + _state.feedbackType;
    }
  }

  function _renderSidebar(container) {
    var exp = _experiments[_state.experiment];
    container.innerHTML = '<select class="bl-exp-select" id="bl-exp-select">' +
      '<option value="microscope">显微镜观察</option>' +
      '<option value="pigment">色素提取与分离</option>' +
      '<option value="dna">DNA 粗提取与鉴定</option>' +
      '<option value="microbe">微生物培养与计数</option>' +
      '</select>' +
      '<div class="bl-goal"><strong>实验目的：</strong>' + exp.goal + '</div>' +
      '<ul class="bl-steps" id="bl-steps"></ul>' +
      '<div class="bl-feedback info" id="bl-feedback">' + _state.feedback + '</div>' +
      '<div class="bl-why">连续操作错误 2 次后，可点击 <a id="bl-why-link">为什么这样做？</a> 查看原理。</div>';

    document.getElementById('bl-exp-select').value = _state.experiment;
    document.getElementById('bl-exp-select').addEventListener('change', function(e) {
      _state.experiment = e.target.value;
      _resetExperiment('请选择正确的工具开始实验。');
      _renderTools(document.getElementById('bl-tools'));
    });

    document.getElementById('bl-why-link').addEventListener('click', function() {
      var step = exp.steps[_state.step];
      if (step) {
        _setFeedback('原理：' + step.text, 'info');
      }
    });

    var stepsEl = document.getElementById('bl-steps');
    stepsEl.innerHTML = exp.steps.map(function(s, i) {
      var cls = i < _state.step ? 'done' : (i === _state.step ? 'active' : '');
      var icon = i < _state.step ? '✓' : (i + 1);
      return '<li class="bl-step ' + cls + '"><span class="bl-step-num">' + icon + '</span><div>' + s.name + '</div></li>';
    }).join('');
  }

  function _renderTools(container) {
    var tools = {
      microscope: [
        { id: 'microscope', label: '显微镜' },
        { id: 'slide', label: '洋葱表皮装片' },
        { id: 'light', label: '对光' },
        { id: 'coarse', label: '粗准焦螺旋' },
        { id: 'fine', label: '细准焦螺旋' }
      ],
      pigment: [
        { id: 'paper', label: '滤纸条' },
        { id: 'capillary', label: '毛细吸管' },
        { id: 'solvent', label: '层析液' },
        { id: 'dip', label: '插入滤纸条' },
        { id: 'observe', label: '观察结果' }
      ],
      dna: [
        { id: 'grind', label: '研磨' },
        { id: 'filter', label: '过滤' },
        { id: 'ethanol', label: '冷酒精' },
        { id: 'test', label: '二苯胺鉴定' }
      ],
      microbe: [
        { id: 'flame', label: '火焰灭菌' },
        { id: 'sample', label: '蘸取菌液' },
        { id: 'streak1', label: '一区划线' },
        { id: 'streak2', label: '二三区划线' },
        { id: 'incubate', label: '培养计数' }
      ]
    };
    var current = tools[_state.experiment];
    container.innerHTML = current.map(function(t) {
      return '<button class="bl-tool" data-tool="' + t.id + '">' + t.label + '</button>';
    }).join('');

    container.querySelectorAll('.bl-tool').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _handleTool(btn.dataset.tool);
      });
    });
  }

  function _handleTool(toolId) {
    if (_state.finished) return;
    var exp = _experiments[_state.experiment];
    var current = exp.steps[_state.step];
    if (!current) return;

    if (toolId === current.tool) {
      _state.mistakes = 0;
      _state.step++;
      _setFeedback(current.feedback, 'success');
      _state.placed[toolId] = true;
      if (_state.step >= exp.steps.length) {
        _state.finished = true;
        _setFeedback('实验完成！' + exp.report, 'success');
        _renderReport(true);
        if (typeof window.awardCR === 'function') window.awardCR('lab_complete', 2);
      }
      _renderSidebar(document.getElementById('bl-sidebar'));
    } else {
      _state.mistakes++;
      var hint = _state.mistakes >= 2 ? ' 提示：当前步骤是“' + current.name + '”，需要“' + current.tool + '”。可点击“为什么这样做？”查看原理。' : '';
      _setFeedback('操作错误：' + current.name + ' 不需要该工具。' + hint, 'error');
    }
  }

  function _renderReport(show) {
    var el = document.getElementById('bl-report');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (show) {
      var exp = _experiments[_state.experiment];
      el.innerHTML = '<h3>实验报告：' + exp.name + '</h3><p>' + exp.report + '</p>';
    }
  }

  function _drawBench(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.clientWidth;
    var h = canvas.height = canvas.clientHeight;

    // 深色实验台背景
    ctx.fillStyle = '#1a2f1d';
    ctx.fillRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (var x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    var cx = w / 2;
    var cy = h / 2;

    if (_state.experiment === 'microscope') _drawMicroscope(ctx, cx, cy, w, h);
    else if (_state.experiment === 'pigment') _drawPigment(ctx, cx, cy, w, h);
    else if (_state.experiment === 'dna') _drawDNA(ctx, cx, cy, w, h);
    else if (_state.experiment === 'microbe') _drawMicrobe(ctx, cx, cy, w, h);
  }

  function _drawMicroscope(ctx, cx, cy, w, h) {
    // 显微镜轮廓
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(cx - 60, cy + 60, 120, 16);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(cx - 8, cy - 80, 16, 140);
    ctx.fillStyle = '#718096';
    ctx.beginPath(); ctx.arc(cx, cy - 90, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(cx - 45, cy - 20, 90, 8);

    // 装片
    if (_state.placed.slide) {
      ctx.fillStyle = 'rgba(200,230,255,0.4)';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx - 30, cy + 50, 60, 24);
      ctx.fill(); ctx.stroke();
    }

    // 视野
    if (_state.step >= 4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy - 90, 16, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#e6fffa';
      ctx.fillRect(cx - 20, cy - 110, 40, 40);
      // 细胞
      var phase = _state.animPhase;
      ctx.strokeStyle = '#38a169';
      ctx.lineWidth = 1.5;
      for (var i = 0; i < 4; i++) {
        var ox = cx + Math.cos(phase + i) * 8;
        var oy = cy - 90 + Math.sin(phase + i * 1.3) * 6;
        ctx.beginPath();
        ctx.moveTo(ox - 8, oy - 6);
        ctx.lineTo(ox + 8, oy - 6);
        ctx.lineTo(ox + 8, oy + 6);
        ctx.lineTo(ox - 8, oy + 6);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 状态标签
    _drawLabel(ctx, cx, cy + 110, _state.finished ? '观察完成' : (_state.step === 0 ? '准备观察' : '步骤 ' + _state.step));
  }

  function _drawPigment(ctx, cx, cy, w, h) {
    // 烧杯
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy - 40);
    ctx.lineTo(cx - 50, cy + 50);
    ctx.lineTo(cx + 50, cy + 50);
    ctx.lineTo(cx + 50, cy - 40);
    ctx.stroke();

    // 层析液
    if (_state.placed.solvent) {
      ctx.fillStyle = 'rgba(90,125,92,0.4)';
      ctx.fillRect(cx - 47, cy + 10, 94, 38);
    }

    // 滤纸条
    if (_state.placed.paper) {
      ctx.fillStyle = '#f7fafc';
      ctx.fillRect(cx - 6, cy - 70, 12, 110);
      // 色素带
      if (_state.step >= 4) {
        var bands = ['#f6ad55', '#f6e05e', '#48bb78', '#2f855a'];
        bands.forEach(function(c, i) {
          ctx.fillStyle = c;
          ctx.fillRect(cx - 5, cy - 60 + i * 16, 10, 8);
        });
      } else if (_state.placed.capillary) {
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 5, cy - 50); ctx.lineTo(cx + 5, cy - 50); ctx.stroke();
      }
    }

    _drawLabel(ctx, cx, cy + 90, _state.finished ? '层析完成' : '纸层析法');
  }

  function _drawDNA(ctx, cx, cy, w, h) {
    // 烧杯
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy - 50);
    ctx.lineTo(cx - 50, cy + 50);
    ctx.lineTo(cx + 50, cy + 50);
    ctx.lineTo(cx + 45, cy - 50);
    ctx.stroke();

    // 滤液
    if (_state.placed.filter) {
      ctx.fillStyle = 'rgba(246,224,126,0.3)';
      ctx.fillRect(cx - 47, cy + 10, 94, 38);
    }

    // DNA 白色絮状物
    if (_state.placed.ethanol) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      var phase = _state.animPhase;
      for (var i = 0; i < 5; i++) {
        var px = cx + Math.sin(phase + i) * 20;
        var py = cy - 10 + Math.cos(phase * 0.7 + i) * 10;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 二苯胺蓝色
    if (_state.placed.test) {
      ctx.fillStyle = 'rgba(66,153,225,0.6)';
      ctx.fillRect(cx - 47, cy + 10, 94, 38);
    }

    _drawLabel(ctx, cx, cy + 90, _state.finished ? '鉴定完成' : 'DNA 粗提取');
  }

  function _drawMicrobe(ctx, cx, cy, w, h) {
    // 培养皿
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.stroke();

    // 琼脂
    ctx.fillStyle = 'rgba(255,245,230,0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 84, 0, Math.PI * 2);
    ctx.fill();

    // 划线
    if (_state.placed.streak1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy - 60);
      ctx.lineTo(cx - 60, cy + 60);
      ctx.stroke();
    }
    if (_state.placed.streak2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 25, cy - 70);
        ctx.quadraticCurveTo(cx + 20 + i * 20, cy, cx - 20 + i * 25, cy + 70);
        ctx.stroke();
      }
    }

    // 菌落
    if (_state.placed.incubate) {
      var rng = function(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); };
      ctx.fillStyle = '#f6e05e';
      for (var j = 0; j < 40; j++) {
        var r = rng(j) * 70;
        var ang = rng(j + 100) * Math.PI * 2;
        var px = cx + Math.cos(ang) * r;
        var py = cy + Math.sin(ang) * r;
        ctx.beginPath();
        ctx.arc(px, py, 1 + rng(j + 200) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawLabel(ctx, cx, cy + 120, _state.finished ? '培养完成' : '平板划线法');
  }

  function _drawLabel(ctx, x, y, text) {
    ctx.font = '14px sans-serif';
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 8, y - 14, tw + 16, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
  }

  function _loop(timestamp) {
    if (!_state.lastTime) _state.lastTime = timestamp;
    var dt = timestamp - _state.lastTime;
    _state.lastTime = timestamp;
    _state.animPhase += dt * 0.002;

    var canvas = document.getElementById('bio-lab-canvas');
    _drawBench(canvas);

    _state.animId = requestAnimationFrame(_loop);
  }

  function _renderActions(container) {
    container.innerHTML = '<button class="bl-btn" id="bl-restart">重新开始</button>' +
      '<button class="bl-btn bl-btn--secondary" id="bl-hint">查看提示</button>';
    document.getElementById('bl-restart').addEventListener('click', function() {
      _resetExperiment('实验已重置，请选择正确工具开始。');
    });
    document.getElementById('bl-hint').addEventListener('click', function() {
      var exp = _experiments[_state.experiment];
      var step = exp.steps[_state.step];
      if (step) {
        _setFeedback('提示：当前步骤「' + step.name + '」需要使用「' + step.tool + '」。', 'info');
      }
    });
  }

  function initBioLab(target) {
    _addStyles();
    var pageTarget = target || document.getElementById('page-content');
    if (!pageTarget) return;

    pageTarget.innerHTML = '<div class="bl-page">' +
      '<div class="bl-header">' +
        '<h1>虚拟生物实验室</h1>' +
        '<p>按正确步骤操作，完成高中生物高频考点实验</p>' +
      '</div>' +
      '<div class="bl-layout">' +
        '<div class="bl-sidebar" id="bl-sidebar"></div>' +
        '<div>' +
          '<div class="bl-bench">' +
            '<canvas class="bl-canvas" id="bio-lab-canvas"></canvas>' +
          '</div>' +
          '<div class="bl-tools" id="bl-tools"></div>' +
          '<div class="bl-observation" id="bl-observation"></div>' +
          '<div class="bl-actions" id="bl-actions"></div>' +
          '<div class="bl-report" id="bl-report"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    _setFeedback('请选择正确的工具开始实验。', 'info');
    _renderSidebar(document.getElementById('bl-sidebar'));
    _renderTools(document.getElementById('bl-tools'));
    _renderActions(document.getElementById('bl-actions'));

    if (_state.animId) cancelAnimationFrame(_state.animId);
    _state.lastTime = 0;
    _state.animId = requestAnimationFrame(_loop);
  }

  function renderBioLabPage(target) {
    initBioLab(target);
  }

  window.initBioLab = initBioLab;
  window.renderBioLabPage = renderBioLabPage;
})();
