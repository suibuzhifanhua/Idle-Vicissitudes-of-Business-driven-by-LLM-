@echo off
title ShangHaiFC Server

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo ================================
echo   ShangHaiFC - Business Tycoon
echo ================================
echo.
echo URL: http://localhost:8765
echo.

start /b python -m http.server 8765
echo Starting server...
timeout /t 3 /nobreak >nul
start http://localhost:8765
echo Server ready. Press any key to exit.
pause >nul