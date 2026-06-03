@echo off
chcp 65001 >nul
title ShangHaiFC

echo ================================
echo    ShangHaiFC - Business Tycoon
echo ================================
echo.
echo Save dir : saves
echo URL      : http://localhost:8765
echo.

REM Try python in PATH first, fallback to managed python
where python >nul 2>nul
if %errorlevel% equ 0 (
    start /B "ShangHaiFC-Server" cmd /c "python server.py"
) else (
    echo [ERROR] Python not found in PATH, trying managed Python...
    start /B "ShangHaiFC-Server" cmd /c ""C:\Users\lfish\.workbuddy\binaries\python\versions\3.13.12\python.exe" server.py"
)

timeout /t 3 /nobreak >nul
start http://localhost:8765
echo Server ready. Press any key to exit.
pause >nul
