# Architectural Sync: Interactive Telegram Actions & Smart Batch Runners

**Date**: 2026-08-22
**Project**: Developer Orchestrator

## 1. Interactive Telegram Actions (UX Optimization)
- **Problem**: Typing or copy-pasting long project UUIDs (e.g. `26c50efc-f17a-4299...`) on mobile devices inside the Telegram chat is prone to error and creates friction.
- **Architectural Decision**: Implement Telegram **Inline Keyboards** (`Markup.inlineKeyboard` from `telegraf`) for `/projects` queries.
- **Implementation**:
  - The `/projects` list maps database objects and generates inline button payloads (e.g. `startfe_[id]`, `startbe_[id]`, `stop_[id]`, `deploy_[id]`).
  - Added a callback query router on the backend bot listener to decode callbacks and execute actions immediately without text typing.

## 2. Smart Project Batch Runners (Hybrid Stack Support)
- **Problem**: Not all developer projects are standard single-service Node apps started via `npm run dev`. Hybrid projects (like the Journex Dashboard) require launching Docker-Compose files and PM2 tasks (such as the Python MetaTrader 5 bridge interpreter).
- **Architectural Decision**: Inject directory script inspectors in the orchestrator runner service.
- **Implementation**:
  - Before starting a project, search for `start_local.bat` in the project's root folder.
  - If it exists, execute `cmd.exe /c start_local.bat` in the background (asynchronous spawn) to launch the hybrid stack.
  - Before stopping, search for `stop_local.bat`. If found, execute it to tear down Docker containers and PM2 tasks cleanly.
  - If no batch files exist, fallback to standard Node `npm run dev` and `npm run start:dev` command runners.
