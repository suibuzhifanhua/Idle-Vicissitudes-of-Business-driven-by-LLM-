@echo off
chcp 65001 >nul
title Close ShangHaiFC

echo ================================
echo   Close ShangHaiFC
echo ================================
echo.

echo [1/2] Closing game server...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo Server killed.

echo.
echo ================================
echo   Game closed.
echo ================================
echo.
pause
