@echo off
title PM2 Manager - PC Workshop Hub (Port 3007)
cd /d "%~dp0"

echo ===================================================================
echo               K2C KOMPUTINDO - PC WORKSHOP HUB
echo                PM2 BACKGROUND SERVER LAUNCHER
echo ===================================================================
echo.

:: 1. Cek folder node_modules
if not exist "node_modules\" (
    echo [INFO] Installing node_modules dependencies...
    call npm install
)

:: 2. Sinkronkan Database & Generate Prisma Client
echo [INFO] Memeriksa dan meng-update skema database Prisma...
call npx prisma db push >nul 2>&1

:: 3. Memastikan Production Build (.next) sudah tersedia
if not exist ".next\BUILD_ID" (
    echo [WARNING] Build Next.js folder .next belum lengkap atau belum ada! Membangun proyek...
    call npx next build
)

:: 4. Hentikan instance lama jika ada
echo [INFO] Menghentikan instance PM2 lama jika berjalan...
call npx pm2 delete pc-workshop-hub >nul 2>&1

:: 5. Jalankan via PM2 menggunakan ecosystem.config.js
echo [INFO] Menjalankan server PC Workshop Hub di background...
call npx pm2 start ecosystem.config.js

:: 6. Simpan status PM2
call npx pm2 save >nul 2>&1

echo.
echo ===================================================================
echo   SUKSES! SERVER JALAN DI BACKGROUND (PORT 3007)
echo   -----------------------------------------------------------------
echo   - Localhost  : http://localhost:3007
echo   - Cek Status : npx pm2 status
echo   - Cek Logs   : npx pm2 logs pc-workshop-hub
echo   - Stop Server: npx pm2 stop pc-workshop-hub
echo ===================================================================
echo.
pause
