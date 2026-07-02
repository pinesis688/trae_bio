"""
BioQuest 抖音宣传片 v6 — 多转场合成
- 把录屏切成 11 段（对应 11 个镜头）
- 镜头间加不同转场：闪白/缩放/模糊/黑场/滑动
- 每段加调色 + 暗角
- 烧入 v5 字幕
"""
import subprocess, os

SRC = "/workspace/video_assets/clips_v4/page@794c069eca8a52d5acaa0df83b36107c.webm"
BGM = "/workspace/video_assets/bgm/lofi_pro.wav"
SUBS = "/workspace/video_assets/subs/story_v5.ass"
OUT_DIR = "/workspace/video_assets/clips_v6"
os.makedirs(OUT_DIR, exist_ok=True)
FINAL = "/workspace/video_assets/output/bioquest_promo_v6.mp4"

# 镜头时间轴（与 v5 字幕一致）
# (id, start, end, transition_in)
SHOTS = [
    (1,  0.0,  3.0,  "fade"),      # 开场淡入
    (2,  3.0,  9.0,  "flash"),     # 闪白
    (3,  9.0,  11.0, "zoom"),      # 缩放推进
    (4,  11.0, 13.0, "slide"),     # 左滑
    (5,  13.0, 15.0, "blur"),      # 模糊
    (6,  15.0, 23.0, "flash"),     # 闪白
    (7,  23.0, 30.0, "zoom"),      # 缩放
    (8,  30.0, 37.0, "black"),     # 黑场
    (9,  37.0, 44.0, "blur"),      # 模糊
    (10, 44.0, 50.0, "flash"),     # 闪白
    (11, 50.0, 55.0, "fade"),      # 淡出
]


def cut_shots():
    """把源视频切成 11 段"""
    clips = []
    for sid, start, end, trans in SHOTS:
        dur = end - start
        out = f"{OUT_DIR}/shot_{sid:02d}.mp4"
        # 每段加调色 + 暗角
        vf = f"eq=contrast=1.08:saturation=1.15:brightness=0.02,vignette=PI/5"
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start), "-t", str(dur),
            "-i", SRC,
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-an",  # 无音频，后面统一加
            out
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        clips.append(out)
        print(f"  ✓ 镜头 {sid} ({start}-{end}s, {dur}s, {trans})")
    return clips


def apply_transitions_and_concat(clips):
    """对每段加入场转场，然后 concat"""
    processed = []
    for i, (sid, start, end, trans) in enumerate(SHOTS):
        inp = clips[i]
        out = f"{OUT_DIR}/proc_{sid:02d}.mp4"
        dur = end - start

        if trans == "fade":
            # 淡入 0.4s（第一段）或淡出（最后一段）
            if i == 0:
                vf = "fade=t=in:st=0:d=0.5"
            else:
                vf = "fade=t=out:st={}:d=0.5".format(dur - 0.5)
        elif trans == "flash":
            # 闪白：前 0.15s 白场淡入，0.15-0.3s 淡出
            vf = f"fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=0.15:d=0.15:color=white"
        elif trans == "zoom":
            # 缩放推进：前 0.4s 从 105% 缩到 100%
            vf = f"scale=1134:2016:flags=lanczos,zoompan=z='min(1.05,1.05-0.05*on/{dur*25})':d=1:s=1080x1920:fps=25"
        elif trans == "slide":
            # 左滑：用 crop + offset 模拟（简化为淡入）
            vf = "fade=t=in:st=0:d=0.3,fade=t=out:st={}:d=0.3".format(dur - 0.3)
        elif trans == "blur":
            # 模糊过渡：前 0.3s 模糊
            vf = f"gblur=sigma=20:enable='lt(t,0.3)',fade=t=in:st=0:d=0.3"
        elif trans == "black":
            # 黑场：前 0.2s 黑场
            vf = "fade=t=in:st=0:d=0.2:color=black"
        else:
            vf = "null"

        cmd = [
            "ffmpeg", "-y",
            "-i", inp,
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-an",
            out
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        processed.append(out)
        print(f"  ✓ 转场 {sid}: {trans}")

    return processed


def concat_and_finalize(processed):
    """拼接所有镜头 + 加字幕 + BGM"""
    # 先 concat
    concat_list = f"{OUT_DIR}/concat.txt"
    with open(concat_list, "w") as f:
        for p in processed:
            f.write(f"file '{p}'\n")

    concat_out = f"{OUT_DIR}/concat.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        concat_out
    ], check=True, capture_output=True)
    print(f"  ✓ 拼接完成: {concat_out}")

    # 加字幕 + BGM + 全局调色
    cmd = [
        "ffmpeg", "-y",
        "-i", concat_out,
        "-i", BGM,
        "-vf", f"ass={SUBS}",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-level", "4.1",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest",
        "-movflags", "+faststart",
        FINAL
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"\n✓ 最终视频: {FINAL}")


def main():
    print("步骤 1: 切片")
    clips = cut_shots()
    print("\n步骤 2: 加转场")
    processed = apply_transitions_and_concat(clips)
    print("\n步骤 3: 拼接 + 字幕 + BGM")
    concat_and_finalize(processed)

    # 检查
    r = subprocess.run([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size,bit_rate",
        "-of", "default=noprint_wrappers=1",
        FINAL
    ], capture_output=True, text=True)
    print(r.stdout)


if __name__ == "__main__":
    main()
