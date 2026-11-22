@echo off
setlocal enabledelayedexpansion

echo === MarkText Windows Build ===
echo App: %app_name%
echo Version: %date_version_number%
echo Architecture: %arch%

:: Install dependencies. The workspace postinstall downloads Electron, applies
:: patch-package patches, rebuilds native modules and minifies locales.
echo === Installing dependencies ===
call pnpm install --frozen-lockfile
if %ERRORLEVEL% neq 0 (
    echo ERROR: pnpm install failed
    exit /b 1
)

:: Build with electron-vite and package with electron-builder.
echo === Building and packaging ===
call pnpm run build:win:%arch%
if %ERRORLEVEL% neq 0 (
    echo ERROR: build failed
    exit /b 1
)

echo === Build complete ===
dir dist\
