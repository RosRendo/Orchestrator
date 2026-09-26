# Orchestrator V1 Architectural Decisions

Documenting the key technical decisions made during the initial V1 architecture setup of the Orchestrator workspace.

---

## 1. Project Monorepo Structure
We adopted a separate frontend/backend folder structure:
*   `/backend`: NestJS application serving REST endpoints and WebSockets gateway.
*   `/frontend`: Next.js App Router application implementing the IDE layout.

This allows modular scaling, keeps client/server dependencies separate, and simplifies parallel development.

---

## 2. SQLite Database with Prisma 6
*   **Decision**: Downgraded to Prisma v6 instead of Prisma 7.
*   **Rationale**: Prisma 7 requires driver adapters (such as `@prisma/adapter-better-sqlite3` for local SQLite databases). On Windows systems, installing and building these adapters requires native C++ build tools (Visual Studio Build Tools), which often leads to compilation errors in local development environments.
*   **Result**: Prisma v6 runs its standard engines out-of-the-box, providing clean, compiler-free SQLite connections.

---

## 3. Persistent Terminal Sessions via child_process
*   **Decision**: Spawning persistent `powershell.exe` (Windows) or `bash` (Unix) processes using Node's standard `child_process.spawn`.
*   **Rationale**: Interactive terminal windows usually require native pseudoterminal libraries like `node-pty`. However, `node-pty` has strict platform compilation dependencies on Windows. By writing a streaming layer wrapping the standard PowerShell input/output streams and connecting them to WebSockets, we bypass compiler errors while maintaining process state and variables.

---

## 4. Real-time File Synchronization (Chokidar + WebSockets)
*   **Decision**: Bridged `chokidar` watchers on the backend to Socket.io events.
*   **Rationale**: Traditional file trees require manual refresh actions. In an AI agent workspace, the agent runs CLI tasks that create or modify files dynamically. Integrating a folder watcher pushes immediate `files:changed` notifications, making the frontend tree look incredibly alive and responsive.
