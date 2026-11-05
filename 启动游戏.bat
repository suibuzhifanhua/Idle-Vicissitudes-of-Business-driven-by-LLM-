@echo off
REM Author: Fisheep.L
setlocal enabledelayedexpansion
set PYTHONDONTWRITEBYTECODE=1
chcp 65001 >nul
title ShangHaiFC

pushd "%~dp0"
set "PROJECT_DIR=%CD%"
set "PORT=8765"
set "URL=http://localhost:%PORT%"
set "PING=http://127.0.0.1:%PORT%/api/ping"
set "PYVER=3.12.10"
set "PYFILE=%TEMP%\python-%PYVER%-amd64.exe"
set "MINSIZE=20000000"
set "EXPECTED_PYTHON_SHA256=67b5635e80ea51072b87941312d00ec8927c4db9ba18938f7ad2d27b328b95fb"

echo ================================
echo    ShangHaiFC - Business Tycoon
echo ================================
echo.
echo Project  : %PROJECT_DIR%
echo Save dir : saves
echo URL      : %URL%
echo.

if not exist "%PROJECT_DIR%\server.py" (
    echo [ERROR] server.py not found next to this script.
    pause >nul
    popd
    exit /b 1
)

REM ---- curl is needed for readiness checks and for the mirror download ----
set "HAVE_CURL="
where curl >nul 2>nul
if not errorlevel 1 set "HAVE_CURL=1"

REM ---- already running? then do not start a second server ----
if defined HAVE_CURL (
    curl -s -o nul --max-time 2 "%PING%" 2>nul
    if not errorlevel 1 (
        echo [OK] A server is already listening on port %PORT%.
        goto :open_browser
    )
)

:probe_python
REM ---- accept an interpreter only if it can really execute code ----
call :check_exe python3
if defined PYCMD_EXE goto :start_server
call :check_exe python
if defined PYCMD_EXE goto :start_server
call :check_py
if defined PYCMD_EXE goto :start_server
call :check_exe "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if defined PYCMD_EXE goto :start_server

goto :auto_install

:start_server
echo [OK] Using interpreter: %PYCMD_EXE% %PYCMD_ARGS%
start "" /B "%PYCMD_EXE%" %PYCMD_ARGS% "%PROJECT_DIR%\server.py" --host 127.0.0.1 --port %PORT%

if not defined HAVE_CURL goto :open_browser_unverified

set /a TRIES=0
:wait_ready
set /a TRIES+=1
curl -s -o nul --max-time 2 "%PING%" 2>nul
if not errorlevel 1 goto :open_browser
if %TRIES% geq 15 goto :start_failed
timeout /t 1 /nobreak >nul
goto :wait_ready

:open_browser_unverified
echo [WARN] curl.exe not available, cannot verify readiness; opening browser in 4s.
timeout /t 4 /nobreak >nul
goto :open_browser

:open_browser
echo [OK] Server is ready. Opening browser at %URL%
start "" "%URL%"
echo.
echo Keep this window open - closing it also stops the server.
echo To quit properly, use the in-game exit button or close this window.
pause >nul
popd
exit /b 0

:start_failed
echo.
echo [ERROR] Server never started listening on port %PORT% (waited up to ~30s).
echo         Look for a Python traceback just above this line. Usual causes:
echo           - server.py raised on startup
echo           - port %PORT% is held by another process: netstat -ano ^| findstr %PORT%
echo           - the interpreter chosen above is not the one you expected
echo         Reproduce it by hand in this folder:
echo             python server.py --host 127.0.0.1 --port %PORT%
pause >nul
popd
exit /b 1

REM ==================================================================
REM  Auto-download Python only after the official SHA-256 is verified.
REM  Order: Huawei Cloud -> USTC -> ZJU -> npmmirror(Ali) -> python.org
REM ==================================================================
:auto_install
echo.
echo [INFO] No usable Python found (checked python3, python, py -3 and the
echo        per-user folder %LOCALAPPDATA%\Programs\Python\Python312).
echo.
if not defined HAVE_CURL goto :manual_hint
echo A mirror copy of python-%PYVER%-amd64.exe can be downloaded and checked
echo against the official SHA-256 before installation.
echo Mirrors tried: Huawei Cloud, USTC, ZJU, npmmirror, python.org.
echo.
choice /C YN /T 30 /D N /M "Download and install Python %PYVER% now?"
if errorlevel 2 (
    echo [INFO] Skipped. Install Python yourself, then run this script again.
    pause >nul
    popd
    exit /b 1
)

if exist "%PYFILE%" del /f /q "%PYFILE%" >nul 2>nul
set "MIRROR="
for %%U in (
    "https://mirrors.huaweicloud.com/python/%PYVER%/python-%PYVER%-amd64.exe"
    "https://mirrors.ustc.edu.cn/python/%PYVER%/python-%PYVER%-amd64.exe"
    "https://mirrors.zju.edu.cn/python/%PYVER%/python-%PYVER%-amd64.exe"
    "https://registry.npmmirror.com/-/binary/python/%PYVER%/python-%PYVER%-amd64.exe"
    "https://www.python.org/ftp/python/%PYVER%/python-%PYVER%-amd64.exe"
) do if not defined MIRROR call :try_download "%%~U"

if not defined MIRROR goto :download_failed

echo [OK] SHA-256 verified installer (!DLBYTES! bytes) from: !MIRROR!
echo Checking the Windows Authenticode signature...
call :verify_authenticode
if errorlevel 1 (
    echo [ERROR] Authenticode validation failed. Installer removed.
    del /f /q "%PYFILE%" >nul 2>nul
    popd
    exit /b 1
)

echo Installing for this user; a progress bar will appear (up to a couple of minutes).
start "" /WAIT "%PYFILE%" /passive InstallAllUsers=0 PrependPath=1 Include_launcher=1 InstallLauncherAllUsers=0 Include_test=0 AssociateFiles=0
del /f /q "%PYFILE%" >nul 2>nul

REM ---- PATH in this window is stale, so look for the interpreter on disk ----
call :check_exe "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if defined PYCMD_EXE goto :start_server
call :check_exe python
if defined PYCMD_EXE goto :start_server
call :check_py
if defined PYCMD_EXE goto :start_server

echo.
echo [ERROR] Install reported done but no interpreter was found.
echo         Close this window and open it again - the PATH update only reaches
echo         new shells - then double-click this script once more.
pause >nul
popd
exit /b 1

:try_download
REM %~1 = mirror URL; size and official SHA-256 must both pass.
echo [..] Trying %~1
curl -fL --retry 2 --connect-timeout 8 --max-time 600 -o "%PYFILE%" "%~1" 2>nul
if errorlevel 1 exit /b 1
set "DLBYTES="
for %%F in ("%PYFILE%") do set "DLBYTES=%%~zF"
if not defined DLBYTES exit /b 1
if %DLBYTES% LSS %MINSIZE% (
    echo        too small, only !DLBYTES! bytes - treating as a bad mirror
    del /f /q "%PYFILE%" >nul 2>nul
    exit /b 1
)

set "FILE_HASH="
for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%PYFILE%" SHA256 ^| findstr /r "^[0-9a-fA-F][0-9a-fA-F]*$"') do set "FILE_HASH=%%H"
if not defined FILE_HASH (
    echo        SHA-256 could not be computed - treating as a bad mirror
    del /f /q "%PYFILE%" >nul 2>nul
    exit /b 1
)
if /i not "!FILE_HASH!"=="!EXPECTED_PYTHON_SHA256!" (
    echo        checksum mismatch
    echo          expected: !EXPECTED_PYTHON_SHA256!
    echo          actual:   !FILE_HASH!
    del /f /q "%PYFILE%" >nul 2>nul
    exit /b 1
)
set "MIRROR=%~1"
exit /b 0

:verify_authenticode
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = Get-AuthenticodeSignature -FilePath '%PYFILE%'; if ($s.Status -ne 'Valid') { exit 2 }; if ($s.SignerCertificate.Subject -notlike '*Python Software Foundation*') { exit 3 }; exit 0"
if errorlevel 1 exit /b 1
exit /b 0

:download_failed
echo.
echo [ERROR] Every mirror failed size/checksum verification.
goto :manual_hint

:manual_hint
echo         Download the installer yourself and run it, choosing "Add python.exe to PATH":
echo.
echo           https://mirrors.huaweicloud.com/python/%PYVER%/python-%PYVER%-amd64.exe
echo           https://mirrors.ustc.edu.cn/python/%PYVER%/python-%PYVER%-amd64.exe
echo           https://www.python.org/ftp/python/%PYVER%/python-%PYVER%-amd64.exe
echo.
echo         Official SHA-256: %EXPECTED_PYTHON_SHA256%
echo         Then double-click this script again.
pause >nul
popd
exit /b 1

:check_exe
if not exist %1 exit /b 1
%~1 -c "import sys" >nul 2>nul
if errorlevel 1 exit /b 1
set "PYCMD_EXE=%~1"
set "PYCMD_ARGS="
exit /b 0

:check_py
py -3 -c "import sys" >nul 2>nul
if errorlevel 1 exit /b 1
set "PYCMD_EXE=py"
set "PYCMD_ARGS=-3"
exit /b 0
