@echo off
title RendoOS Desktop Shell
echo ========================================================
echo   Launching RendoOS — Founder & AI Operating System
echo ========================================================
cd /d "%~dp0electron"
if not exist "node_modules\electron" (
    echo Installing Desktop Shell dependencies...
    call npm install
)
echo Starting RendoOS Desktop Shell...
call npm start
pause
