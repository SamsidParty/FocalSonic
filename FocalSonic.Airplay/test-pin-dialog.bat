@echo off
setlocal
rem ============================================================================
rem  test-pin-dialog.bat
rem
rem  Shows just the AirPlay PIN dialog (pin_dialog.py) on its own -- no pyatv, no
rem  device discovery, no pairing. Handy for iterating on the dialog's look.
rem
rem  Usage:   test-pin-dialog.bat ["Device Name"]
rem  Default device name: "Living Room Apple TV".
rem
rem  Dark vs light follows the Windows "Choose your default app mode" setting,
rem  so flip that in Settings > Personalization > Colors to test both.
rem ============================================================================

cd /d "%~dp0"

set "DEVICE=%~1"
if "%DEVICE%"=="" set "DEVICE=Living Room Apple TV"

rem Prefer the build venv (guaranteed Python 3.12 + tkinter); else fall back.
set "PY="
if exist ".build-venv\Scripts\python.exe" set "PY=.build-venv\Scripts\python.exe"
if not defined PY (
    where python >nul 2>nul && set "PY=python"
)
if not defined PY (
    py -3.12 --version >nul 2>nul && set "PY=py -3.12"
)
if not defined PY (
    echo [ERROR] No Python interpreter found ^(tried .build-venv, python, py -3.12^).
    exit /b 1
)

echo [test] Interpreter: %PY%
echo [test] Device name: %DEVICE%

rem pin_dialog prints the entered PIN to stdout and exits 0; exits 1 if cancelled.
for /f "delims=" %%P in ('%PY% pin_dialog.py "%DEVICE%"') do set "PIN=%%P"

if errorlevel 1 (
    echo [test] Cancelled ^(no PIN entered^).
) else (
    echo [test] Entered PIN: %PIN%
)

endlocal
