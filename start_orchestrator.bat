@echo off
title RendoOS Master Orchestrator
echo ========================================================
echo   Starting RendoOS Unified Services (Backend + Frontend)
echo ========================================================

start "RendoOS Backend API (:3005)" cmd /k "cd /d %~dp0backend && npm run start:dev"
timeout /t 3 /nobreak >nul
start "RendoOS Frontend UI (:3010)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo - Web Dashboard: http://localhost:3010
echo - Backend API:   http://localhost:3005
echo.
