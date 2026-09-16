@echo off
title Install Auto-Start Windows - PC Workshop Hub
cd /d "%~dp0"

echo ===================================================================
echo               K2C KOMPUTINDO - PC WORKSHOP HUB
echo              INSTALLER AUTO-START SYSTEM WINDOWS
echo ===================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\PC-Workshop-Hub.lnk"
set "TARGET_PATH=%~dp0run-silent.vbs"
set "WORKING_DIR=%~dp0"
set "ICON_PATH=%~dp0public\app-icon.ico"

:: 1. Cek apakah file run-silent.vbs ada
if not exist "%TARGET_PATH%" (
    echo [ERROR] File run-silent.vbs tidak ditemukan di %TARGET_PATH%!
    echo Pastikan file tersebut ada di dalam folder proyek.
    echo.
    pause
    exit /b 1
)

:: 2. Cek apakah icon ada, jika tidak gunakan favicon.ico
if not exist "%ICON_PATH%" (
    set "ICON_PATH=%~dp0public\favicon.ico"
)

echo [INFO] Menyiapkan shortcut Windows Startup...
echo - Target Script : %TARGET_PATH%
echo - Working Dir   : %WORKING_DIR%
echo - Custom Icon   : %ICON_PATH%
echo - Output Link   : %SHORTCUT_PATH%
echo.

:: 3. Buat shortcut menggunakan PowerShell secara aman
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%WORKING_DIR%'; if (Test-Path '%ICON_PATH%') { $s.IconLocation = '%ICON_PATH%' }; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ===================================================================
    echo   [SUKSES] AUTO-START WINDOWS BERHASIL DIPASANG!
    echo   -----------------------------------------------------------------
    echo   - Server PC Workshop Hub akan otomatis berjalan di background
    echo     saat Windows dinyalakan / booting.
    echo   - Icon aplikasi K2C Komputindo telah terpasang pada shortcut.
    echo   - Jika ingin menghapus auto-start, jalankan uninstall-autostart.bat
    echo ===================================================================
) else (
    echo [ERROR] Gagal membuat shortcut Auto-Start. Silakan jalankan script ini sebagai Administrator.
)

echo.
pause
