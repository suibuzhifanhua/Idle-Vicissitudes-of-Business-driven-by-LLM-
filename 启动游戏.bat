@echo off
title ShangHaiFC

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo ================================
echo   ShangHaiFC - Business Tycoon
echo ================================
echo.
echo 存档目录: saves\
echo URL: http://localhost:8765
echo.

start /b python server.py
echo Starting server (server.py)...
timeout /t 3 /nobreak >nul
start http://localhost:8765
echo Server ready. Press any key to exit.
pause >nul
