"""
BioQuest 抖音宣传片 — 字幕配置 + ffmpeg 合成
"""
import os, subprocess, json

# 镜头时长（按脚本分镜表）
SHOTS = [
    # (id, start, duration, subtitle_text_or_None, narration_text)
    (1,  0.0, 4.0, "这个暑假，我写了一个网站。", None),
    (2,  4.0, 2.0, None, None),  # 代码滚动，纯画面
    (3,  6.0, 3.0, "生物学习平台 · BioQuest", "我是准高三，暑假闲着没事"),
    (4,  9.0, 5.0, None, "写了个生物学习平台——BioQuest"),
    (5, 14.0, 4.0, "拍照录题", "错题还要手抄？"),
    (6, 18.0, 4.0, "AI 导师", "问 AI 比问老师快"),
    (7, 22.0, 4.0, "知识图谱", "点一个概念，所有关联全连出来"),
    (8, 26.0, 5.0, "它会告诉你你哪里菜", "相当于请了个一对一老师"),
    (9, 31.0, 4.0, "错题分析", "错在哪 / 为什么错 / 关联哪个知识点"),
    (10,35.0, 5.0, "番茄钟 + 待办清单", "每次专注完自动记录"),
    (11,40.0, 4.0, "FSRS · OCR 双引擎 · 6 家大模型", "API Key 存你自己浏览器里"),
    (12,44.0, 3.0, "代码完全开源 · CC 协议", "我自己就是学生，知道学生没什么钱"),
    (13,47.0, 3.0, "虚拟实验室 & 生物动画  开发中", "开学前尽量肝出来"),
    (14,50.0, 4.0, "bio.dada.im", "账号 user / 密码 123456"),
    (15,54.0, 3.0, "开学前，让你同桌也看看", None),
]

# 生成 ASS 字幕（比 SRT 更可控，支持字体/描边/位置）
def make_ass():
    head = """[Script Info]
Title: BioQuest Promo
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,WenQuanYi Micro Hei,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,6,3,2,80,80,140,1
Style: Big,WenQuanYi Micro Hei,96,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,8,4,2,80,80,180,1
Style: Tag,WenQuanYi Micro Hei,84,&H00FFE600,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,8,4,2,80,80,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for shot_id, start, dur, subtitle, narration in SHOTS:
        if subtitle is None:
            continue
        end = start + dur
        # 转 ASS 时间格式 H:MM:SS.cs
        def fmt(t):
            h = int(t // 3600)
            m = int((t % 3600) // 60)
            s = t % 60
            cs = int((s - int(s)) * 100)
            return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"
        # 不同镜头用不同 style
        if shot_id in (1, 14, 15):
            style = "Big"
        elif shot_id in (3, 5, 6, 7, 8, 9, 10, 12, 13):
            style = "Default"
        else:
            style = "Tag"
        text = subtitle.replace("&", "&amp;").replace("\n", "\\N")
        events.append(f"Dialogue: 0,{fmt(start)},{fmt(end)},{style},,0,0,0,,{text}")

    return head + "\n".join(events) + "\n"


def main():
    ass_path = "/workspace/video_assets/subs/story.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(make_ass())
    print(f"字幕文件: {ass_path}")
    # 检查
    os.system(f"head -20 {ass_path}")


if __name__ == "__main__":
    main()
