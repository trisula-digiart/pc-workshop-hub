@echo off
title Uninstall Auto-Start Windows - PC Workshop Hub
cd /d "%~dp0"

echo ===================================================================
echo               K2C KOMPUTINDO - PC WORKSHOP HUB
echo             UNINSTALLER AUTO-START SYSTEM WINDOWS
echo ===================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\PC-Workshop-Hub.lnk"

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo ===================================================================
    echo   [SUKSES] SHORTCUT AUTO-START BERHASIL DIHAPUS!
    echo   -----------------------------------------------------------------
    echo   - Server PC Workshop Hub tidak akan otomatis berjalan lagi
    echo     saat Windows booting.
    echo ===================================================================
) else (
    echo [INFO] Shortcut Auto-Start tidak ditemukan di folder Startup Windows.
)

echo.
pause
