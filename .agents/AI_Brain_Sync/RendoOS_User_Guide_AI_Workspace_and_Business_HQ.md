# RendoOS Founder Operational Guide: AI Workspace & Business HQ

This guide outlines the daily workflow for using **AI Workspace** (Intelligence & Multi-Model Arena) and **Business HQ** (Company Building Engine & Experience Ledger) within RendoOS.

---

## 1. The Core Mental Model

```
               ┌──────────────────────────────────────────────┐
               │              RENDO OS FOUNDER LOOP           │
               └──────────────────────┬───────────────────────┘
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                                                           ↓
┌───────────────────────────────┐           ┌───────────────────────────────┐
│         BUSINESS HQ           │           │         AI WORKSPACE          │
│   "Where the business is built"│           │   "Where intelligence is run" │
├───────────────────────────────┤           ├───────────────────────────────┤
│ • 10-Stage Idea Pipeline      │   Needs   │ • Multi-Model Parallel Arena  │
│ • Founder Skill Graph         │ ────────> │ • Custom Third-Party Endpoints│
│ • Experience Ledger (Lessons) │           │ • Agent Preset Execution      │
│ • Leads & CRM Funnel          │ <──────── │ • Obsidian Vault Sync         │
└───────────────────────────────┘  Answers  └───────────────────────────────┘
```

* **Business HQ** tells you **what stage your ventures are in**, **what your personal bottleneck is**, and **what lessons you've logged**.
* **AI Workspace** is your **high-speed intelligence laboratory** where you pit multiple AI models side-by-side or run specialized agent skills to generate assets for Business HQ.

---

## 2. How to Use Business HQ

Open **Business HQ** in Zone 5 of the sidebar (or send `/business` on Telegram).

### Tab 1: 10-Stage Pipeline ("Idea → Business")
Every business idea moves through 10 strict validation gates:
1. **💡 Ideas**: Capture raw thoughts without filtering. Click `+ New Idea` or message Telegram: `/idea MyBot: Telegram quote bot for cleaners`.
2. **🔍 Problem Validation**: Talk to 5 real customers. Do they actually suffer from this?
3. **📐 Solution Design**: Architecture & offer design.
4. **🛠️ Prototype / MVP**: Quickest working software to solve the core pain.
5. **🏷️ Pricing & Packaging**: Define pricing tiers ($99/mo) and risk reversals.
6. **🌐 Landing Page & Funnel**: Marketing hook, copy, and payment links.
7. **🧪 Beta Testing**: First 3 pilot users testing live.
8. **🚀 Launch**: Public launch on Twitter/X, Reddit, direct outreach.
9. **💼 Sales Execution**: Daily outreach and closing calls.
10. **⚙️ Scaling & Automation**: Delegating to agents and cron workers.

### Tab 2: Founder Skill Graph & Bottleneck Detector
* Displays your real-time level (Level 1 to 5) across 14 departments:
  * *Sales Execution, Marketing, Product Validation, System Architecture, etc.*
* **Bottleneck Radar**: The system highlights your lowest-scoring area that is currently stalling business progress (e.g. *"Bottleneck: Sales Execution (Lvl 1) — You have an MVP built, but haven't sent 20 cold DMs"*).
* Follow the unblocking action suggested by the radar to level up.

### Tab 3: Experience Ledger (Compounding Founder Memory)
Every win, loss, and customer objection should be recorded:
* Click **`+ Log Experience`** or use Telegram:
  `/experience Cold DM'd 15 cleaners | 1 reply, objection was price | Need to lead with free trial or risk-reversal guarantee`
* Every entry logs to `D:\AI\Obsidian\08_Experience\Ledger.md`. Over time, this becomes your AI's personal context library so your agents never repeat your past mistakes.

### Tab 4: Leads & CRM Funnel
* Track prospective clients, deal stage (*New Lead*, *Discovery*, *Proposal*, *Closed Won*), estimated MRR value, and follow-up deadlines.

---

## 3. How to Use AI Workspace

Open **AI Workspace** in Zone 2 of the sidebar. You will see a top switcher banner:

```
[ ⚔️ Parallel Model Arena (Split Columns) ]   [ 🤖 Single Agent Preset Runner ]
```

### Mode A: Parallel Model Arena (Default)
Use this when you want to compare how different LLMs solve the same problem.

1. **Columns Grid**:
   * Default displays 3 columns: **DeepSeek V3**, **Claude 3.5 Sonnet**, and **GPT-4o**.
   * You can add up to 4 columns (`+ Add Model Column`) or remove columns (`×`).
2. **Switching Models on any Column**:
   * Click the dropdown in the column header to pick a preset (*DeepSeek R1 Reasoner*, *Claude 3.5 Sonnet*, *Gemini 2.0 Flash*, *o3-mini*, etc.) or click `⚙️ + Custom API / Model`.
3. **Plugging in Custom Third-Party or Local Endpoints**:
   * Click **`🔌 Custom API Endpoint`**.
   * Enter your **Base URL** (e.g., `https://openrouter.ai/api/v1` or `http://localhost:11434/v1`), **API Key**, and **Model string** (e.g., `anthropic/claude-3.7-sonnet`, `deepseek-r1`, `llama3`).
4. **Sending a Unified Prompt**:
   * In the bottom input bar (`Send to 3 models...`), type your prompt:
     * *Example*: `"Draft a 3-tier pricing strategy and a risk-reversal guarantee for an automated Telegram lead notification tool for roofers."*
   * Press `Enter` or click **`Send`**.
   * All active models generate responses simultaneously in parallel.
5. **Evaluating & Saving**:
   * Compare answers side-by-side.
   * Click **`📋 Copy`** to paste the best result.
   * Click **`📓 Save to Obsidian`** to automatically save the winning response into your Obsidian vault under `D:\AI\Obsidian\AI_Brain_Sync\`.

### Mode B: Single Agent Preset Runner
Use this when you want deep, single-agent domain execution using pre-built templates.

1. **Pick an Agent Mode**: Research, Business, Marketing, Sales, Finance, Personal, Trading, Ops, Product, or Hermes.
2. **Click a Template**: e.g., for Business: *Startup Ideas*, *Market Validation*, *Pricing Strategy*, *Customer Persona*.
3. **Choose Execution Context**:
   * `Template`: Fast offline structured template.
   * `Direct LLM`: Calls your configured API keys (OpenAI, Anthropic, Gemini, Groq, DeepSeek, or Ollama).
   * `n8n`: Dispatches the run to your local n8n workflow webhook.
4. **Click Send**: Formats the output and saves automatically into your Obsidian vault (e.g., `01_Skills/Business/` or `04_Research/`).

---

## 4. The 10-Minute Daily Founder Routine

1. **Morning (8:30 AM)**:
   * Open **Business HQ → Pipeline**. Check which card needs to move forward today.
   * Check **Founder Skill Graph** for today's recommended unblocking action.
2. **Midday Execution**:
   * Need marketing copy or sales outreach scripts? Open **AI Workspace → Parallel Model Arena**.
   * Send your prompt to **DeepSeek V3**, **Claude 3.5**, and **GPT-4o**.
   * Pick the highest-converting copy, click **Save to Obsidian**, and send it to your leads.
3. **Evening (5:00 PM)**:
   * Did a client give feedback or reject an offer?
   * Open Telegram: `/experience Pitch rejected: said $199 too high | Offended by upfront cost | Pivot to $49 setup + $29/mo performance fee`.
   * The lesson is permanently etched into RendoOS memory.
