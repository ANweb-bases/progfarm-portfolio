"""Десктопное окно для index.html (WebView2). Сборка в .exe: build.bat"""
import pathlib
import sys

import webview

base = pathlib.Path(getattr(sys, "_MEIPASS", pathlib.Path(__file__).parent))
data = pathlib.Path.home() / "AppData" / "Local" / "CyberpunkBuildAdvisor"  # здесь хранятся последние введённые данные
data.mkdir(parents=True, exist_ok=True)

webview.create_window(
    "Night City Build Advisor", str(base / "index.html"), width=1180, height=780, min_size=(900, 600), background_color="#05060a"
)
webview.start(private_mode=False, storage_path=str(data), http_server=True)
