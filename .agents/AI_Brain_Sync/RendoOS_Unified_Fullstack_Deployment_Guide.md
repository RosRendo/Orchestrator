# RendoOS Unified Fullstack Architecture & Single-Port Deployment Guide

## 1. Overview
RendoOS has been upgraded from a split dual-server setup (Next.js port 3010 + NestJS port 3005) into a **Unified Fullstack Single-Service Architecture**.

## 2. Key Accomplishments
1. **Zero-CORS Next.js Rewrites (`frontend/next.config.ts`)**:
   - Next.js proxies all `/automation/*`, `/projects/*`, `/sessions/*`, `/telegram/*`, and `/socket.io/*` routes to the internal backend.
   - The browser and client communicate with only **one domain and one public port** (`$PORT`).
   - Hardcoded `http://localhost:3005` references have been replaced with relative path routing.
2. **Unified Runner (`runner.js`)**:
   - Spawns both the NestJS backend (on internal port `3005`) and the Next.js frontend (on public port `$PORT`).
   - Automatically binds to whatever `$PORT` Railway, Render, Fly.io, or VPS assigns.
   - Graceful process termination and error forwarding.
3. **Production Dockerfile**:
   - Multi-stage Dockerfile compiling both backend and frontend into a single lean container.
   - Ready for 1-click cloud deployment via `railway.json` or Docker.

## 3. How to Deploy
- **Railway / Render / Fly.io**:
  - Connect your GitHub repository.
  - Set Build Command: `npm run build`
  - Set Start Command: `npm start`
  - Expose single port `$PORT`.
