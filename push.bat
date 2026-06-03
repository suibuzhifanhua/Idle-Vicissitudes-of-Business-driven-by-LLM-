@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  shanghaifc ^^ push to GitHub
echo ============================================
echo.

git status --short
echo.

:: Check if there are any changes (tracked or untracked)
git add -A --dry-run > nul 2>&1
git diff --quiet HEAD 2>nul
set DIFF=%errorlevel%

git ls-files --others --exclude-standard | findstr /v "^$" > nul 2>&1
set UNTRACKED=%errorlevel%

if %DIFF% == 0 if %UNTRACKED% neq 0 goto NO_CHANGE
if %DIFF% == 0 goto NO_CHANGE

:HAS_CHANGE
git add -A
echo Files staged:
git diff --cached --name-only
echo.

set /p MSG="Commit message (press Enter to auto): "
if "%MSG%"=="" (
    for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set TS=%%t
    set MSG=Update !TS!
)

git commit -m "%MSG%"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Commit failed.
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Check network or git config.
    pause
    exit /b 1
)

echo.
echo [OK] Pushed successfully!
goto END

:NO_CHANGE
echo Nothing changed, skipping push.

:END
echo.
pause
