@echo off
rem Собирает CyberpunkBuildAdvisor.exe (нужны: pip install pywebview pyinstaller pillow)
set PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
cd /d "%~dp0"
"%PY%" make_icon.py
"%PY%" -m PyInstaller --noconfirm --onefile --noconsole --name CyberpunkBuildAdvisor --icon icon.ico --add-data "index.html;." app.py
copy /y dist\CyberpunkBuildAdvisor.exe CyberpunkBuildAdvisor.exe
rmdir /s /q build dist
del CyberpunkBuildAdvisor.spec
pause
