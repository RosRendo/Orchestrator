# RendoOS: How to Use the AI Workflow (Founder Operator's Manual)

## Core Mindset
In RendoOS, you do not talk to AI like a generic chatbot. You operate as the **CEO / Founder**, using three specialized AI workflow engines:

1. **⚔️ The Multi-Model Arena** → For fast brainstorming, model comparison, and critical decisions.
2. **🧩 The Skill Hub** → For departmental domain playbooks (Business, Sales, Marketing, Engineering).
3. **🎯 Task Missions & Hermes** → For autonomous code execution, diff inspection, and deployment.

All outputs flow into your **Obsidian Vault** and **Business HQ** so you build compounded enterprise value rather than losing context in ephemeral chat windows.

---

## 1. The 3 Operational AI Workflow Engines

```
                    ┌─────────────────────────┐
                    │      FOUNDER / CEO      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   ENGINE 1: ARENA        ENGINE 2: SKILL HUB     ENGINE 3: MISSIONS
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Multi-Model Split   │ │ 14 Functional Depts │ │ Multi-Step Agents   │
│ Side-by-side battle │ │ Playbooks & SOPs    │ │ Code scaffolding    │
│ DeepSeek vs Claude  │ │ Sales, SEO, PRDs    │ │ Terminal tests      │
│ Fast validation     │ │ Level 1-10 mastery  │ │ Git verification    │
└──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ▼
                       PERSISTENT KNOWLEDGE
                 D:\AI\Obsidian + Business HQ
```

---

## 2. Step-by-Step: The Complete "Idea → Revenue" Workflow

### Step 1: Brainstorm & Compare in the Arena (AI Workspace)
* **Where to go:** Click **🧠 AI Workspace** in Zone 2.
* **Default view:** **Parallel Model Arena (Split Columns)**.
* **How to use it:**
  1. Set your comparison models (e.g., Column 1: *DeepSeek V3* for logic/code, Column 2: *Claude 3.5 Sonnet* for business/sales, Column 3: *GPT-4o* or custom endpoint).
  2. In the bottom unified input bar, type your prompt:
     > *"I want to build an automated Telegram trade notification bot for MetaTrader 5 traders. What is the single biggest pain point and how should I price it?"*
  3. Click **Send** (or hit `Enter`). All active models answer concurrently in real time.
  4. Review the side-by-side answers:
     - Compare Claude's pricing strategy with DeepSeek's technical architecture.
     - Click **📋 Copy** or click **📓 Save to Obsidian** on the winning answer to preserve it in your vault.

---

### Step 2: Extract Deep Domain Playbooks in the Skill Hub
* **Where to go:** Click **🧩 Skill Hub** in Zone 2.
* **How to use it:**
  1. Look at the 14 Department cards (Engineering, Business, Sales, Marketing, Finance, etc.).
  2. Select the relevant department:
     - Need a pricing model? Open **Business & Strategy** → Run **Startup Validation** or **Pricing Model**.
     - Need outreach copy? Open **Marketing & Content** → Run **SEO High-Intent Keywords** or **Viral Hooks**.
     - Need sales messages? Open **Sales & CRM** → Run **Cold Outreach DM**.
  3. Review the generated playbook. Every run automatically writes to `D:\AI\Obsidian\01_Skills/<Department>/`.

---

### Step 3: Execute & Build via Task Missions & Hermes CLI
* **Where to go:** Click **🎯 Task Missions** (or **💻 CLI Coding Agents** → Hermes).
* **How to use it:**
  1. Click **+ Create New Mission**.
  2. Enter the task:
     - **Title:** `Scaffold MT5 Webhook Endpoint in NestJS`
     - **Assigned Agent:** `Hermes (DevOps & Full-Stack)`
     - **Context Prompt:** Paste the technical architecture from Step 1.
  3. Hit **Launch Mission**.
  4. The mission runner executes the task:
     - Checks project files.
     - Writes clean NestJS code with TypeScript types.
     - Runs lint/build verification.
     - Logs the completed diff and outcome to the Task Mission board.

---

### Step 4: Advance the Venture in Business HQ
* **Where to go:** Click **💼 Business HQ** in Zone 5.
* **How to use it:**
  1. Open the **10-Stage Pipeline**:
     - Create an idea card: `MT5 Telegram Bridge`.
     - Move it across stages: `01_Discovery` → `02_Validation` → `03_Offer_Spec` → `04_MVP_Build` → `07_Launch`.
  2. Check your **Founder Skill Graph**:
     - See where your bottleneck is (e.g., if Sales is Level 2 and Engineering is Level 7, RendoOS highlights Sales as the critical bottleneck).
  3. Log real-world lessons in the **Experience Ledger**:
     - Action taken: *"Sent 20 cold DMs to MT5 traders on Discord."*
     - Result: *"3 calls booked, 1 asked for credit card gateway."*
     - Lesson learned: *"Lead with latency guarantee, not database architecture."*

---

## 3. Mobile AI Workflow (Telegram Gateway)

When away from your desktop, you can operate the entire AI workflow via Telegram:

| Command | Action in RendoOS |
|---|---|
| `/idea [title]: [description]` | Drops an idea into stage `01_Discovery` and creates a note in `D:\AI\Obsidian\09_Business\Ideas\` |
| `/experience [action] \| [result] \| [lesson]` | Appends an immutable learning entry to `D:\AI\Obsidian\08_Experience\Ledger.md` and upgrades your Founder Skill XP |
| `/business` | Returns the current state of your 10-stage venture pipeline and active bottlenecks |
| `/status` | Returns container uptime, memory, and running agent health |
| `/agent run [agent] [prompt]` | Dispatches an autonomous agent task from your phone |

---

## 4. Quick Reference: What Tool to Use When

| Goal | Best View | How to Trigger |
|---|---|---|
| **Compare 3 AI models on one problem** | 🧠 AI Workspace (Arena) | Zone 2 → AI Workspace → Arena tab |
| **Get a sales script or marketing strategy** | 🧩 Skill Hub | Zone 2 → Skill Hub → Pick department |
| **Write code or fix a bug in this repository** | 🎯 Task Missions or Hermes CLI | Zone 2 → Task Missions → + Create Mission |
| **Inspect database tables or add mock data** | 🗄️ Database Explorer | Zone 3 → Database Explorer |
| **Review captured knowledge & notes** | 📓 Obsidian Vault | Zone 4 → Obsidian Vault |
| **Log daily revenue or advance an MVP stage** | 💼 Business HQ | Zone 5 → Business HQ → Pipeline tab |
