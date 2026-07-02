"""
BioQuest 抖音宣传片 v4 — 字幕配置
对应精简后的 9 镜头脚本，删除代码/开源相关镜头
"""
import os

# 镜头时长（按 v4 脚本分镜表，共 55s）
SHOTS = [
    # (id, start, duration, subtitle_text)
    (1,  0.0, 3.0, "这个网站，是给高中生用的生物学习神器。"),
    (2,  3.0, 6.0, "BioQuest"),
    (3,  9.0, 2.0, "拍照录题"),
    (4, 11.0, 2.0, "AI 导师"),
    (5, 13.0, 2.0, "知识图谱"),
    (6, 15.0, 8.0, "错题分析 · 相当于请了个一对一老师"),
    (7, 23.0, 7.0, "学习仪表盘 · 精确告诉你哪里菜"),
    (8, 30.0, 7.0, "番茄钟 + 待办清单 + 课程表"),
    (9, 37.0, 7.0, "虚拟实验室 & 生物动画  开发中"),
    (10,44.0, 6.0, "bio.dada.im  ·  账号 user / 密码 123456"),
    (11,50.0, 5.0, "开学前，让你同桌也看看"),
]


def make_ass():
    head = """[Script Info]
Title: BioQuest Promo v4
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
    for shot_id, start, dur, subtitle in SHOTS:
        end = start + dur
        def fmt(t):
            h = int(t // 3600)
            m = int((t % 3600) // 60)
            s = t % 60
            cs = int((s - int(s)) * 100)
            return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"
        if shot_id in (1, 10, 11):
            style = "Big"
        elif shot_id in (2, 9):
            style = "Tag"
        else:
            style = "Default"
        text = subtitle.replace("&", "&amp;").replace("\n", "\\N")
        events.append(f"Dialogue: 0,{fmt(start)},{fmt(end)},{style},,0,0,0,,{text}")

    return head + "\n".join(events) + "\n"


if __name__ == "__main__":
    ass_path = "/workspace/video_assets/subs/story.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(make_ass())
    print(f"字幕文件: {ass_path}")
    os.system(f"head -25 {ass_path}")
