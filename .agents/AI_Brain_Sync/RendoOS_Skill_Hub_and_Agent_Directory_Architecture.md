# RendoOS: 14-Domain Skill Hub & Agent Directory Architecture

**Date:** 2026-09-08  
**Status:** Implemented & Verified  
**Storage Anchor:** `D:\AI\Obsidian\Skills\` and `D:\AI\Obsidian\01_Skills\`

---

## 🏛️ Concept & Purpose

Following the enterprise agent registry architecture, RendoOS groups capabilities into 14 distinct business departments rather than having scattered, unorganized agent prompts.

Each department maintains:
1. **Catalog Total**: The full universe of potential agent blueprints (195+ templates).
2. **Detected Active Skills**: Real playbooks actively installed in your Obsidian vault (`D:\AI\Obsidian\Skills` or `01_Skills`), identified dynamically by the scanner.

---

## 📂 The 14 Departments

| # | Department | Icon | Default Blueprints | Detected in Vault |
|---|---|---|---|---|
| 1 | **Academic** | 🎓 | 6 | `mentor` (Pedagogical Code Coach) |
| 2 | **Design** | 🎨 | 10 | `impeccable` (UI/UX craft & design systems) |
| 3 | **Engineering** | 💻 | 59 | `hermes`, `architect`, `backend-engineer`, `frontend-engineer`, `devops-engineer`, `cicd-engineer` |
| 4 | **Finance** | 💲 | 6 | `trading-quant` (MT5 news avoidance, risk limits) |
| 5 | **Game Development** | 🎮 | 21 | Gameplay loops, physics tuners, narrative trees |
| 6 | **GIS** | 🗺️ | 13 | Spatial geoJSON analysts, tile map architects |
| 7 | **Healthcare** | 🩺 | 3 | HIPAA compliance auditors, FHIR integrators |
| 8 | **Marketing** | 📢 | 36 | `viral-hook-writer`, SEO specialists |
| 9 | **Paid Media** | 🎯 | 7 | Google Ads copywriters, ROAS optimizers |
| 10 | **Product** | 📦 | 5 | PRD architects, MVP scopers |
| 11 | **Project Management** | 📋 | 7 | `reviewer` (Task & code QA reviewer) |
| 12 | **Research** | 🔬 | 1 | `competitor-intelligence` |
| 13 | **Sales** | 📈 | 9 | `enterprise-closer`, `discount-gatekeeper` |
| 14 | **Security** | 🛡️ | 12 | `security-engineer` (OWASP auditing, secret scans) |

---

## 🔌 API Endpoints

- **`GET /automation/skills/catalog`**: Scans Obsidian vault in real time and returns the 14-category catalog with detected counts, agents list, and Obsidian file paths.
- **`POST /automation/skills/create`**: Scaffolds a new `SKILL.md` directly into `D:\AI\Obsidian\Skills/{skillId}/` and mirrors to sync directories.
- **`POST /automation/skills/run`**: Loads the Obsidian playbook for that skill, executes with dynamic multi-model routing (DeepSeek/Claude/Gemini), and saves results to `01_Skills/{category}/`.

---

## 📱 Telegram Commands

- **`/skills`**: Displays the full 14-department directory with live detected counts.
- **`/skills {domain}`**: Inspects all active playbooks and templates in that specific department.
- **`/ai {domain} {task}`**: Executes any domain agent using its Obsidian operating playbook.
