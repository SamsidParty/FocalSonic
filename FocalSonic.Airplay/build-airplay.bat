@echo off
setlocal enabledelayedexpansion

rem ============================================================================
rem  build-airplay.bat
rem
rem  One-click build of the FocalSonic AirPlay module into a single, self-contained
rem  Windows executable using Nuitka, dropped into the matching IgniteView native
rem  runtime folder so the FocalSonic build picks it up automatically:
rem
rem      ..\FocalSonic\iv2runtime\win-<arch>\native\focalsonic-airplay.exe
rem
rem  Nuitka does NOT cross-compile: it builds for the architecture of the Python
rem  interpreter it runs under (x64 Python -> win-x64, ARM64 Python -> win-arm64).
rem  Run this once on an x64 machine and once on an ARM64 machine, or let the
rem  GitHub Actions matrix build the architecture you can't build locally.
rem
rem  Requires Python 3.12 (audioop, used for resampling, was removed in 3.13) and
rem  a C compiler. With no MSVC present Nuitka auto-downloads MinGW64 (x64 only).
rem ============================================================================

cd /d "%~dp0"

rem --- locate a Python 3.12 interpreter --------------------------------------
rem Prefer the interpreter on PATH when it's 3.12 -- on CI that's the one
rem setup-python placed there, with the architecture we actually want to build
rem (the `py` launcher could otherwise pick an emulated x64 Python on an ARM64
rem runner). Fall back to the py launcher for local multi-version setups.
set "PY="
set "PYVER="
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set "PYVER=%%v"
echo !PYVER! | findstr /b "3.12." >nul && set "PY=python"
if not defined PY (
    py -3.12 --version >nul 2>nul && set "PY=py -3.12"
)
if not defined PY (
    echo [ERROR] Python 3.12 is required ^(audioop was removed in 3.13^) but was not found.
    echo         Install it from https://www.python.org/downloads/release/python-3120/
    exit /b 1
)
echo [build] Interpreter: %PY%

rem --- resolve the target architecture from the interpreter -------------------
set "MACHINE="
for /f %%a in ('%PY% -c "import platform;print(platform.machine().lower())"') do set "MACHINE=%%a"
set "ARCH="
if /i "%MACHINE%"=="amd64"  set "ARCH=win-x64"
if /i "%MACHINE%"=="x86_64" set "ARCH=win-x64"
if /i "%MACHINE%"=="arm64"  set "ARCH=win-arm64"
if not defined ARCH (
    echo [ERROR] Unsupported / unrecognised architecture: "%MACHINE%"
    exit /b 1
)
echo [build] Target: %ARCH%  ^(machine=%MACHINE%^)

rem --- create / reuse an isolated build virtualenv ---------------------------
set "VENV=.build-venv"
if not exist "%VENV%\Scripts\python.exe" (
    echo [build] Creating build virtualenv in "%VENV%" ...
    %PY% -m venv "%VENV%" || ( echo [ERROR] venv creation failed & exit /b 1 )
)
set "VPY=%VENV%\Scripts\python.exe"

echo [build] Installing dependencies ^(pyatv, comtypes, numpy^) + Nuitka ...
"%VPY%" -m pip install --upgrade pip || ( echo [ERROR] pip upgrade failed & exit /b 1 )
rem nuitka[onefile] pulls in zstandard so the onefile exe is compressed (smaller).
"%VPY%" -m pip install -r requirements.txt "nuitka[onefile]" || ( echo [ERROR] dependency install failed & exit /b 1 )

rem --- compile ----------------------------------------------------------------
set "OUTDIR=..\FocalSonic\iv2runtime\%ARCH%\native"
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

set "WORKDIR=build\%ARCH%"
if exist "%WORKDIR%" rmdir /s /q "%WORKDIR%"

echo [build] Compiling with Nuitka -- this can take several minutes ...
"%VPY%" -m nuitka ^
    --onefile ^
    --assume-yes-for-downloads ^
    --windows-console-mode=disable ^
    --windows-icon-from-ico=favicon.ico ^
    --enable-plugin=tk-inter ^
    --include-package=pyatv ^
    --include-package-data=pyatv ^
    --include-package=comtypes ^
    --company-name=SamsidParty ^
    --product-name="FocalSonic AirPlay" ^
    --file-description="FocalSonic AirPlay" ^
    --product-version=1.0.0 ^
    --output-filename=focalsonic-airplay.exe ^
    --output-dir="%WORKDIR%" ^
    --remove-output ^
    airplay.py
if errorlevel 1 (
    echo [ERROR] Nuitka build failed
    exit /b 1
)

copy /y "%WORKDIR%\focalsonic-airplay.exe" "%OUTDIR%\focalsonic-airplay.exe" >nul ^
    || ( echo [ERROR] failed to copy the exe into "%OUTDIR%" & exit /b 1 )

echo.
echo [build] Success: %OUTDIR%\focalsonic-airplay.exe
echo [build] Build FocalSonic ^(or run the GitHub Actions build^) to bundle it.
endlocal
