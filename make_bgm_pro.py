"""
合成 Lo-fi BGM（简化版，用多个 lavfi 源 amix）
- kick: sine 60Hz + 包络
- hat: anoisesrc pink 短促
- bass: sine 低音
- vinyl: anoisesrc 持续低音量
"""
import subprocess

BGM = "/workspace/video_assets/bgm/lofi_pro.wav"

# 用 ffmpeg 一次性合成
cmd = [
    "ffmpeg", "-y",
    # kick: 60Hz 正弦，持续 55s
    "-f", "lavfi", "-i", "sine=f=60:d=55",
    # hat: pink 噪点
    "-f", "lavfi", "-i", "anoisesrc=d=55:c=pink:r=44100",
    # bass: 65Hz 低音
    "-f", "lavfi", "-i", "sine=f=65:d=55",
    # melody: 440Hz 主旋律
    "-f", "lavfi", "-i", "sine=f=440:d=55",
    # vinyl: 白噪
    "-f", "lavfi", "-i", "anoisesrc=d=55:c=white:r=44100",
    # 混合：kick 主导，其他做氛围
    "-filter_complex",
    # kick: 加节拍包络（每 0.5s 一个脉冲）
    "[0:a]volume=0.7,tremolo=f=2:d=0.9[k];"
    # hat: 高通 + 短包络
    "[1:a]highpass=f=6000,volume=0.15,tremolo=f=4:d=0.95[h];"
    # bass: 低通 + 长包络
    "[2:a]lowpass=f=200,volume=0.4,tremolo=f=0.375:d=0.8[b];"
    # melody: 中频带 + 颤音
    "[3:a]bandpass=f=440:width_type=h:w=200,volume=0.3,tremolo=f=2:d=0.7[m];"
    # vinyl: 极低音量
    "[4:a]lowpass=f=2000,volume=0.04[v];"
    # 混合
    "[k][h][b][m][v]amix=inputs=5:duration=longest:normalize=0[out]",
    "-map", "[out]",
    "-af", "afade=t=in:st=0:d=1,afade=t=out:st=53:d=2,volume=0.9",
    "-ar", "44100", "-ac", "2",
    "-t", "55",
    BGM
]
subprocess.run(cmd, check=True)
print(f"BGM: {BGM}")
