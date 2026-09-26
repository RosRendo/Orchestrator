# RendoOS Master App User Manual: The Complete Operating System

Welcome to **RendoOS**. This is not just a developer dashboard; it is a **Personal & Business Operating System** designed for high-velocity solo founders, developers, and operators.

---

## 1. The 30-Second Mental Model

```
                               ┌─────────────────────────────┐
                               │           RENDO OS          │
                               │   Personal & Founder OS     │
                               └──────────────┬──────────────┘
                                              │
                 ┌────────────────────────────┴────────────────────────────┐
                 ↓                                                         ↓
         💻 WEB DASHBOARD                                           📱 TELEGRAM BOT
     (Visual Control Plane)                                    (Mobile Remote Control)
                 │                                                         │
                 └────────────────────────────┬────────────────────────────┘
                                              │
       ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
       ↓                  ↓                   ↓                   ↓                  ↓
  ZONE 1: WORK       ZONE 2: AI & SKILLS  ZONE 3: INFRA       ZONE 4: MEMORY     ZONE 5: BUSINESS
  • Home Cockpit     • Skill Hub (14 Dept)• Docker & DB       • Obsidian Vault   • 10-Stage Pipeline
  • Workspaces       • Parallel Arena     • Deployments & Git • AI Intelligence  • Skill Graph
  • Terminals        • Task Missions      • n8n & MT5 Bridge  • Notion Docs      • Experience Ledger
```

**The Core Principle**:
1. **Business HQ** defines *what to build and why*.
2. **AI & Skill HQ** provides the *intelligence and playbooks*.
3. **Developer & Infra** handles the *code, databases, containers, and deployment*.
4. **Knowledge & Memory** preserves the *lessons and context in Obsidian*.

---

## 2. Navigating the 6 Zones: What Does Each Screen Do?

### 🟦 ZONE 1: Overview & Work (The Daily Flight Deck)
* **Home**: Your operational cockpit. Displays running services (NestJS, Next.js, Docker), CPU/RAM usage, system telemetry, and quick action cards.
* **Workspaces**: Manage your active project folders (`Orchestrator`, `Backend`, `Frontend`, etc.). Switch active projects, resolve port conflicts (e.g. port 3000 vs 3005), or launch directly in VS Code.
* **Console & Terminals**: Full integrated multi-tab xterm.js terminals (PowerShell/bash) right inside the web app. Run build scripts, git commands, and scripts without switching windows.

---

### 🟪 ZONE 2: AI & Skill HQ ⭐ (The Brain Center)
* **Skill Hub (14 Departments)**: 
  * The heart of RendoOS. 114+ structured operational skills across **Engineering, Business, Marketing, Sales, Finance, Legal, Design, Product, Support, Security, Data, HR, Ops, and Executive Leadership**.
  * View executable playbooks, prompt templates, and active agent assignments.
* **AI Workspace (Multi-Model Arena & Presets)**:
  * **Parallel Model Arena (Default)**: Compare answers across up to 4 models (DeepSeek V3, Claude 3.5 Sonnet, GPT-4o, Custom Endpoints) side-by-side with a single prompt.
  * **Custom API Endpoint**: Connect OpenRouter, local Ollama (`http://localhost:11434/v1`), LM Studio, or Groq on the fly.
  * **Single Agent Runner**: Use focused prompt templates for Research, Marketing, Sales, or Hermes, with auto-save to Obsidian.
* **Task Missions**:
  * Create autonomous agent missions with clear acceptance criteria.
  * Track active runs, inspect generated code diffs, run verification tests, and review final reports before merging.
* **Agent Control**:
  * Health monitor for all autonomous background workers, error rates, and token counters.
* **CLI Coding Agents**:
  * Direct launchpads for terminal-based autonomous coders like **Hermes CLI**, **Claude Engineer**, **Aider**, and **OpenCode**.

---

### 🟩 ZONE 3: Developer & Infra (The Engine Room)
* **Docker Containers**: Monitor, start, stop, or restart local containers (PostgreSQL, Redis, MT5 Bridge, etc.) with real-time container log streaming.
* **Deployments & Machines**: Monitor remote VPS servers, cloud platforms (Vercel, Railway, PM2), and server health.
* **Environment Secrets**: View and safely manage `.env` files across your projects in one unified place.
* **Database Explorer (Prisma)**: View and query database tables visually without opening separate database management tools.
* **API Client (Postman)**: Test REST, Webhook, and GraphQL endpoints directly from your dashboard.
* **Git & GitHub**: View staged git diffs, commit changes, view open PRs and issues.
* **n8n Automation**: Embedded visual workflow automation editor for multi-step webhook flows.
* **MT5 Terminal & Bridge**: Monitor algorithmic trading daemons, Python execution bridges, and killzone sessions.

---

### 🟨 ZONE 4: Knowledge & Memory (The Long-Term Brain)
* **Obsidian Vault**: Live explorer and editor for your local Obsidian vault (`D:\AI\Obsidian`). Browse notes, daily agendas, and skill archives directly in the dashboard.
* **AI Intelligence**: Semantic RAG search engine that retrieves relevant notes, past decisions, and knowledge from your vault to answer questions with your personal context.
* **Notion Workspace**: Quick embedded portal for high-level company roadmaps and documents.

---

### 🟧 ZONE 5: Business HQ 💼 (The Venture Engine)
* **10-Stage Pipeline**: Visual kanban pipeline moving ideas through strict validation gates:
  * *1. Ideas → 2. Problem Validation → 3. Solution Design → 4. Prototype/MVP → 5. Pricing → 6. Funnel → 7. Beta → 8. Launch → 9. Sales → 10. Scaling*
* **Founder Skill Graph**: Real-time Level 1 to 5 mastery rating across 14 founder disciplines.
* **Bottleneck Radar**: Pinpoints your single greatest weakness holding back revenue and suggests an immediate unblocking action.
* **Experience Ledger**: Founder memory log of actions, outcomes, objections, and lessons learned.
* **Leads & CRM**: Manage prospects, pipeline stages, expected MRR, and follow-up deadlines.

---

### 🟫 ZONE 6: Web AI Portals (Instant Web Access)
* Collapsible drawer with instant embedded access to:
  * **ChatGPT**, **Claude**, **Perplexity**, **DeepSeek**, **Grok**, **v0.dev**, **Lovable.dev**, **Poe**, and **HuggingFace**.

---

## 3. The 3 Essential Founder User Journeys

### Journey 1: "I have a new business idea — how do I validate it?"
1. **Capture**: Open **Business HQ** → Click `+ New Idea` (or message Telegram: `/idea FastQuote: SMS instant estimate bot for tree care`).
2. **Research**: Go to **AI Workspace** → Open **Parallel Model Arena**.
   * Prompt: *"What are the top 3 software complaints from tree care services? How much would they pay to fix missed calls?"*
   * Compare answers from **Gemini 2.0 Flash** and **Claude 3.5 Sonnet**.
   * Click **`📓 Save to Obsidian`** on the winner.
3. **Price & Package**:
   * Ask the Arena: *"Draft a 2-tier pricing structure ($99/mo) and a risk-reversal guarantee."*
4. **Log Progress**:
   * Drag your card in **Business HQ** from **Stage 1 (Ideas)** to **Stage 2 (Problem Validation)**.
5. **Execute Outreach**:
   * Pitch 5 tree companies. When one replies, log it in **Business HQ → Experience Ledger** (or via Telegram `/experience ...`).

---

### Journey 2: "I need to code and deploy a new feature"
1. **Mission Creation**: Go to **Task Missions** → Click `+ Create New Mission`.
   * Title: *"Add SMS webhook handler for Twilio"*.
   * Assign to: **Hermes (Coding Specialist)**.
2. **Review Diffs**: Hermes generates the code, runs unit tests, and presents the diff.
3. **Inspect Infrastructure**: Go to **Docker Containers** to ensure PostgreSQL / Redis are healthy.
4. **Test Endpoints**: Go to **API Client** → Run a test `POST /twilio/inbound` request.
5. **Deploy**: Go to **Deployments & Machines** → Trigger a PM2 restart or git push.

---

### Journey 3: "I am on my phone / on the go"
You don't need your laptop to run RendoOS. Open **Telegram** and use these commands:

| Command | What it Does |
|---|---|
| `/status` | Instant health check of all servers, ports, and Docker containers. |
| `/business` | Summarizes your active pipeline and reveals your current bottleneck. |
| `/idea [title]: [desc]` | Logs an idea to Stage 1 and creates an Obsidian discovery doc. |
| `/experience [action] \| [result] \| [lesson]` | Logs an operational lesson directly into `08_Experience/Ledger.md`. |
| `/learn [insight]` | Saves an insight to Obsidian and creates an actionable rule. |
| `/skills` | Lists all 14 departments and available skill playbooks. |
| `/agent [role] [task]` | Dispatches a task to an autonomous agent and sends the result to Telegram. |

---

## 4. Summary of Key File Locations

* **Obsidian Vault**: `D:\AI\Obsidian`
  * Personal Knowledge Mirror: `D:\AI\Obsidian\AI_Brain_Sync\`
  * Experience Ledger: `D:\AI\Obsidian\08_Experience\Ledger.md`
  * Business Pipeline: `D:\AI\Obsidian\09_Business\Pipeline.md`
  * Skill Playbooks: `D:\AI\Obsidian\01_Skills\`
* **Backend API**: `http://localhost:3005` (NestJS)
* **Web Dashboard**: `http://localhost:3010` (Next.js)
