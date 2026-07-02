"""
BioQuest 抖音宣传片 — 录屏脚本 v2
- 一次性启动 context 开启 video 录制
- 每个分镜导航到对应路由、做完操作、暂停足够时长
- ffmpeg 后处理把整段视频切成镜头 + 合成
"""
from playwright.sync_api import sync_playwright
import os, time, json

OUT = "/workspace/video_assets/clips"
BASE = "http://localhost:8000"

# 分镜表（id, 路由, 描述, 时长秒, 操作函数名）
SHOTS = [
    ("01_black",            None,                            "黑屏", 4, None),
    ("02_code",             None,                            "代码滚动", 2, "code"),
    ("03_login",            "/user",                         "登录", 3, "login"),
    ("04_particles",        "/",                             "首页粒子", 5, "particles"),
    ("05_photo_quiz",       "/photo-quiz",                   "拍照录题", 4, None),
    ("06_ai_tutor",         "/tutor",                        "AI 导师", 4, None),
    ("07_knowledge_graph",  "/knowledge-graph",              "知识图谱", 4, None),
    ("08_dashboard",        "/dashboard",                    "仪表盘", 5, None),
    ("09_wrongbook",        "/wrongbook",                    "错题本", 4, None),
    ("10_pomodoro",         "/study",                        "学习管理", 5, "pomodoro"),
    ("11_tech_codeshow",    None,                            "技术代码", 4, "tech"),
    ("12_github",           None,                            "GitHub", 3, "github"),
    ("13_coming_soon",      None,                            "开发中", 3, "coming"),
    ("14_endcard",          "/",                             "收尾大字", 4, "endcard"),
    ("15_outro",            None,                            "黑屏金句", 3, "outro"),
]


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

        # 第一帧：黑屏（用 about:blank 撑过 4 秒）
        page.goto("about:blank")
        time.sleep(4)

        # 代码滚动：在 bio.dada.im 主页停留 2s
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(2)

        # 登录页
        page.goto(f"{BASE}/index.html#/user", wait_until="networkidle")
        time.sleep(3)

        # 首页粒子 + 鼠标交互
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(1.5)
        import math
        for i in range(15):
            a = i * 0.4
            page.mouse.move(540 + 200*math.cos(a), 960 + 200*math.sin(a))
            time.sleep(0.2)

        # 拍照录题
        page.goto(f"{BASE}/index.html#/photo-quiz", wait_until="networkidle")
        time.sleep(4)

        # AI 导师
        page.goto(f"{BASE}/index.html#/tutor", wait_until="networkidle")
        time.sleep(4)

        # 知识图谱
        page.goto(f"{BASE}/index.html#/knowledge-graph", wait_until="networkidle")
        time.sleep(4)

        # 仪表盘
        page.goto(f"{BASE}/index.html#/dashboard", wait_until="networkidle")
        time.sleep(5)

        # 错题本
        page.goto(f"{BASE}/index.html#/wrongbook", wait_until="networkidle")
        time.sleep(4)

        # 学习管理（番茄钟）
        page.goto(f"{BASE}/index.html#/study", wait_until="networkidle")
        time.sleep(2)
        try:
            page.click("text=番茄钟", timeout=2000)
        except:
            pass
        time.sleep(3)

        # 收尾大字：回到首页
        page.goto(f"{BASE}/index.html#/", wait_until="networkidle")
        time.sleep(4)

        # 让浏览器空闲一会儿
        page.goto("about:blank")
        time.sleep(3)

        # 关闭 context 让视频落盘
        context.close()
        browser.close()

    # 找到生成的视频
    for f in os.listdir(OUT):
        if f.endswith(".webm"):
            size = os.path.getsize(os.path.join(OUT, f))
            print(f"  - {f}  ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
