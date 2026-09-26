# RendoOS: Personal AI Operating System Architecture & Skills Roadmap

**Generated:** 2026-09-07  
**System:** Orchestrator / RendoOS  
**Integration Stack:** Telegram Gateway + Multi-Model Router + Obsidian Knowledge Core + Specialized Domain CLIs  

---

## 1. Executive Summary & Vision

RendoOS transforms the workspace from a set of disconnected scripts into a unified **Personal AI Operating System**.
Instead of relying on a single generalist model or fragmented prompt templates, RendoOS operates on a foundational separation:
> **Models are interchangeable commodities. Skills, playbooks, and accumulated experience belong to you.**

All specialized agents (Hermes for Code/DevOps, Sales Agent, Marketing Agent, Quant/Trading Agent, Product Agent) read from and write to a single **Canonical Obsidian Vault** (`D:\AI\Obsidian`). The primary interface when away from the workstation is **Telegram**, functioning as a remote command bridge and real-time knowledge ingestion terminal.

---

## 2. Core Knowledge Taxonomy (The 5 Vault Types)

To prevent the vault from degenerating into an unorganized note dump, all domain knowledge is split into 5 distinct categories:

1. **🧠 Skills (`01_Skills/`)**: *How to do something.* Step-by-step methodologies, cognitive frameworks, tool mechanics (e.g., `Discovery_Calls.md`, `Docker_Optimization.md`).
2. **📚 Knowledge (`02_Knowledge/`)**: *Facts, principles, and domain models.* Core concepts, metrics, definitions (e.g., `SaaS_Unit_Economics.md`, `MT5_Protocol.md`).
3. **🧰 Playbooks (`07_Playbooks/`)**: *Executable, repeatable SOPs.* Runbooks for zero-error execution (e.g., `Production_Deployment_Checklist.md`, `Customer_Discovery_SOP.md`).
4. **⚖️ Decisions (`06_Decisions/`)**: *Chronological decision log with context, rationale, alternatives considered, and post-mortem evaluation.*
5. **📊 Evidence (`04_Research/` & `03_Business/Evidence/`)**: *Empirical facts observed in the real world.* Customer interviews, competitor pricing scrapes, live trading journal data.

---

## 3. Comprehensive Skills Taxonomy (Recommended Additions)

Beyond **Hermes (Engineering/DevOps)**, **Sales**, and **Marketing**, the following high-leverage domains are engineered into RendoOS:

### A. 📈 Trading & Financial Quantitative Engineering (Trading Agent)
*Target: Algorithmic trading, MetaTrader 5 automation, risk parameters.*
- **Market Microstructure & Killzones**: London/NY open timings, liquidity sweeps, spread dynamics.
- **Risk & Position Sizing Engine**: Kelly criterion, max drawdown circuit breakers, exposure limits.
- **Execution Diagnostics**: Slippage tracking, latency logs, broker execution quality audits.
- **Journal & Trade Post-Mortems**: Structured logging of wins, losses, rule adherence.

### B. 📦 Product Strategy & Architecture (Product Agent)
*Target: High-velocity SaaS building and customer-centric feature definition.*
- **Problem Discovery & ICP Validation**: Pain point severity scoring ($ / time saved).
- **PRD & User Story Generation**: Clear developer-ready specifications from vague user ideas.
- **Feature Prioritization (RICE/MoSCoW)**: Eliminating bloat; shipping MVPs in 48-72 hours.
- **Onboarding & Activation Funnel Optimization**: Time-to-value minimization.

### C. ⚙️ Operations & System Reliability (Ops Agent)
*Target: Keeping servers, databases, and microservices 100% resilient.*
- **Container Lifecycle & Port Orchestration**: Automated conflict detection, restart strategies.
- **Automated Backup & Disaster Recovery**: SQLite/PostgreSQL dumps, encrypted cloud offsites.
- **Observability & Health Checks**: Synthetic uptime monitors, error rate alarms via Telegram.

### D. 🗣️ High-Stakes Communication & Negotiation (Communication Agent)
*Target: Professional correspondence, negotiation, and high-impact writing.*
- **Outreach & Cold Email Crafting**: High-conversion copy tailored to specific recipient psychology.
- **Negotiation Playbooks**: Chris Voss tactical empathy, objection pivoting, contract pricing anchor points.
- **Investor & Stakeholder Updates**: Clear, quantitative bi-weekly progress memos.

### E. 🔬 Intelligence & Competitive Reconnaissance (Research Agent)
*Target: Automated research that goes deeper than superficial web browsing.*
- **Competitor Teardowns**: Pricing changes, feature releases, hiring trends, tech stack inspection.
- **API & Tool Benchmark Index**: Token pricing, latency metrics, reliability records.
- **Academic & Whitepaper Digesting**: Summarizing AI architectures into usable code snippets.

### F. 🛡️ Legal, Compliance & Risk Governance (Risk Agent)
*Target: Protecting SaaS assets and trading capital.*
- **SaaS Standard Terms & Privacy Policies**: GDPR, CCPA, disclaimer templates.
- **Data Protection & Secret Hygiene**: Preventing API key leaks, environment variable audits.

---

## 4. Intelligent Model Routing Architecture

The router matches task characteristics to model strengths to balance speed, intelligence, and token economics:

| Task Domain | Primary Model | Fallback Model | Why? |
|---|---|---|---|
| **Deep Coding, Architecture, Refactoring** | **DeepSeek-Coder / DeepSeek-V3** | Claude 3.5 Sonnet | Unmatched code reasoning per cost, deep algorithmic understanding. |
| **Nuanced Copywriting, Strategy, Negotiation** | **Claude 3.5 Sonnet / Opus** | GPT-4o | Natural tone, avoids generic AI cliches, superior synthesis. |
| **High-Volume Search & Rapid Data Extraction** | **Gemini 2.0 Flash** | Groq / Llama-3.3 | Massive context window (1M+ tokens), near-instant latency, affordable. |
| **Structured JSON Tool Execution & Agents** | **GPT-4o** | DeepSeek | Strict JSON schema adherence, predictable function-calling. |

---

## 5. Telegram Mobile Gateway Command Interface

The user controls RendoOS remotely from mobile via Telegram:

1. `/ask <query>`:
   - Evaluates intent -> Selects optimal model.
   - Searches Obsidian for relevant Skills & Playbooks.
   - Synthesizes response and streams back clean Markdown.
2. `/learn <raw observation>`:
   - Voice or text input from phone.
   - AI extracts: Core principle, domain category, evidence, and actionable rule.
   - Silently appends or updates the target note in `D:\AI\Obsidian\`.
3. `/hermes <command>`:
   - Direct pipeline to local coding agent for git commits, tests, and deployments.
4. `/daily`:
   - Generates morning executive briefing (Trading state, product priorities, overdue reviews).
5. `/daily-review`:
   - Prompts 4 questions at night: What did you build? What did you learn? What broke? What's tomorrow's #1 focus?

---

## 6. Phased Execution Roadmap

- **Phase 1 (Current)**: Solidify Telegram Gateway, connect all LLM keys (DeepSeek, OpenAI, Gemini, Claude), and guarantee flawless read/write to `D:\AI\Obsidian`.
- **Phase 2**: Implement `/learn` knowledge extractor and `/ask` context retrieval engine inside `telegram.service.ts`.
- **Phase 3**: Establish structured folder templates (`00_System`, `01_Skills`, `07_Playbooks`) in Obsidian with standard frontmatter.
- **Phase 4**: Expand domain CLIs and specialized agents with experience/milestone tracking.
