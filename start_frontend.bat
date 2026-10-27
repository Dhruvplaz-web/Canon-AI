@echo off
title Canon Frontend (Next.js)
cd /d "%~dp0frontend"

echo [1/2] Checking node_modules...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo [2/2] Starting Next.js Frontend Server on http://localhost:3000 ...
call npm run dev
pause
