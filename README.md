# ??? Orchestrator — Personal AI Agent Command Center & Terminal Multiplexer

> Centralized developer cockpit managing background terminals, node-pty sessions, subagent execution pipelines, Telegram remote control, and visual n8n workflows.

---

## ? Overview
**Orchestrator** is the core infrastructure backbone for managing multi-service dev environments. It embeds real-time interactive terminals powered by xterm.js, coordinates local LLM subagents, streams live output across WebSockets, and enables mobile remote control via Telegram bot.

---

## ??? Architecture Topology

- **Frontend Cockpit**: Next.js 16, Monaco Code Editor, xterm.js, Socket.io Client (Port 3010)
- **PTY Daemon Backend**: NestJS, 
ode-pty terminal process manager, Socket.io Gateway (Port 3005)
- **Remote Bridge**: Telegram Bot via Telegraf for task trigger commands
- **Automation Engine**: n8n visual workflow orchestrator (Port 5678)

---

## ?? Key Modules
1. **Embedded Terminal Matrix**: Run multiple PowerShell, Bash, and Python runner processes in parallel with ANSI color support.
2. **Monaco Editor Studio**: Live file inspection and quick code patch execution directly in the browser.
3. **Telegram Command Link**: Trigger background builds, git syncs, and system health checks from your smartphone.
4. **Session Persistence**: Terminal history and process streams persist across browser reloads.

---

## ??? Quick Start

### 1. Start Backend Daemon
`ash
cd backend
npm install
npm run start:dev
`

### 2. Start Frontend Cockpit
`ash
cd frontend
npm install
npm run dev
`

Or launch with start_orchestrator.bat.

---

## ?? License
Private & Proprietary — Ros Rendo
