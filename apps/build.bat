@echo off
rem Сборка трёх приложений (нужен только .NET Framework 4, он есть в Windows 10/11)
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist dist mkdir dist
for %%A in (habitflow:HabitFlow clipflow:ClipFlow kopilka:Kopilka) do for /f "tokens=1,2 delims=:" %%B in ("%%A") do (
  "%CSC%" /nologo /target:winexe /optimize+ /out:dist\%%C.exe /win32icon:%%B\app.ico /resource:%%B\app.ico,app.ico /r:System.dll /r:System.Core.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll %%B\%%C.cs
)
