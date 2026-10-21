# RendoOS Vercel 1-Click Serverless Deployment Guide

## Overview
RendoOS is now 100% compatible with **Vercel Serverless**. The backend logic has been compiled directly into **Next.js App Router Route Handlers** (`src/app/automation/[...slug]`, `src/app/projects`, `src/app/telegram`), allowing RendoOS to deploy to Vercel without requiring a separate backend server, Docker, or VM.

---

## What Works on Vercel Serverless
- 🧬 **Multi-Model Arena Synthesizer**: Runs on serverless lambdas and synthesizes across DeepSeek, Claude, and GPT-4o.
- 💼 **Business HQ & 1-Click Pipeline Actions**: Generates customer validation interview scripts, MVP blueprints, and pricing playbooks.
- ⚔️ **Multi-Agent War Room**: Executes cross-agent debates across `@research`, `@business`, `@marketing`, `@sales`, `@trading`, and `@hermes`.
- 🌅 **Founder Morning Briefing**: Delivers the 4-bullet executive briefing daily.
- ⚡ **Skill Hub & Experience Ledger**: Logs founder XP and renders skill progression.

---

## 2 Ways to Deploy to Vercel

### Option 1: Vercel Dashboard (GitHub Import — Recommended)
1. Push this repository to your GitHub account (`git push origin main`).
2. Go to [vercel.com/new](https://vercel.com/new) and select your repository.
3. In the project configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` (Click "Edit" and choose `frontend`).
4. **Environment Variables**:
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `TELEGRAM_BOT_TOKEN` (optional)
5. Click **Deploy**!

### Option 2: Vercel CLI (Deploy from your terminal)
Run this command from inside the `frontend` directory:
```bash
cd frontend
npx vercel
```
Follow the interactive prompts to link and deploy your site in ~45 seconds.

---

## Configuration Files Added
- `frontend/src/app/automation/[...slug]/route.ts`: Serverless API route handler.
- `frontend/src/app/projects/route.ts`: Serverless projects management handler.
- `frontend/src/app/telegram/[...slug]/route.ts`: Serverless Telegram status handler.
- `vercel.json` & `frontend/vercel.json`: Pre-configured build settings.
