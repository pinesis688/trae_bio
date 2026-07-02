"""
用 ffmpeg 生成一段 Lo-fi 风格 BGM（无版权问题，因为是程序生成）
- 多个 sine 波叠加 + 简单滤波制造氛围感
- 45 秒，立体声 44.1kHz
"""
import subprocess

# 主旋律：C 大调下行 - C5, A4, F4, D4 简单循环
NOTES = [
    (0,   523.25),   # C5
    (1.5, 440.00),   # A4
    (3.0, 349.23),   # F4
    (4.5, 293.66),   # D4
]

def make_bgm():
    # 用 lavfi 多音叠加
    # 简单做法：单音 sine 链 + 低通滤波
    filters = []
    for t, freq in NOTES:
        # 每个音持续 1.3s, 包络渐入渐出
        filters.append(
            f"sine=f={freq}:d=1.3,volume=0.15:enable='between(t,{t},{t+1.3})'"
        )

    bgm_path = "/workspace/video_assets/bgm/lofi_loop.wav"
    # 拼接所有音
    if filters:
        fc = "[0:a][1:a][2:a][3:a]concat=n=4:v=0:a=1[out]"
        cmd = ["ffmpeg", "-y"]
        for t, f in NOTES:
            cmd.extend(["-f", "lavfi", "-i", f"sine=f={f}:d=1.3"])
        cmd.extend(["-filter_complex", fc, "-map", "[out]",
                    "-ar", "44100", "-ac", "2",
                    "-t", "57",  # 总时长 57s
                    bgm_path])
        subprocess.run(cmd, check=True)
    print(f"BGM: {bgm_path}")


if __name__ == "__main__":
    make_bgm()
