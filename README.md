# BioQuest — 生物竞赛学习平台

面向生物竞赛（联赛）备考的**纯前端**学习平台，集知识卡片、模拟试题、学习分析、错题本、AI 导师、虚拟实验室、社区讨论于一体。

> **架构**：纯前端 SPA + Supabase（数据/认证）。AI 调用由前端直连用户自配置的 LLM API（DeepSeek / 智谱 / 通义 / Kimi / NVIDIA / 硅基流动），无需后端运行时。`server.py` 仅作为开发期可选代理，生产部署不依赖。

## 许可证

本项目采用 [CC BY-NC-SA 4.0](./LICENSE)（署名-非商业性使用-相同方式共享 4.0）。

- 你可以自由使用、修改、分发本项目，**但不得用于商业目的**
- 衍生作品必须以相同协议发布
- 使用时需保留原作者署名

---

## 快速开始

```bash
# 纯静态部署，无需构建步骤
# 本地预览（任选其一）
npx serve .                  # Node.js
python -m http.server 8000   # Python
```

访问 `http://localhost:8000` 即可。

### 1. Supabase 配置（必需）

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中按顺序执行：
   - `sql/schema_safe.sql` — 创建所有表 + RLS 策略
   - `sql/incremental_update.sql` — 增量更新（user_key 列、新策略）
3. 在 `js/supabase-client.js` 顶部填入你的 Supabase URL 和 anon key（anon key 设计为公开，靠 RLS 保护数据）

### 2. AI API Key（用户自带，可选）

用户在「我的 → 设置」中配置个人 API Key，支持 6 家服务商：

| 服务商 | 免费额度 | 推荐模型 |
|---|---|---|
| DeepSeek | 500 万 tokens | `deepseek-chat` |
| 智谱 GLM | 2000 万 tokens | `glm-4-flash` |
| 阿里通义 | 100 万 tokens | `qwen-turbo` |
| 月之暗面 Kimi | 15 元体验金 | `moonshot-v1-8k` |
| NVIDIA NIM | 1000 次调用 | `meta/llama-3.3-70b-instruct` |
| 硅基流动 | 14 元额度 | `Qwen/Qwen2.5-7B-Instruct` |

API Key 仅保存在用户本机 localStorage，不上传服务器。每用户每日限 100 次调用，0:00 重置。

### 3. 可选：开发期 AI 代理

```bash
cp .env.example .env   # 填入 NVIDIA_API_KEY
python server.py       # 为未配置个人 Key 的用户提供默认代理
```

---

## 部署

纯静态托管，推荐：

| 平台 | 方式 |
|------|------|
| GitHub Pages | 推送仓库，开启 Pages 即可 |
| Vercel | `vercel --prod`，框架选 Other |
| Netlify | 拖拽上传或连接 Git |
| Cloudflare Pages | 连接 Git 仓库 |

无需环境变量配置（Supabase anon key 内置于前端，受 RLS 保护；AI Key 由用户自配）。

---

## 项目结构

```
bioquest/
├── index.html              # SPA 入口（hash 路由）
├── LICENSE                 # CC BY-NC-SA 4.0
├── server.py               # 可选：开发期 AI 代理
├── manifest.json / sw.js   # PWA 配置与服务工作线程
├── css/                    # 样式（Trae 设计系统）
│   ├── globals.css         # 设计 Token（颜色/字体/间距）
│   ├── home.css            # 主页 Hero 与模块卡片
│   └── ...
├── js/                     # 业务模块
│   ├── app.js              # SPA 路由与模块加载器
│   ├── supabase-client.js  # Supabase 客户端（认证/数据/存储）
│   ├── ai-client.js        # 6 家 LLM 统一封装 + 视觉 OCR
│   ├── fsrs-algorithm.js   # FSRS 间隔重复算法
│   ├── cards.js            # 知识卡片（Anki 风格）
│   ├── quiz.js / exam.js   # 模拟试题 / 联考
│   ├── wrongbook.js        # 错题本 + OCR
│   ├── photo-quiz.js       # 拍照录题 + OCR 出题
│   ├── tutor.js            # AI 导师（流式渲染）
│   ├── discussion.js       # 学科智能体讨论
│   ├── study.js            # 学习管理中心
│   ├── bio-lab.js          # 虚拟实验室
│   ├── knowledge-graph.js  # 知识图谱
│   ├── hero-sketch.js      # 主页粒子动画（p5.js）
│   └── ...
├── data/                   # 题库与卡片数据（JSON）
├── sql/                    # 数据库 Schema 与迁移
└── fonts/                  # 本地字体（LXGW WenKai）
```

---

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 知识卡片 | `/cards` | Anki 风格翻转卡，FSRS 算法安排复习 |
| 模拟试题 | `/practice` | 随机组卷、自动评分、错题收集 |
| 联考模考 | `/exam` | 限时模考，仿真题 |
| 错题本 | `/wrongbook` | 错题录入 + AI 分析 + OCR 识别 |
| 拍照录题 | `/photo-quiz` | OCR 识别题目，AI 生成选项与解析 |
| AI 导师 | `/tutor` | 流式问答，支持图片上传、SVG 渲染 |
| 学科讨论 | `/discussion` | 遗传学/生态学等学科智能体多轮讨论 |
| 学习管理 | `/study` | 课程表/待办/番茄钟/笔记/倒计时/工具 |
| 虚拟实验室 | `/bio-lab` | 步骤引导 + AI 实时引导 |
| 知识图谱 | `/map` | 概念网络可视化 |
| 学习分析 | `/dashboard` | 热力图、雷达图、趋势图 |
| 社区 | `/community` | 发帖/评论/点赞/Markdown |
| 教师模式 | `/teacher` | 题库管理、学生管理（需 user_key 验证） |

---

## 关键算法

<details>
<summary><b>FSRS 间隔重复算法</b>（点击展开）</summary>

采用 FSRS（Free Spaced Repetition Scheduler）替代传统 SM-2，基于记忆三成分模型（稳定度 S / 可检索性 R / 难度 D）动态计算下次复习时间。

```js
// 核心公式：可检索性随时间衰减
R(t) = (1 + t / (9 * S))^(-1)
// 稳定度更新：复习后记忆稳定度增长
S' = S * (1 + exp(-w) * (11 - D) * R^(-w) * ((1 - R) * R) - 1)
// 下次复习间隔
I = S' * (R_target / (1 - R_target))^(1/w - 1)
```

用户自评难度（再次 / 困难 / 良好 / 容易）映射为评分 1-4，驱动稳定度与难度更新。详见 `js/fsrs-algorithm.js`。

</details>

<details>
<summary><b>OCR 双引擎管线</b>（视觉模型优先 + Tesseract 兜底）</summary>

为提升中英文识别准确率并支持斜体，采用双层架构：

1. **视觉模型优先**：若用户配置了 API Key，调用 GLM-4V / Qwen-VL / Llama-Vision 等多模态模型，prompt 要求用 Markdown `*斜体*` 标记斜体文字、保留 LaTeX 公式
2. **图像预处理**（Tesseract 路径）：2x 放大 → 灰度化 → 对比度线性拉伸 → 二值化（阈值 140）
3. **Tesseract 兜底**：WASM 引擎 + `chi_sim+eng` 语言包，PSM 6（单一文本块）优先，失败回退 PSM 3（全自动）
4. **后处理修正**：10 条正则修正常见错字（行末标点、全角空格、断行等号、括号空格等）

```js
// 预处理：对比度线性拉伸
const min = Math.min(...gray), max = Math.max(...gray);
const stretched = gray.map(v => ((v - min) / (max - min)) * 255);
// 二值化
const bin = stretched.map(v => v > 140 ? 255 : 0);
```

详见 `js/wrongbook.js` 的 `_preprocessImage` / `_runTesseractOcr` / `_postprocessOcrText`，`js/photo-quiz.js` 的 `_ocrImage`。

</details>

<details>
<summary><b>AI 流式渲染</b>（增量 textContent + 完成后 Markdown）</summary>

为避免长文本 O(n²) 性能退化，流式阶段使用 `textContent` 增量追加，完成后再一次性 Markdown 渲染：

```js
// 流式阶段：纯文本追加，O(1) 每帧
chunkEl.textContent += delta;
// 完成后：一次性渲染 Markdown + SVG 代码块实时渲染
finalEl.innerHTML = marked(text);
renderSvgCodeBlocks(finalEl);  // 提取 ```svg 块并渲染为内联 SVG
```

所有 `[[ANIM:xxx]]` 动画标签在流式输出前通过 `_extractAnim` 正则过滤。

</details>

<details>
<summary><b>主页粒子动画「Cytoplasmic Drift」</b>（Perlin 噪声流场）</summary>

基于 p5.js 的算法艺术作品，隐喻细胞质流动：

- **流场**：二维 Perlin 噪声生成向量场，z 轴随时间演化（`NOISE_Z += 0.0028`）
- **粒子生命周期**：85 个粒子沿流场漂移，老化后于边缘重生（淡入淡出）
- **DNA 状连线**：相邻粒子以衰减线段连接，叠加正弦呼吸模拟双螺旋
- **趋化性交互**：鼠标 150px 内粒子向光标汇聚
- **固定种子**：`__heroSeed = 20260628` 保证可复现

```js
// 流场采样
const angle = noise(xoff, yoff, NOISE_Z) * TWO_PI * 2;
flowField[x + y * cols] = { x: cos(angle), y: sin(angle) };
```

CSS 兜底动画在 p5.js CDN 阻断时启用。详见 `js/hero-sketch.js`。

</details>

<details>
<summary><b>番茄钟-待办数据关联</b></summary>

学习管理中心实现待办与番茄钟的双向绑定：

```js
// 待办页：点击 🍅 关联任务，跳转番茄钟
_pomodoroLinkedTask = taskId;
_activeTab = 'pomodoro';
// 番茄完成：自动标记待办进度
const newCount = (task.pomodoro_count || 0) + 1;
await updateStudyTask(linkedTaskId, { pomodoro_count: newCount });
```

底部「今日学习节奏」常驻卡片实时聚合：待办数 / 今日番茄数 / 待复习题数 / 联考倒计时。详见 `js/study.js`。

</details>

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 JavaScript（SPA hash 路由）、CSS3、p5.js |
| 数据 | Supabase（PostgreSQL + Auth + Storage + RLS） |
| AI | 前端直连 6 家 LLM（SSE 流式）+ 视觉多模态 OCR |
| OCR | Tesseract.js v5（WASM）+ 视觉模型 |
| 字体 | LXGW WenKai（本地加载） |
| 设计 | Trae 设计系统（Modern Botanical Laboratory） |

## 安全说明

- `.env` 被 `.gitignore` 忽略，密钥不进入仓库
- Supabase anon key 公开但受 RLS 策略保护，service_role key 绝不前端使用
- 用户 API Key 仅存 localStorage，每用户每日 100 次限额
- 社区内容移除 HTML 标签防 XSS
- 教师模式增删学生需 8 位 user_key 验证

## License

[CC BY-NC-SA 4.0](./LICENSE) — 署名-非商业性使用-相同方式共享 4.0 国际许可证。
