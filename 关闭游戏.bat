@echo off
title Close ShangHaiFC

echo ================================
echo   Close ShangHaiFC
echo ================================
echo.

echo [1/2] Closing game server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Killed server PID: %%a
)
taskkill /F /FI "WINDOWTITLE eq ShangHaiFC*" >nul 2>&1

echo.
echo [2/2] Closing browser windows...
taskkill /F /FI "WINDOWTITLE eq *ShangHaiFC*" >nul 2>&1

echo.
echo ================================
echo   Game closed.
echo ================================
echo.
pause