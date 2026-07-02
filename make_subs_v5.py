"""
BioQuest 抖音宣传片 v5 — 精致字幕系统
- 多层字幕（主标题 + 副标题 + 镜头标签）
- 淡入淡出动画
- 背景半透明框
- 不同镜头不同视觉风格
- 底部进度条
"""
import os

# 完整时间轴（55s）
# 每个镜头: (id, start, end, main_text, sub_text, style)
# style: hero(开场大字) / tag(功能标签) / body(正文) / cta(行动号召) / outro(结尾金句)
SHOTS = [
    (1,  0.0,  3.0,  "这个网站", "是给高中生用的生物学习神器", "hero"),
    (2,  3.0,  9.0,  "BioQuest", "AI 驱动的生物学习平台", "intro"),
    (3,  9.0,  11.0, "拍照录题", "OCR 识别 · AI 自动解析", "tag"),
    (4,  11.0, 13.0, "AI 导师", "流式回答 · 6 家大模型", "tag"),
    (5,  13.0, 15.0, "知识图谱", "概念关联 · 一键展开", "tag"),
    (6,  15.0, 23.0, "错题分析", "拍一道错题，告诉你错在哪、为什么错\n关联哪个知识点、教材哪一章", "feature"),
    (7,  23.0, 30.0, "学习仪表盘", "热力图看勤奋\n雷达图看薄弱点\n趋势图看进步", "feature"),
    (8,  30.0, 37.0, "番茄钟 + 待办清单", "每次专注自动记录\n学不进去，先点个番茄", "feature"),
    (9,  37.0, 44.0, "开发中", "虚拟实验室 & 生物过程交互动画\n开学前陆续上线", "coming"),
    (10, 44.0, 50.0, "bio.dada.im", "账号 user · 密码 123456\n不用下载，浏览器打开直接用", "cta"),
    (11, 50.0, 55.0, "开学前", "让你同桌也看看", "outro"),
]

TOTAL = 55.0


def fmt(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    cs = int((s - int(s)) * 100)
    return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"


def make_ass():
    head = f"""[Script Info]
Title: BioQuest Promo v5
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: HeroMain,WenQuanYi Zen Hei,108,&H00FFFFFF,&H000000FF,&H00000000,&HCC000000,1,0,0,0,100,100,0,0,1,0,0,8,0,0,250,1
Style: HeroSub,WenQuanYi Zen Hei,56,&H00E0E0E0,&H000000FF,&H00000000,&H99000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,380,1
Style: IntroMain,WenQuanYi Zen Hei,120,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,5,3,8,0,0,200,1
Style: IntroSub,WenQuanYi Zen Hei,48,&H00FFE600,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,3,2,8,0,0,360,1
Style: TagMain,WenQuanYi Zen Hei,88,&H00FFE600,&H000000FF,&H00000000,&HCC000000,1,0,0,0,100,100,0,0,1,4,2,8,0,0,280,1
Style: TagSub,WenQuanYi Zen Hei,42,&H00CCCCCC,&H000000FF,&H00000000,&H99000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,420,1
Style: FeatureMain,WenQuanYi Zen Hei,76,&H00FFFFFF,&H000000FF,&H00000000,&HCC000000,1,0,0,0,100,100,0,0,1,4,2,8,0,0,300,1
Style: FeatureSub,WenQuanYi Zen Hei,46,&H00E0E0E0,&H000000FF,&H00000000,&HBB000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,440,1
Style: ComingMain,WenQuanYi Zen Hei,72,&H00FF9900,&H000000FF,&H00000000,&HCC000000,1,0,0,0,100,100,0,0,1,4,2,8,0,0,300,1
Style: ComingSub,WenQuanYi Zen Hei,44,&H00CCCCCC,&H000000FF,&H00000000,&HBB000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,440,1
Style: CtaMain,WenQuanYi Zen Hei,96,&H00FFE600,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,2,0,1,6,3,8,0,0,280,1
Style: CtaSub,WenQuanYi Zen Hei,42,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,4,2,8,0,0,460,1
Style: OutroMain,WenQuanYi Zen Hei,100,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,5,3,8,0,0,300,1
Style: OutroSub,WenQuanYi Zen Hei,52,&H00CCCCCC,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,2,8,0,0,460,1
Style: Label,WenQuanYi Zen Hei,32,&H00888888,&H000000FF,&H00000000,&H00000000,0,1,0,0,100,100,0,0,1,2,1,7,60,60,80,1
Style: Progress,WenQuanYi Zen Hei,20,&H00FFE600,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,0,0,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []

    for sid, start, end, main, sub, style in SHOTS:
        dur = end - start
        # 淡入淡出：前0.4s淡入，后0.5s淡出
        fade_in = 400
        fade_out = 500
        fade_str = f"{{\\fad({fade_in},{fade_out})}}"

        # 主标题样式映射
        main_style = {
            "hero": "HeroMain", "intro": "IntroMain", "tag": "TagMain",
            "feature": "FeatureMain", "coming": "ComingMain",
            "cta": "CtaMain", "outro": "OutroMain",
        }[style]
        sub_style = {
            "hero": "HeroSub", "intro": "IntroSub", "tag": "TagSub",
            "feature": "FeatureSub", "coming": "ComingSub",
            "cta": "CtaSub", "outro": "OutroSub",
        }[style]

        # 主标题（特殊处理换行）
        main_text = main.replace("\n", "\\N")
        events.append(
            f"Dialogue: 0,{fmt(start)},{fmt(end)},{main_style},,0,0,0,,{fade_str}{main_text}"
        )

        # 副标题
        if sub:
            sub_text = sub.replace("\n", "\\N")
            events.append(
                f"Dialogue: 1,{fmt(start)},{fmt(end)},{sub_style},,0,0,0,,{fade_str}{sub_text}"
            )

        # 镜头标签（左上角，小字斜体）
        label_map = {
            1: "INTRO", 2: "HOME", 3: "PHOTO", 4: "TUTOR", 5: "GRAPH",
            6: "WRONGBOOK", 7: "DASHBOARD", 8: "STUDY", 9: "COMING",
            10: "VISIT", 11: "SHARE",
        }
        label = label_map.get(sid, "")
        if label and sid > 2:  # 前两个镜头不显示标签
            events.append(
                f"Dialogue: 2,{fmt(start)},{fmt(end)},Label,,0,0,0,,{fade_str}{label}"
            )

    # 进度条（底部细线，全程显示，用 \clip 实现进度）
    # 简化版：每秒一个刻度
    for i in range(int(TOTAL)):
        t = float(i)
        pct = i / TOTAL
        # 进度条用矩形绘制
        w = int(1080 * pct)
        events.append(
            f"Dialogue: 3,{fmt(t)},{fmt(t+1)},Progress,,0,0,0,,{{\\p1}}m 0 1880 l {w} 1880 l {w} 1900 l 0 1900{{\\p0}}"
        )

    return head + "\n".join(events) + "\n"


if __name__ == "__main__":
    ass_path = "/workspace/video_assets/subs/story_v5.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(make_ass())
    print(f"字幕文件: {ass_path}")
    os.system(f"wc -l {ass_path}")
    os.system(f"head -40 {ass_path}")
