"""
BioQuest 抖音宣传片 v4 — 录屏脚本
严格匹配 v4 脚本时间轴（55s）
9 个镜头，删除代码/GitHub 相关镜头
"""
from playwright.sync_api import sync_playwright
import os, time, math

OUT = "/workspace/video_assets/clips_v4"
BASE = "http://localhost:8000"


def main():
    os.makedirs(OUT, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=[
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
        ])
        context = browser.new_context(
            viewport={"width": 1080, "height": 1920},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
            record_video_dir=OUT,
            record_video_size={"width": 1080, "height": 1920},
        )
        page = context.new_page()

        # 镜头 1 (0-3s): 黑屏 + 登录页闪过
        page.goto("about:blank")
        time.sleep(1.0)
        page.goto(f"{BASE}/index.html#/user", wait_until="networkidle")
        time.sleep(2.0)

        # 镜头 2 (3-9s): 首页粒子动画 + 鼠标画圈 6s
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(1.5)
        for i in range(22):
            a = i * 0.35
            page.mouse.move(540 + 220*math.cos(a), 960 + 220*math.sin(a))
            time.sleep(0.18)

        # 镜头 3 (9-15s): 快切三段，每段 2s
        # 3a 拍照录题
        page.goto(f"{BASE}/index.html#/photo-quiz", wait_until="networkidle")
        time.sleep(2.0)
        # 3b AI 导师
        page.goto(f"{BASE}/index.html#/tutor", wait_until="networkidle")
        time.sleep(2.0)
        # 3c 知识图谱
        page.goto(f"{BASE}/index.html#/knowledge-graph", wait_until="networkidle")
        time.sleep(2.0)

        # 镜头 4 (15-23s): 错题本 8s
        page.goto(f"{BASE}/index.html#/wrongbook", wait_until="networkidle")
        time.sleep(3.0)
        # 模拟滚动展示
        page.mouse.move(540, 1200)
        page.mouse.wheel(0, 400)
        time.sleep(2.0)
        page.mouse.wheel(0, 300)
        time.sleep(3.0)

        # 镜头 5 (23-30s): 仪表盘 7s
        page.goto(f"{BASE}/index.html#/dashboard", wait_until="networkidle")
        time.sleep(3.0)
        page.mouse.move(540, 800)
        time.sleep(2.0)
        page.mouse.wheel(0, 200)
        time.sleep(2.0)

        # 镜头 6 (30-37s): 学习管理（番茄钟）7s
        page.goto(f"{BASE}/index.html#/study", wait_until="networkidle")
        time.sleep(2.0)
        try:
            page.click("text=番茄钟", timeout=2000)
        except:
            pass
        time.sleep(5.0)

        # 镜头 7 (37-44s): 回首页粒子动画 + 开发中标签 7s
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(3.0)
        for i in range(10):
            a = i * 0.4
            page.mouse.move(540 + 180*math.cos(a), 960 + 180*math.sin(a))
            time.sleep(0.15)
        time.sleep(2.5)

        # 镜头 8 (44-50s): 首页定格大字 6s
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(6.0)

        # 镜头 9 (50-55s): 黑屏金句 5s
        page.goto("about:blank")
        time.sleep(5.0)

        context.close()
        browser.close()

    # 列出生成的视频
    for f in sorted(os.listdir(OUT)):
        if f.endswith(".webm"):
            size = os.path.getsize(os.path.join(OUT, f))
            print(f"  - {f}  ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
