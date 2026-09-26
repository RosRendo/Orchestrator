# RendoOS Dashboard Visual Hierarchy & Navigation Architecture

## Overview
This document records the visual ergonomics and navigation restructuring implemented for the RendoOS Orchestrator web interface to transform an overwhelming 30+ item sidebar into a clean, collapsible 4-zone dashboard hierarchy.

---

## 1. UX Structure & Zone Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                       RENDO OS                              │
│                 Agent Workspace Portal                      │
│                  [🔍 Search       /]                        │
├─────────────────────────────────────────────────────────────┤
│  OVERVIEW & WORK (Zone 1)                                   │
│  ├─ 🏠 Home (Telemetry, Services Health, Daily Pulse)        │
│  ├─ 📁 Workspaces (Projects & Repositories)                 │
│  └─ 💻 Console & Terminals (Fullscreen & Floating)          │
├─────────────────────────────────────────────────────────────┤
│  AI & SKILL HQ [CORE] (Zone 2)                              │
│  ├─ 🧩 Skill Hub (14 Departments Accordion, 15 Skills) ⭐   │
│  ├─ 🤖 Agent Control (Live Running Agent Queue)             │
│  ├─ 🎯 Task Missions (Multi-step Agent Missions)            │
│  ├─ 🧠 AI Workspace (Prompt Workbench & Model Routing)      │
│  └─ 💻 CLI Coding Agents (Hermes, OpenCode, Aider, Cline)   │
├─────────────────────────────────────────────────────────────┤
│  DEVELOPER & INFRA (Zone 3 - Collapsible Accordion)         │
│  ├─ 🐳 Docker Manager                                       │
│  ├─ 🚀 Deployment Cockpit                                   │
│  ├─ 🔐 Env Manager                                          │
│  ├─ 🗄️ Database Explorer (Prisma Studio)                    │
│  ├─ 📡 API Client                                           │
│  ├─ 🐙 Workspace Git                                        │
│  ├─ 🐙 GitHub Integration                                   │
│  ├─ ⚡ n8n Workflows                                        │
│  └─ 📈 Trading Agent (MT5 Bridge)                           │
├─────────────────────────────────────────────────────────────┤
│  KNOWLEDGE & VAULTS (Zone 4 - Collapsible Accordion)        │
│  ├─ 📓 Obsidian Vault (D:\AI\Obsidian)                      │
│  ├─ 📑 Notion Workspace                                     │
│  └─ 🧠 AI Intelligence Layer                                │
├─────────────────────────────────────────────────────────────┤
│  WEB AI PORTALS (Zone 5 - Collapsible Accordion)            │
│  ├─ ChatGPT, Claude, Perplexity, Cursor, v0, etc.           │
│  └─ ➕ Add Portal Shortcut                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Interactive Ergonomics
1. **Auto-Expansion on Navigation**:
   - If an active tab belongs to Developer & Infra, the developer accordion automatically expands.
   - If an active tab belongs to Knowledge & Vaults, the knowledge accordion automatically expands.
   - If an active tab belongs to CLI or Web agents, their respective accordions expand.
2. **Persistence**:
   - State of the current tab is persisted in `localStorage('orchestrator_active_tab')`.
   - On page reload, the active section and its accordion restore automatically.
3. **Visual Distinction**:
   - `Skill Hub` features an emerald badge (`14 Depts`) and accent borders.
   - `AI & SKILL HQ` is marked with a distinctive `[CORE]` emerald pill badge to establish it as the primary operational star of RendoOS.
