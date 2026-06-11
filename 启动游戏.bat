@echo off
REM Author: Fisheep.L
chcp 65001 >nul
title ShangHaiFC

echo ================================
echo    ShangHaiFC - Business Tycoon
echo ================================
echo.
echo Save dir : saves
echo URL      : http://localhost:8765
echo.

REM Check server.py exists
if not exist "server.py" (
    echo [ERROR] server.py not found in current directory.
    pause >nul
    exit /b 1
)

REM Try python3, python, then py -3
where python3 >nul 2>nul
if %errorlevel% equ 0 (
    start /B "ShangHaiFC-Server" cmd /c "python3 server.py"
    goto :launch_browser
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    start /B "ShangHaiFC-Server" cmd /c "python server.py"
    goto :launch_browser
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    start /B "ShangHaiFC-Server" cmd /c "py -3 server.py"
    goto :launch_browser
)

echo [ERROR] Python not found. Please install Python 3.
pause >nul
exit /b 1

:launch_browser
timeout /t 3 /nobreak >nul
start http://localhost:8765
echo Server ready. Press any key to exit.
pause >nul
