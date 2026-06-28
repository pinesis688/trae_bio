/**
 * ============================================================
 * BioQuest — 交互式生物学知识图谱模块
 * 纯 SVG + CSS 实现力导向图，展示生物学概念之间的关联关系
 * 竞品没有此功能，属于 BioQuest 创新特色
 * ============================================================
 */

(function () {
  'use strict';

  /* ============================================================
   * 常量与配置
   * ============================================================ */

  /** 力导向布局参数 */
  var REPULSION = 8000;          // 节点间斥力系数
  var SPRING_LENGTH = 120;       // 弹簧自然长度
  var SPRING_STRENGTH = 0.006;   // 弹簧刚度
  var DAMPING = 0.85;            // 速度衰减系数
  var CENTER_GRAVITY = 0.01;     // 向心力
  var MAX_VELOCITY = 8;          // 最大速度限制
  var STABLE_THRESHOLD = 0.3;    // 稳定判定阈值
  var SETTLE_FRAMES = 180;       // 约 3 秒后停止动画（60fps * 3）

  /** 学科分类配色 */
  var CATEGORY_COLORS = {
    '细胞生物学': { fill: '#5a7bc4', stroke: '#3a5ba4', bg: 'rgba(90,123,196,0.12)', text: '#3a5ba4' },
    '遗传学':     { fill: '#c47a4a', stroke: '#a45a2a', bg: 'rgba(196,122,74,0.12)', text: '#a45a2a' },
    '分子生物学': { fill: '#8a6ac4', stroke: '#6a4aa4', bg: 'rgba(138,106,196,0.12)', text: '#6a4aa4' },
    '生态学':     { fill: '#4a9c6a', stroke: '#2a7c4a', bg: 'rgba(74,156,106,0.12)', text: '#2a7c4a' },
    '动物学':     { fill: '#c45a7a', stroke: '#a43a5a', bg: 'rgba(196,90,122,0.12)', text: '#a43a5a' },
    '植物学':     { fill: '#5aaa5a', stroke: '#3a8a3a', bg: 'rgba(90,170,90,0.12)', text: '#3a8a3a' },
    '生物化学':   { fill: '#c49a4a', stroke: '#a47a2a', bg: 'rgba(196,154,74,0.12)', text: '#a47a2a' },
    '微生物学':   { fill: '#4aaac4', stroke: '#2a8aa4', bg: 'rgba(74,170,196,0.12)', text: '#2a8aa4' }
  };

  /* ============================================================
   * 知识图谱数据：约 38 个核心概念节点，覆盖 CBO 竞赛大纲
   * ============================================================ */
  var GRAPH_NODES = [
    // —— 细胞生物学 ——
    { id: 'cell_structure',   label: '细胞结构',     category: '细胞生物学', description: '原核细胞与真核细胞的结构比较，细胞膜、细胞质、细胞核等基本结构', relatedModule: 'module1' },
    { id: 'cell_membrane',    label: '细胞膜',       category: '细胞生物学', description: '流动镶嵌模型，膜蛋白功能，物质跨膜运输方式', relatedModule: 'module1' },
    { id: 'organelle',        label: '细胞器',       category: '细胞生物学', description: '线粒体、叶绿体、内质网、高尔基体等细胞器的结构与功能', relatedModule: 'module1' },
    { id: 'cell_cycle',       label: '细胞周期',     category: '细胞生物学', description: '有丝分裂与减数分裂的过程、各期特征及生物学意义', relatedModule: 'module1' },
    { id: 'cell_signal',      label: '细胞信号转导', category: '细胞生物学', description: '受体、第二信使、信号级联放大、G蛋白偶联受体通路', relatedModule: 'module1' },
    { id: 'cell_apoptosis',   label: '细胞凋亡',     category: '细胞生物学', description: '程序性细胞死亡的机制、Caspase级联、与坏死的区别', relatedModule: 'module1' },

    // —— 遗传学 ——
    { id: 'mendel',           label: '孟德尔遗传',   category: '遗传学', description: '分离定律与自由组合定律，显隐性关系，概率计算', relatedModule: 'module4' },
    { id: 'linkage',          label: '连锁与交换',   category: '遗传学', description: '连锁遗传、重组率、三点测交、基因定位', relatedModule: 'module4' },
    { id: 'sex_linkage',      label: '伴性遗传',     category: '遗传学', description: 'X/Y连锁遗传、剂量补偿、巴氏小体', relatedModule: 'module4' },
    { id: 'gene_mutation',    label: '基因突变',     category: '遗传学', description: '碱基替换、移码突变、突变率与修复机制', relatedModule: 'module4' },
    { id: 'chromosome_var',   label: '染色体变异',   category: '遗传学', description: '缺失、重复、倒位、易位，染色体数目变异', relatedModule: 'module4' },
    { id: 'population_gen',   label: '群体遗传',     category: '遗传学', description: 'Hardy-Weinberg平衡、遗传漂变、基因流、自然选择', relatedModule: 'module4' },

    // —— 分子生物学 ——
    { id: 'dna_structure',    label: 'DNA结构',      category: '分子生物学', description: '双螺旋结构、碱基配对、Chargaff法则、DNA变性复性', relatedModule: 'module1' },
    { id: 'replication',      label: 'DNA复制',      category: '分子生物学', description: '半保留复制、复制叉、引物酶、DNA聚合酶、冈崎片段', relatedModule: 'module1' },
    { id: 'transcription',    label: '转录',         category: '分子生物学', description: 'RNA聚合酶、启动子、转录因子、mRNA加工', relatedModule: 'module1' },
    { id: 'translation',      label: '翻译',         category: '分子生物学', description: '核糖体、tRNA、密码子、翻译后修饰', relatedModule: 'module1' },
    { id: 'gene_regulation',  label: '基因表达调控', category: '分子生物学', description: '操纵子模型、转录因子、表观遗传调控、miRNA', relatedModule: 'module1' },
    { id: 'pcr',              label: 'PCR技术',      category: '分子生物学', description: '聚合酶链式反应原理、引物设计、定量PCR', relatedModule: 'module1' },

    // —— 生态学 ——
    { id: 'ecosystem',        label: '生态系统',     category: '生态学', description: '生态系统的组成、食物链与食物网、能量流动与物质循环', relatedModule: 'module3' },
    { id: 'population_eco',   label: '种群生态',     category: '生态学', description: '种群增长模型、逻辑斯谛增长、r/K选择', relatedModule: 'module3' },
    { id: 'community',        label: '群落生态',     category: '生态学', description: '种间关系、群落演替、生物多样性、生态位', relatedModule: 'module3' },
    { id: 'biogeochemical',   label: '物质循环',     category: '生态学', description: '碳循环、氮循环、磷循环、水循环', relatedModule: 'module3' },
    { id: 'biodiversity',     label: '生物多样性',   category: '生态学', description: '物种多样性、遗传多样性、生态系统多样性、保护策略', relatedModule: 'module3' },

    // —— 动物学 ——
    { id: 'animal_tissue',    label: '动物组织',     category: '动物学', description: '上皮、结缔、肌肉、神经四大组织类型', relatedModule: 'module3' },
    { id: 'nervous_sys',      label: '神经系统',     category: '动物学', description: '神经元结构、突触传递、反射弧、自主神经', relatedModule: 'module3' },
    { id: 'immune_sys',       label: '免疫系统',     category: '动物学', description: '固有免疫与适应性免疫、抗体、T/B细胞', relatedModule: 'module3' },
    { id: 'endocrine',        label: '内分泌系统',   category: '动物学', description: '激素种类与作用机制、下丘脑-垂体轴', relatedModule: 'module3' },
    { id: 'circulatory',      label: '循环系统',     category: '动物学', description: '心脏结构、血液循环途径、血压调节', relatedModule: 'module3' },

    // —— 植物学 ——
    { id: 'plant_tissue',     label: '植物组织',     category: '植物学', description: '分生组织、保护组织、薄壁组织、输导组织', relatedModule: 'module2' },
    { id: 'photosynthesis',   label: '光合作用',     category: '植物学', description: '光反应与暗反应、光系统、Calvin循环', relatedModule: 'module2' },
    { id: 'plant_hormone',    label: '植物激素',     category: '植物学', description: '生长素、赤霉素、细胞分裂素、乙烯、脱落酸', relatedModule: 'module2' },
    { id: 'plant_transport',  label: '植物物质运输', category: '植物学', description: '蒸腾拉力、根压、内聚力学说、筛管运输', relatedModule: 'module2' },

    // —— 生物化学 ——
    { id: 'enzyme',           label: '酶',           category: '生物化学', description: '酶的催化机制、米氏动力学、别构调节、竞争性抑制', relatedModule: 'module1' },
    { id: 'glycolysis',       label: '糖酵解',       category: '生物化学', description: '葡萄糖分解为丙酮酸、底物水平磷酸化、NADH生成', relatedModule: 'module1' },
    { id: 'krebs_cycle',      label: '柠檬酸循环',   category: '生物化学', description: '乙酰CoA氧化、NADH/FADH2生成、回补反应', relatedModule: 'module1' },
    { id: 'oxidative_phos',   label: '氧化磷酸化',   category: '生物化学', description: '电子传递链、化学渗透、ATP合酶、P/O比', relatedModule: 'module1' },
    { id: 'amino_acid',       label: '氨基酸代谢',   category: '生物化学', description: '转氨基、脱氨基、尿素循环、必需氨基酸', relatedModule: 'module1' },

    // —— 微生物学 ——
    { id: 'bacteria',         label: '细菌',         category: '微生物学', description: '细菌形态结构、革兰氏染色、代谢多样性', relatedModule: 'module2' },
    { id: 'virus',            label: '病毒',         category: '微生物学', description: '病毒结构、复制周期、溶原性与溶菌性', relatedModule: 'module2' },
    { id: 'microbial_eco',    label: '微生物生态',   category: '微生物学', description: '共生、寄生、微生物群落、极端环境微生物', relatedModule: 'module2' }
  ];

  /* ============================================================
   * 知识图谱边：约 48 条依赖关系
   * source → target 表示"学习 source 是理解 target 的前提"
   * ============================================================ */
  var GRAPH_EDGES = [
    // 细胞生物学内部
    { source: 'cell_structure',  target: 'cell_membrane' },
    { source: 'cell_structure',  target: 'organelle' },
    { source: 'cell_structure',  target: 'cell_cycle' },
    { source: 'cell_membrane',   target: 'cell_signal' },
    { source: 'cell_signal',     target: 'cell_apoptosis' },
    { source: 'organelle',       target: 'cell_cycle' },

    // 遗传学内部
    { source: 'mendel',          target: 'linkage' },
    { source: 'mendel',          target: 'sex_linkage' },
    { source: 'linkage',         target: 'gene_mutation' },
    { source: 'gene_mutation',   target: 'chromosome_var' },
    { source: 'gene_mutation',   target: 'population_gen' },
    { source: 'chromosome_var',  target: 'population_gen' },

    // 分子生物学内部
    { source: 'dna_structure',   target: 'replication' },
    { source: 'dna_structure',   target: 'transcription' },
    { source: 'transcription',   target: 'translation' },
    { source: 'transcription',   target: 'gene_regulation' },
    { source: 'replication',     target: 'pcr' },
    { source: 'dna_structure',   target: 'pcr' },

    // 生态学内部
    { source: 'population_eco',  target: 'community' },
    { source: 'community',       target: 'ecosystem' },
    { source: 'ecosystem',       target: 'biogeochemical' },
    { source: 'ecosystem',       target: 'biodiversity' },
    { source: 'population_eco',  target: 'biodiversity' },

    // 动物学内部
    { source: 'animal_tissue',   target: 'nervous_sys' },
    { source: 'animal_tissue',   target: 'immune_sys' },
    { source: 'animal_tissue',   target: 'endocrine' },
    { source: 'animal_tissue',   target: 'circulatory' },
    { source: 'nervous_sys',     target: 'endocrine' },

    // 植物学内部
    { source: 'plant_tissue',    target: 'photosynthesis' },
    { source: 'plant_tissue',    target: 'plant_transport' },
    { source: 'plant_hormone',   target: 'plant_transport' },

    // 生物化学内部
    { source: 'enzyme',          target: 'glycolysis' },
    { source: 'glycolysis',      target: 'krebs_cycle' },
    { source: 'krebs_cycle',     target: 'oxidative_phos' },
    { source: 'enzyme',          target: 'amino_acid' },
    { source: 'glycolysis',      target: 'amino_acid' },

    // 微生物学内部
    { source: 'bacteria',        target: 'microbial_eco' },
    { source: 'virus',           target: 'microbial_eco' },

    // 跨学科关联
    { source: 'cell_membrane',   target: 'cell_signal' },
    { source: 'dna_structure',   target: 'mendel' },
    { source: 'dna_structure',   target: 'gene_mutation' },
    { source: 'gene_mutation',   target: 'gene_regulation' },
    { source: 'organelle',       target: 'photosynthesis' },
    { source: 'organelle',       target: 'oxidative_phos' },
    { source: 'cell_signal',     target: 'nervous_sys' },
    { source: 'cell_signal',     target: 'endocrine' },
    { source: 'cell_signal',     target: 'immune_sys' },
    { source: 'enzyme',          target: 'replication' },
    { source: 'enzyme',          target: 'transcription' },
    { source: 'bacteria',        target: 'ecosystem' },
    { source: 'virus',           target: 'immune_sys' }
  ];

  /* ============================================================
   * 内部状态
   * ============================================================ */
  var _nodes = [];            // 运行时节点（含位置、速度）
  var _edges = [];            // 运行时边
  var _animFrameId = null;    // 动画帧 ID
  var _frameCount = 0;        // 帧计数
  var _isStable = false;      // 布局是否已稳定
  var _dragNode = null;       // 当前拖拽的节点
  var _hoverNode = null;      // 当前悬停的节点
  var _svgWidth = 0;          // SVG 宽度
  var _svgHeight = 0;         // SVG 高度
  var _activeCategories = {}; // 当前激活的分类过滤
  var _searchQuery = '';      // 搜索关键词
  var _tooltipEl = null;      // tooltip DOM 元素
  var _containerEl = null;    // 容器 DOM 元素

  /* ============================================================
   * 样式注入
   * ============================================================ */

  /**
   * 注入知识图谱专属样式（与项目 CSS 变量一致）
   */
  function injectKnowledgeGraphStyles() {
    if (document.getElementById('kg-styles')) return;

    var style = document.createElement('style');
    style.id = 'kg-styles';
    style.textContent = [
      /* 页面容器 */
      '.kg-page {',
      '  max-width: 1200px;',
      '  margin: 0 auto;',
      '  padding: 32px 20px 60px;',
      '}',

      /* 页面标题区 */
      '.kg-header {',
      '  text-align: center;',
      '  margin-bottom: 24px;',
      '}',
      '.kg-title {',
      '  font-family: var(--font-serif, "Noto Serif SC", serif);',
      '  font-size: 2rem;',
      '  font-weight: 700;',
      '  color: var(--color-deep, #1a3a2a);',
      '  margin: 0 0 8px;',
      '}',
      '.kg-subtitle {',
      '  font-size: 0.95rem;',
      '  color: var(--text-muted, #8a8a8a);',
      '  margin: 0;',
      '}',

      /* 工具栏 */
      '.kg-toolbar {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 12px;',
      '  align-items: center;',
      '  margin-bottom: 16px;',
      '  padding: 16px 20px;',
      '  background: var(--surface-primary, #ffffff);',
      '  border: 1px solid var(--border-light, #ece8e1);',
      '  border-radius: var(--radius-md, 12px);',
      '  box-shadow: var(--shadow-sm, 0 1px 3px rgba(26,58,42,0.06));',
      '}',

      /* 搜索框 */
      '.kg-search {',
      '  flex: 1;',
      '  min-width: 200px;',
      '  position: relative;',
      '}',
      '.kg-search-input {',
      '  width: 100%;',
      '  padding: 10px 14px 10px 36px;',
      '  border: 1.5px solid var(--border-default, #e0dcd5);',
      '  border-radius: var(--radius-sm, 6px);',
      '  background: var(--surface-primary, #ffffff);',
      '  color: var(--text-primary, #1a1a1a);',
      '  font-size: 0.9rem;',
      '  outline: none;',
      '  transition: border-color var(--transition-fast, 0.15s ease), box-shadow var(--transition-fast, 0.15s ease);',
      '}',
      '.kg-search-input:focus {',
      '  border-color: var(--color-sage, #5a7d5c);',
      '  box-shadow: 0 0 0 3px rgba(90,125,92,0.15);',
      '}',
      '.kg-search-input::placeholder {',
      '  color: var(--text-muted, #8a8a8a);',
      '}',
      '.kg-search-icon {',
      '  position: absolute;',
      '  left: 12px;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      '  color: var(--text-muted, #8a8a8a);',
      '  pointer-events: none;',
      '}',

      /* 分类筛选按钮组 */
      '.kg-filters {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 6px;',
      '}',
      '.kg-filter-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  padding: 6px 12px;',
      '  border-radius: var(--radius-full, 9999px);',
      '  font-size: 0.78rem;',
      '  font-weight: 500;',
      '  border: 1.5px solid var(--border-default, #e0dcd5);',
      '  background: var(--surface-primary, #ffffff);',
      '  color: var(--text-secondary, #4a4a4a);',
      '  cursor: pointer;',
      '  transition: all var(--transition-fast, 0.15s ease);',
      '  user-select: none;',
      '  white-space: nowrap;',
      '}',
      '.kg-filter-btn:hover {',
      '  border-color: var(--color-sage, #5a7d5c);',
      '}',
      '.kg-filter-btn.active {',
      '  font-weight: 600;',
      '}',
      '.kg-filter-dot {',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 50%;',
      '  flex-shrink: 0;',
      '}',

      /* 图表容器 */
      '.kg-graph-container {',
      '  position: relative;',
      '  width: 100%;',
      '  height: 600px;',
      '  background: var(--surface-primary, #ffffff);',
      '  border: 1px solid var(--border-light, #ece8e1);',
      '  border-radius: var(--radius-md, 12px);',
      '  box-shadow: var(--shadow-md, 0 4px 16px rgba(26,58,42,0.08));',
      '  overflow: hidden;',
      '}',

      /* SVG 画布 */
      '.kg-svg {',
      '  width: 100%;',
      '  height: 100%;',
      '  cursor: grab;',
      '}',
      '.kg-svg:active {',
      '  cursor: grabbing;',
      '}',

      /* SVG 节点样式 */
      '.kg-node {',
      '  cursor: pointer;',
      '  transition: opacity 0.3s ease;',
      '}',
      '.kg-node.dimmed {',
      '  opacity: 0.15;',
      '}',
      '.kg-node.highlighted {',
      '  opacity: 1;',
      '}',
      '.kg-node-circle {',
      '  stroke-width: 2;',
      '  transition: r 0.3s ease, stroke-width 0.2s ease, filter 0.2s ease;',
      '}',
      '.kg-node:hover .kg-node-circle {',
      '  stroke-width: 3;',
      '  filter: drop-shadow(0 0 6px rgba(0,0,0,0.2));',
      '}',
      '.kg-node-label {',
      '  font-family: var(--font-sans, "Noto Sans SC", sans-serif);',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  fill: var(--text-primary, #1a1a1a);',
      '  text-anchor: middle;',
      '  dominant-baseline: central;',
      '  pointer-events: none;',
      '  user-select: none;',
      '}',

      /* SVG 边样式 */
      '.kg-edge {',
      '  fill: none;',
      '  stroke: var(--border-default, #e0dcd5);',
      '  stroke-width: 1.2;',
      '  transition: opacity 0.3s ease, stroke 0.2s ease;',
      '}',
      '.kg-edge.dimmed {',
      '  opacity: 0.05;',
      '}',
      '.kg-edge.highlighted {',
      '  stroke: var(--color-sage, #5a7d5c);',
      '  stroke-width: 2;',
      '  opacity: 1;',
      '}',
      '.kg-edge-arrow {',
      '  fill: var(--border-default, #e0dcd5);',
      '  transition: opacity 0.3s ease, fill 0.2s ease;',
      '}',
      '.kg-edge-arrow.dimmed {',
      '  opacity: 0.05;',
      '}',
      '.kg-edge-arrow.highlighted {',
      '  fill: var(--color-sage, #5a7d5c);',
      '  opacity: 1;',
      '}',

      /* Tooltip */
      '.kg-tooltip {',
      '  position: absolute;',
      '  z-index: 100;',
      '  max-width: 280px;',
      '  padding: 14px 16px;',
      '  background: var(--color-deep, #1a3a2a);',
      '  color: var(--text-inverse, #ffffff);',
      '  border-radius: var(--radius-sm, 6px);',
      '  box-shadow: var(--shadow-lg, 0 8px 32px rgba(26,58,42,0.12));',
      '  pointer-events: none;',
      '  opacity: 0;',
      '  transform: translateY(4px);',
      '  transition: opacity 0.2s ease, transform 0.2s ease;',
      '  font-size: 0.85rem;',
      '  line-height: 1.5;',
      '}',
      '.kg-tooltip.visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',
      '.kg-tooltip-title {',
      '  font-weight: 700;',
      '  font-size: 0.95rem;',
      '  margin-bottom: 4px;',
      '}',
      '.kg-tooltip-category {',
      '  display: inline-block;',
      '  padding: 2px 8px;',
      '  border-radius: 10px;',
      '  font-size: 0.72rem;',
      '  font-weight: 600;',
      '  margin-bottom: 6px;',
      '}',
      '.kg-tooltip-desc {',
      '  color: rgba(255,255,255,0.8);',
      '  margin-bottom: 6px;',
      '}',
      '.kg-tooltip-mastery {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  font-size: 0.78rem;',
      '  color: rgba(255,255,255,0.7);',
      '}',
      '.kg-tooltip-mastery-bar {',
      '  flex: 1;',
      '  height: 4px;',
      '  background: rgba(255,255,255,0.2);',
      '  border-radius: 2px;',
      '  overflow: hidden;',
      '}',
      '.kg-tooltip-mastery-fill {',
      '  height: 100%;',
      '  border-radius: 2px;',
      '  transition: width 0.3s ease;',
      '}',

      /* 图例 */
      '.kg-legend {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 12px;',
      '  justify-content: center;',
      '  margin-top: 16px;',
      '  padding: 12px 16px;',
      '  background: var(--surface-secondary, #faf7f2);',
      '  border-radius: var(--radius-sm, 6px);',
      '}',
      '.kg-legend-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  font-size: 0.78rem;',
      '  color: var(--text-secondary, #4a4a4a);',
      '}',
      '.kg-legend-dot {',
      '  width: 10px;',
      '  height: 10px;',
      '  border-radius: 50%;',
      '}',

      /* 提示信息 */
      '.kg-hint {',
      '  text-align: center;',
      '  font-size: 0.82rem;',
      '  color: var(--text-muted, #8a8a8a);',
      '  margin-top: 12px;',
      '}',

      /* 空状态 */
      '.kg-empty {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  height: 100%;',
      '  color: var(--text-muted, #8a8a8a);',
      '  font-size: 0.95rem;',
      '}',

      /* 响应式 */
      '@media (max-width: 768px) {',
      '  .kg-page { padding: 20px 12px 40px; }',
      '  .kg-title { font-size: 1.5rem; }',
      '  .kg-graph-container { height: 450px; }',
      '  .kg-toolbar { flex-direction: column; gap: 8px; }',
      '  .kg-search { min-width: 100%; }',
      '  .kg-filters { justify-content: center; }',
      '  .kg-legend { gap: 8px; }',
      '}',

      /* 深色模式适配 */
      '[data-theme="dark"] .kg-node-label { fill: var(--text-primary, #e8e6e2); }',
      '[data-theme="dark"] .kg-edge { stroke: var(--border-default, #3a403d); }',
      '[data-theme="dark"] .kg-edge-arrow { fill: var(--border-default, #3a403d); }',
      '[data-theme="dark"] .kg-edge.highlighted { stroke: var(--color-sage, #5a7d5c); }',
      '[data-theme="dark"] .kg-edge-arrow.highlighted { fill: var(--color-sage, #5a7d5c); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ============================================================
   * 数据读取：从 localStorage 获取掌握度
   * ============================================================ */

  /**
   * 获取指定模块的掌握度（0-100）
   * @param {string} relatedModule - 关联的练习模块 ID
   * @returns {number} 掌握度百分比
   */
  function getMastery(relatedModule) {
    try {
      var statsKey = 'bioquest_stats';
      var raw = localStorage.getItem(statsKey);
      if (!raw) return 0;
      var stats = JSON.parse(raw);
      if (!stats) return 0;
      // 归一化模块名：module1 → module_1（与 server.py / analytic.js 一致）
      var normalized = relatedModule && relatedModule.indexOf('_') === -1
        ? relatedModule.replace(/module(\d)/, 'module_$1')
        : relatedModule;
      // 优先从 stats.modules[normalized] 读取，兼容旧版扁平结构 stats[normalized]
      var mod = (stats.modules && stats.modules[normalized]) || stats[normalized];
      if (!mod || !mod.totalAnswered || mod.totalAnswered === 0) return 0;
      return Math.min(100, Math.round((mod.totalCorrect || 0) / mod.totalAnswered * 100));
    } catch (e) {
      return 0;
    }
  }

  /**
   * 根据掌握度计算节点半径
   * @param {number} mastery - 掌握度 0-100
   * @returns {number} 半径 18-32
   */
  function masteryToRadius(mastery) {
    return 18 + (mastery / 100) * 14;
  }

  /* ============================================================
   * 力导向布局算法
   * ============================================================ */

  /**
   * 初始化节点位置（圆形分布 + 随机扰动）
   */
  function initNodePositions() {
    var cx = _svgWidth / 2;
    var cy = _svgHeight / 2;
    var count = _nodes.length;
    var radius = Math.min(_svgWidth, _svgHeight) * 0.35;

    _nodes.forEach(function (node, i) {
      var angle = (2 * Math.PI * i) / count;
      var jitter = (Math.random() - 0.5) * 40;
      node.x = cx + (radius + jitter) * Math.cos(angle);
      node.y = cy + (radius + jitter) * Math.sin(angle);
      node.vx = 0;
      node.vy = 0;
    });
  }

  /**
   * 执行一步力导向迭代
   */
  function simulateStep() {
    var cx = _svgWidth / 2;
    var cy = _svgHeight / 2;
    var totalKinetic = 0;

    // 节点间斥力
    for (var i = 0; i < _nodes.length; i++) {
      for (var j = i + 1; j < _nodes.length; j++) {
        var ni = _nodes[i];
        var nj = _nodes[j];
        var dx = nj.x - ni.x;
        var dy = nj.y - ni.y;
        var distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1;
        var dist = Math.sqrt(distSq);
        var force = REPULSION / distSq;
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;

        if (!_dragNode || _dragNode !== ni) { ni.vx -= fx; ni.vy -= fy; }
        if (!_dragNode || _dragNode !== nj) { nj.vx += fx; nj.vy += fy; }
      }
    }

    // 边的弹簧引力
    for (var e = 0; e < _edges.length; e++) {
      var edge = _edges[e];
      var src = edge._srcNode;
      var tgt = edge._tgtNode;
      if (!src || !tgt) continue;

      var dx = tgt.x - src.x;
      var dy = tgt.y - src.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;
      var displacement = dist - SPRING_LENGTH;
      var force = SPRING_STRENGTH * displacement;
      var fx = (dx / dist) * force;
      var fy = (dy / dist) * force;

      if (!_dragNode || _dragNode !== src) { src.vx += fx; src.vy += fy; }
      if (!_dragNode || _dragNode !== tgt) { tgt.vx -= fx; tgt.vy -= fy; }
    }

    // 向心力 + 速度更新
    for (var k = 0; k < _nodes.length; k++) {
      var node = _nodes[k];
      if (_dragNode && _dragNode === node) continue;

      // 向心力
      node.vx += (cx - node.x) * CENTER_GRAVITY;
      node.vy += (cy - node.y) * CENTER_GRAVITY;

      // 阻尼
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      // 限速
      var speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > MAX_VELOCITY) {
        node.vx = (node.vx / speed) * MAX_VELOCITY;
        node.vy = (node.vy / speed) * MAX_VELOCITY;
      }

      // 更新位置
      node.x += node.vx;
      node.y += node.vy;

      // 边界约束
      var pad = 40;
      if (node.x < pad) { node.x = pad; node.vx = 0; }
      if (node.x > _svgWidth - pad) { node.x = _svgWidth - pad; node.vx = 0; }
      if (node.y < pad) { node.y = pad; node.vy = 0; }
      if (node.y > _svgHeight - pad) { node.y = _svgHeight - pad; node.vy = 0; }

      totalKinetic += node.vx * node.vx + node.vy * node.vy;
    }

    return totalKinetic;
  }

  /* ============================================================
   * SVG 渲染
   * ============================================================ */

  /**
   * 创建 SVG 元素辅助函数
   */
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          el.setAttribute(key, attrs[key]);
        }
      }
    }
    return el;
  }

  /**
   * 加载掌握度数据：从 localStorage 读取 BKT 掌握概率
   * 返回 { "概念名": 0.0-1.0, ... } 格式
   */
  function loadMasteryData() {
    try {
      // 优先从 bioquest_skill_mastery 读取 BKT 数据
      var raw = localStorage.getItem('bioquest_skill_mastery');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    try {
      // 后备：从 BKT 引擎读取
      if (typeof window.BioQuestAI !== 'undefined' && typeof window.BioQuestAI.loadHistory === 'function') {
        var history = window.BioQuestAI.loadHistory();
        if (history && history.mastery) return history.mastery;
      }
    } catch (e) {}
    return {};
  }

  /**
   * 构建 SVG 画布及所有元素
   */
  function buildSVG(container) {
    var rect = container.getBoundingClientRect();
    _svgWidth = rect.width || 800;
    _svgHeight = rect.height || 600;

    // 初始化运行时节点
    _nodes = GRAPH_NODES.map(function (n) {
      var mastery = getMastery(n.relatedModule);
      return {
        id: n.id,
        label: n.label,
        category: n.category,
        description: n.description,
        relatedModule: n.relatedModule,
        mastery: mastery,
        radius: masteryToRadius(mastery),
        x: 0, y: 0,
        vx: 0, vy: 0
      };
    });

    // 初始化运行时边（引用节点对象）
    var nodeMap = {};
    _nodes.forEach(function (n) { nodeMap[n.id] = n; });
    _edges = GRAPH_EDGES.map(function (e) {
      return {
        source: e.source,
        target: e.target,
        _srcNode: nodeMap[e.source],
        _tgtNode: nodeMap[e.target]
      };
    }).filter(function (e) {
      return e._srcNode && e._tgtNode;
    });

    // 初始化节点位置
    initNodePositions();

    // 创建 SVG
    var svg = svgEl('svg', {
      'class': 'kg-svg',
      'viewBox': '0 0 ' + _svgWidth + ' ' + _svgHeight,
      'preserveAspectRatio': 'xMidYMid meet'
    });

    // 定义箭头标记
    var defs = svgEl('defs');
    var marker = svgEl('marker', {
      'id': 'kg-arrowhead',
      'viewBox': '0 0 10 10',
      'refX': '10',
      'refY': '5',
      'markerWidth': '6',
      'markerHeight': '6',
      'orient': 'auto-start-reverse'
    });
    var arrowPath = svgEl('path', {
      'd': 'M 0 0 L 10 5 L 0 10 z',
      'class': 'kg-edge-arrow'
    });
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 边组
    var edgeGroup = svgEl('g', { 'class': 'kg-edges' });
    _edges.forEach(function (edge, i) {
      var line = svgEl('line', {
        'class': 'kg-edge',
        'data-source': edge.source,
        'data-target': edge.target,
        'marker-end': 'url(#kg-arrowhead)'
      });
      edge._el = line;
      edgeGroup.appendChild(line);
    });
    svg.appendChild(edgeGroup);

    // 节点组
    var nodeGroup = svgEl('g', { 'class': 'kg-nodes' });

    // 加载掌握度数据
    var mastery = loadMasteryData();

    _nodes.forEach(function (node) {
      var g = svgEl('g', {
        'class': 'kg-node',
        'data-id': node.id
      });

      var colors = CATEGORY_COLORS[node.category] || { fill: '#888', stroke: '#666' };

      // 根据掌握度调整节点颜色和大小
      var nodeMastery = mastery[node.label] || null;
      var adjustedRadius = node.radius;
      var adjustedFill = colors.fill;
      var adjustedStroke = colors.stroke;

      if (nodeMastery !== null) {
        // 3 级掌握度颜色：绿色(>0.8) / 黄色(0.5-0.8) / 红色(<0.5)
        if (nodeMastery > 0.8) {
          adjustedFill = '#3a8c5c';
          adjustedStroke = '#2a6c4c';
          adjustedRadius = node.radius * 1.15;
        } else if (nodeMastery > 0.5) {
          adjustedFill = '#c4956a';
          adjustedStroke = '#a4754a';
          adjustedRadius = node.radius * 1.0;
        } else {
          adjustedFill = '#c0553a';
          adjustedStroke = '#a0352a';
          adjustedRadius = node.radius * 0.85;
        }
        // 存储掌握度以便 tooltip 使用
        node.mastery = Math.round(nodeMastery * 100);
      } else {
        node.mastery = null;
      }

      var circle = svgEl('circle', {
        'class': 'kg-node-circle',
        'r': adjustedRadius,
        'fill': adjustedFill,
        'stroke': adjustedStroke
      });
      node._circleEl = circle;

      var label = svgEl('text', {
        'class': 'kg-node-label',
        'dy': '0.35em'
      });
      label.textContent = node.label;
      node._labelEl = label;

      g.appendChild(circle);
      g.appendChild(label);
      node._el = g;
      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);

    container.appendChild(svg);

    return svg;
  }

  /**
   * 更新 SVG 中节点和边的位置
   */
  function updatePositions() {
    _nodes.forEach(function (node) {
      if (node._el) {
        node._el.setAttribute('transform', 'translate(' + node.x + ',' + node.y + ')');
      }
    });

    _edges.forEach(function (edge) {
      if (!edge._el || !edge._srcNode || !edge._tgtNode) return;
      var src = edge._srcNode;
      var tgt = edge._tgtNode;

      // 计算从源节点边缘到目标节点边缘的线段
      var dx = tgt.x - src.x;
      var dy = tgt.y - src.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;

      var srcR = src.radius + 2;
      var tgtR = tgt.radius + 8; // 为箭头留空间

      var x1 = src.x + (dx / dist) * srcR;
      var y1 = src.y + (dy / dist) * srcR;
      var x2 = tgt.x - (dx / dist) * tgtR;
      var y2 = tgt.y - (dy / dist) * tgtR;

      edge._el.setAttribute('x1', x1);
      edge._el.setAttribute('y1', y1);
      edge._el.setAttribute('x2', x2);
      edge._el.setAttribute('y2', y2);
    });
  }

  /* ============================================================
   * 动画循环
   * ============================================================ */

  function startAnimation() {
    _frameCount = 0;
    _isStable = false;

    function tick() {
      _frameCount++;
      var kinetic = simulateStep();
      updatePositions();

      // 判断是否稳定
      if (!_isStable && (_frameCount > SETTLE_FRAMES || kinetic < STABLE_THRESHOLD)) {
        _isStable = true;
      }

      // 完全稳定且无拖拽时停止动画循环
      if (_isStable && !_dragNode && kinetic < STABLE_THRESHOLD) {
        _animFrameId = null;
        return;
      }

      // 稳定后降低帧率以节省性能，但拖拽时仍需实时更新
      if (_isStable && !_dragNode) {
        _animFrameId = requestAnimationFrame(function () {
          _animFrameId = requestAnimationFrame(tick);
        });
      } else {
        _animFrameId = requestAnimationFrame(tick);
      }
    }

    _animFrameId = requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
      _animFrameId = null;
    }
  }

  /* ============================================================
   * 交互：拖拽、悬停、点击
   * ============================================================ */

  function bindInteractions(svg, container) {
    var svgEl = svg;

    // —— 拖拽 ——
    function getNodeFromEvent(e) {
      var target = e.target;
      while (target && target !== svgEl) {
        if (target.classList && target.classList.contains('kg-node')) {
          return target.getAttribute('data-id');
        }
        target = target.parentNode;
      }
      return null;
    }

    function onPointerDown(e) {
      var nodeId = getNodeFromEvent(e);
      if (!nodeId) return;
      var node = _nodes.find(function (n) { return n.id === nodeId; });
      if (!node) return;

      _dragNode = node;
      _isStable = false; // 拖拽时重新激活动画

      // 捕获指针
      if (e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!_dragNode) return;

      var rect = svgEl.getBoundingClientRect();
      var scaleX = _svgWidth / rect.width;
      var scaleY = _svgHeight / rect.height;
      var mx = (e.clientX - rect.left) * scaleX;
      var my = (e.clientY - rect.top) * scaleY;

      _dragNode.x = mx;
      _dragNode.y = my;
      _dragNode.vx = 0;
      _dragNode.vy = 0;

      updatePositions();
      e.preventDefault();
    }

    function onPointerUp(e) {
      if (_dragNode) {
        _dragNode.vx = 0;
        _dragNode.vy = 0;
        _dragNode = null;
      }
    }

    svgEl.addEventListener('pointerdown', onPointerDown);
    svgEl.addEventListener('pointermove', onPointerMove);
    svgEl.addEventListener('pointerup', onPointerUp);
    svgEl.addEventListener('pointerleave', onPointerUp);

    // —— 悬停 Tooltip ——
    svgEl.addEventListener('pointerover', function (e) {
      var nodeId = getNodeFromEvent(e);
      if (!nodeId) return;
      var node = _nodes.find(function (n) { return n.id === nodeId; });
      if (!node) return;

      _hoverNode = node;
      showTooltip(node, e, container);
      highlightNode(node);
    });

    svgEl.addEventListener('pointerout', function (e) {
      if (_hoverNode) {
        hideTooltip();
        unhighlightNode();
        _hoverNode = null;
      }
    });

    // —— 点击跳转 ——
    svgEl.addEventListener('click', function (e) {
      var nodeId = getNodeFromEvent(e);
      if (!nodeId) return;
      var node = _nodes.find(function (n) { return n.id === nodeId; });
      if (!node) return;

      // 将节点信息写入 sessionStorage，供练习模块读取并做专项过滤
      try {
        sessionStorage.setItem('bioquest_kg_practice', JSON.stringify({
          nodeId: node.id,
          label: node.label,
          category: node.category,
          module: node.relatedModule,
          concept: node.label
        }));
      } catch (e) {}

      // 跳转到对应练习模块，并附带概念和学科参数
      var practiceHash = '#/practice?concept=' + encodeURIComponent(node.label);
      if (node.category) {
        practiceHash += '&category=' + encodeURIComponent(node.category);
      }
      if (node.relatedModule) {
        practiceHash += '&module=' + encodeURIComponent(node.relatedModule);
      }
      // navigateTo 不识别带参数的 hash，直接使用 location.hash
      window.location.hash = practiceHash;
    });
  }

  /* ============================================================
   * Tooltip 显示/隐藏
   * ============================================================ */

  function showTooltip(node, event, container) {
    if (!_tooltipEl) return;

    var colors = CATEGORY_COLORS[node.category] || { fill: '#888', bg: 'rgba(136,136,136,0.12)', text: '#666' };
    var masteryDisplay = '';
    if (node.mastery !== null && node.mastery !== undefined) {
      var masteryColor = node.mastery >= 70 ? 'var(--color-success, #3a8c5c)' :
                         node.mastery >= 40 ? 'var(--color-warning, #e8a830)' :
                         'var(--color-error, #c0553a)';
      masteryDisplay = '<div class="kg-tooltip-mastery">' +
        '<span>掌握度 ' + node.mastery + '%</span>' +
        '<div class="kg-tooltip-mastery-bar">' +
          '<div class="kg-tooltip-mastery-fill" style="width:' + node.mastery + '%;background:' + masteryColor + '"></div>' +
        '</div>' +
      '</div>';
    } else {
      masteryDisplay = '<div class="kg-tooltip-mastery" style="color:var(--text-muted,#8a8a8a);font-size:0.78rem;">暂无练习数据</div>';
    }

    _tooltipEl.innerHTML =
      '<div class="kg-tooltip-title">' + escapeHtml(node.label) + '</div>' +
      '<span class="kg-tooltip-category" style="background:' + colors.bg + ';color:' + colors.text + '">' + escapeHtml(node.category) + '</span>' +
      '<div class="kg-tooltip-desc">' + escapeHtml(node.description) + '</div>' +
      masteryDisplay;

    // 定位
    var rect = container.getBoundingClientRect();
    var x = event.clientX - rect.left + 16;
    var y = event.clientY - rect.top - 10;

    // 防止溢出右侧
    if (x + 280 > rect.width) x = event.clientX - rect.left - 296;
    // 防止溢出底部
    if (y + 160 > rect.height) y = rect.height - 170;

    _tooltipEl.style.left = x + 'px';
    _tooltipEl.style.top = y + 'px';
    _tooltipEl.classList.add('visible');
  }

  function hideTooltip() {
    if (_tooltipEl) {
      _tooltipEl.classList.remove('visible');
    }
  }

  /* ============================================================
   * 节点高亮（悬停时高亮关联节点和边）
   * ============================================================ */

  function highlightNode(node) {
    var connectedIds = {};
    connectedIds[node.id] = true;

    _edges.forEach(function (edge) {
      if (edge.source === node.id || edge.target === node.id) {
        connectedIds[edge.source] = true;
        connectedIds[edge.target] = true;
      }
    });

    _nodes.forEach(function (n) {
      if (connectedIds[n.id]) {
        n._el.classList.remove('dimmed');
        n._el.classList.add('highlighted');
      } else {
        n._el.classList.add('dimmed');
        n._el.classList.remove('highlighted');
      }
    });

    _edges.forEach(function (edge) {
      var isConn = edge.source === node.id || edge.target === node.id;
      if (isConn) {
        edge._el.classList.remove('dimmed');
        edge._el.classList.add('highlighted');
      } else {
        edge._el.classList.add('dimmed');
        edge._el.classList.remove('highlighted');
      }
    });
  }

  function unhighlightNode() {
    _nodes.forEach(function (n) {
      n._el.classList.remove('dimmed', 'highlighted');
    });
    _edges.forEach(function (edge) {
      edge._el.classList.remove('dimmed', 'highlighted');
    });
  }

  /* ============================================================
   * 搜索与过滤
   * ============================================================ */

  /**
   * 根据搜索词和分类过滤更新节点可见性
   */
  function applyFilters() {
    var query = _searchQuery.toLowerCase().trim();
    var hasCategoryFilter = Object.keys(_activeCategories).length > 0;

    _nodes.forEach(function (node) {
      var matchSearch = !query ||
        node.label.toLowerCase().indexOf(query) >= 0 ||
        node.description.toLowerCase().indexOf(query) >= 0 ||
        node.category.toLowerCase().indexOf(query) >= 0;

      var matchCategory = !hasCategoryFilter || _activeCategories[node.category];

      var visible = matchSearch && matchCategory;
      node._visible = visible;

      if (visible) {
        node._el.style.display = '';
        node._el.classList.remove('dimmed');
      } else {
        node._el.style.display = 'none';
        node._el.classList.remove('highlighted');
      }
    });

    // 更新边的可见性
    _edges.forEach(function (edge) {
      var srcVisible = edge._srcNode && edge._srcNode._visible !== false;
      var tgtVisible = edge._tgtNode && edge._tgtNode._visible !== false;
      var visible = srcVisible && tgtVisible;

      if (visible) {
        edge._el.style.display = '';
        edge._el.classList.remove('dimmed', 'highlighted');
      } else {
        edge._el.style.display = 'none';
      }
    });
  }

  /**
   * 绑定搜索框事件
   */
  function bindSearch(inputEl) {
    var debounceTimer = null;
    inputEl.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        _searchQuery = inputEl.value;
        applyFilters();
      }, 200);
    });
  }

  /**
   * 绑定分类筛选按钮事件
   */
  function bindFilters() {
    var filterBtns = _containerEl.querySelectorAll('.kg-filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-category');
        if (!cat) return;

        if (_activeCategories[cat]) {
          delete _activeCategories[cat];
          btn.classList.remove('active');
        } else {
          _activeCategories[cat] = true;
          btn.classList.add('active');
        }

        applyFilters();
      });
    });
  }

  /* ============================================================
   * HTML 转义
   * ============================================================ */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ============================================================
   * 窗口大小变化处理
   * ============================================================ */

  function handleResize() {
    if (!_containerEl) return;
    var graphContainer = _containerEl.querySelector('.kg-graph-container');
    if (!graphContainer) return;

    var rect = graphContainer.getBoundingClientRect();
    var newW = rect.width || 800;
    var newH = rect.height || 600;

    if (Math.abs(newW - _svgWidth) > 10 || Math.abs(newH - _svgHeight) > 10) {
      // 计算缩放比例
      var scaleX = newW / _svgWidth;
      var scaleY = newH / _svgHeight;

      _svgWidth = newW;
      _svgHeight = newH;

      // 重新定位节点
      _nodes.forEach(function (node) {
        node.x *= scaleX;
        node.y *= scaleY;
      });

      // 更新 SVG viewBox
      var svg = graphContainer.querySelector('.kg-svg');
      if (svg) {
        svg.setAttribute('viewBox', '0 0 ' + _svgWidth + ' ' + _svgHeight);
      }

      updatePositions();
    }
  }

  /* ============================================================
   * 构建页面 HTML
   * ============================================================ */

  function buildPageHTML() {
    // 统计各分类数量
    var catCounts = {};
    GRAPH_NODES.forEach(function (n) {
      catCounts[n.category] = (catCounts[n.category] || 0) + 1;
    });

    // 分类筛选按钮
    var filterBtns = '';
    var categories = Object.keys(CATEGORY_COLORS);
    categories.forEach(function (cat) {
      var colors = CATEGORY_COLORS[cat];
      var count = catCounts[cat] || 0;
      filterBtns += '<button class="kg-filter-btn" data-category="' + escapeHtml(cat) + '">' +
        '<span class="kg-filter-dot" style="background:' + colors.fill + '"></span>' +
        escapeHtml(cat) + ' (' + count + ')' +
        '</button>';
    });

    // 图例
    var legendItems = '';
    categories.forEach(function (cat) {
      var colors = CATEGORY_COLORS[cat];
      legendItems += '<span class="kg-legend-item">' +
        '<span class="kg-legend-dot" style="background:' + colors.fill + '"></span>' +
        escapeHtml(cat) +
        '</span>';
    });

    return '<div class="kg-page">' +
      '<div class="kg-header">' +
        '<h2 class="kg-title">生物学知识图谱</h2>' +
        '<p class="kg-subtitle">交互式概念关系图 — 拖拽节点、悬停查看详情、点击跳转练习</p>' +
      '</div>' +

      '<div class="kg-toolbar">' +
        '<div class="kg-search">' +
          '<svg class="kg-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
          '</svg>' +
          '<input type="text" class="kg-search-input" id="kg-search-input" placeholder="搜索概念，如：光合作用、DNA、遗传..." autocomplete="off" />' +
        '</div>' +
        '<div class="kg-filters">' + filterBtns + '</div>' +
      '</div>' +

      '<div class="kg-graph-container" id="kg-graph-container"></div>' +

      '<div class="kg-legend">' + legendItems + '</div>' +
      '<div class="kg-legend" style="margin-top:8px;">' +
        '<span class="kg-legend-item"><span class="kg-legend-dot" style="background:#3a8c5c;"></span>已掌握</span>' +
        '<span class="kg-legend-item"><span class="kg-legend-dot" style="background:#c4956a;"></span>初步掌握</span>' +
        '<span class="kg-legend-item"><span class="kg-legend-dot" style="background:#c0553a;"></span>薄弱</span>' +
        '<span class="kg-legend-item"><span class="kg-legend-dot" style="background:#4a4a4a;"></span>未练习</span>' +
      '</div>' +
      '<p class="kg-hint">节点颜色反映掌握程度（绿=已掌握 / 黄=初步掌握 / 红=薄弱） · 节点大小反映联系强度 · 连线表示知识依赖关系 · 点击节点跳转练习</p>' +
    '</div>';
  }

  /* ============================================================
   * 公开 API
   * ============================================================ */

  /**
   * 初始化知识图谱（挂载到指定容器）
   * @param {HTMLElement} target - 目标容器元素
   */
  function initKnowledgeGraph(target) {
    if (!target) {
      console.warn('[KnowledgeGraph] 未提供目标容器');
      return;
    }

    // 注入样式
    injectKnowledgeGraphStyles();

    // 停止之前的动画
    stopAnimation();

    // 断开之前的 ResizeObserver，避免内存泄漏
    if (_containerEl && _containerEl._resizeObserver) {
      _containerEl._resizeObserver.disconnect();
      delete _containerEl._resizeObserver;
    }

    // 重置状态
    _activeCategories = {};
    _searchQuery = '';
    _dragNode = null;
    _hoverNode = null;
    _containerEl = target;

    // 渲染页面 HTML
    target.innerHTML = buildPageHTML();

    // 获取图表容器
    var graphContainer = document.getElementById('kg-graph-container');
    if (!graphContainer) {
      console.warn('[KnowledgeGraph] 找不到图表容器');
      return;
    }

    // 创建 Tooltip
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'kg-tooltip';
    graphContainer.appendChild(_tooltipEl);

    // 构建 SVG
    var svg = buildSVG(graphContainer);

    // 绑定交互
    bindInteractions(svg, graphContainer);

    // 绑定搜索
    var searchInput = document.getElementById('kg-search-input');
    if (searchInput) {
      bindSearch(searchInput);
    }

    // 绑定分类筛选
    bindFilters();

    // 启动动画
    startAnimation();

    // 监听窗口大小变化
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () {
        handleResize();
      });
      ro.observe(graphContainer);
      _containerEl._resizeObserver = ro;
    } else {
      window.addEventListener('resize', handleResize);
    }

    console.log('[KnowledgeGraph] 初始化完成，共 ' + _nodes.length + ' 个节点，' + _edges.length + ' 条边');
  }

  /**
   * 渲染知识图谱页面（作为独立路由页面）
   * @param {HTMLElement} target - 页面内容容器
   */
  function renderKnowledgeGraphPage(target) {
    if (!target) {
      target = document.getElementById('page-content');
    }
    if (!target) {
      console.warn('[KnowledgeGraph] 找不到页面容器');
      return;
    }

    initKnowledgeGraph(target);
  }

  /* ============================================================
   * 暴露到全局
   * ============================================================ */
  window.initKnowledgeGraph = initKnowledgeGraph;
  window.renderKnowledgeGraphPage = renderKnowledgeGraphPage;
  window.injectKnowledgeGraphStyles = injectKnowledgeGraphStyles;

})();
