# 🎛️ Orchestrator — Personal AI Agent Command Center & Terminal Multiplexer

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg?logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E.svg?logo=nestjs)
![node-pty](https://img.shields.io/badge/node--pty-Pseudoterminal-339933.svg?logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-WebSockets-010101.svg?logo=socket.io)
![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-f69220.svg?logo=pnpm)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

**Centralized developer cockpit managing background terminals, node-pty sessions, subagent execution pipelines, Telegram remote control, and visual automation workflows.**

[System Architecture](#-system-architecture) • [Database ERD](#-database-erd) • [Execution Flow](#-pty-streaming--agent-execution-flow) • [Quick Start](#-quick-start)

</div>

---

## ⚡ Overview

**Orchestrator** is an operating dashboard for autonomous coding agents and background processes. It spawns, monitors, and multiplexes native system shells using **node-pty** over WebSockets, captures streaming terminal logs, triggers workflow graphs, and relays interactive command sessions directly to Telegram for mobile supervision.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph UI["🖥️ Frontend Web Cockpit (Next.js 16 + React 19)"]
        TermGrid["Interactive Terminal Grid (Xterm.js)"]
        AgentManager["Agent Subtask Manager & Kanban"]
        TelemetryPanel["Process CPU / Memory / IO Telemetry"]
        WorkflowEditor["Visual DAG Pipeline Editor"]
        
        TermGrid & AgentManager & TelemetryPanel & WorkflowEditor
    end

    subgraph Core["⚡ NestJS Gateway & Process Hub"]
        SocketGateway["WebSocket Gateway (Socket.io)"]
        PTYEngine["node-pty Terminal Multiplexer (ConPTY / Bash)"]
        AgentRunner["Subagent Dispatcher & Tool Interceptor"]
        TelegramBot["Telegram Remote Control Bot"]
        
        UI <--> SocketGateway
        SocketGateway <--> PTYEngine
        SocketGateway <--> AgentRunner
        AgentRunner <--> TelegramBot
    end

    subgraph OSProcesses["⚙️ Operating System Execution Layer"]
        Shell1["Terminal 1: Next.js Dev Server"]
        Shell2["Terminal 2: Python IPC Engine"]
        Shell3["Terminal 3: Docker Compose Daemon"]
        AgentWorker["Autonomous Agent Execution Process"]
        
        PTYEngine --> Shell1 & Shell2 & Shell3
        AgentRunner --> AgentWorker
    end

    subgraph Persistence["💾 Persistence Layer"]
        DB[(SQLite WAL Datastore)]
        Logs[(Disk Log Ring Buffers)]
        
        Core --> DB & Logs
    end
```

---

## 📊 Database ERD

```mermaid
erDiagram
    SESSIONS ||--o{ TERMINALS : spawns
    TERMINALS ||--o{ AUDIT_LOGS : records
    SESSIONS ||--o{ AGENT_TASKS : executes
    AGENT_TASKS ||--o{ AUDIT_LOGS : generates
    WORKFLOWS ||--o{ AGENT_TASKS : defines

    SESSIONS {
        string id PK "UUID"
        string title
        string status "ACTIVE | CLOSED"
        datetime startedAt
        datetime endedAt
    }

    TERMINALS {
        string id PK "UUID"
        string sessionId FK
        string shellType "powershell | bash | cmd"
        int pid
        string cwd
        boolean isAlive
    }

    AGENT_TASKS {
        string id PK "UUID"
        string sessionId FK
        string prompt
        string model
        string status "QUEUED | RUNNING | COMPLETED | FAILED"
        int exitCode
        datetime createdAt
    }

    WORKFLOWS {
        string id PK "UUID"
        string name
        json dagNodes
        json dagEdges
        boolean isAutomated
    }

    AUDIT_LOGS {
        string id PK "UUID"
        string targetId FK
        string level "INFO | WARN | ERROR"
        text message
        datetime timestamp
    }
```

---

## 🔄 PTY Streaming & Agent Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Mobile
    participant Cockpit as Orchestrator UI / Telegram
    participant Gateway as NestJS WebSocket Hub
    participant PTY as node-pty Engine
    participant Shell as Windows ConPTY
    participant SQLite as SQLite WAL

    Dev->>Cockpit: Dispatch command / Start agent task
    Cockpit->>Gateway: WS: spawn_pty { cmd: "pnpm test", cwd: "/project" }
    Gateway->>PTY: nodepty.spawn("powershell.exe")
    PTY->>Shell: Attach stdin/stdout pipe
    
    loop Stream Output
        Shell-->>PTY: Binary data chunks
        PTY-->>Gateway: Raw VT100 ansi bytes
        Gateway-->>Cockpit: WS Broadcast: pty_data
        Cockpit-->>Dev: Xterm.js renders live terminal frame
    end
    
    Shell-->>PTY: Process Exit (Code: 0)
    PTY->>SQLite: Persist session run log & exit status
    Gateway-->>Dev: 🔔 Push Notification: Task Finished Successfully!
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Set PORT=4000, TELEGRAM_BOT_TOKEN, JWT_SECRET
```

### 3. Run Development Server
```bash
pnpm run dev
```

Visit `http://localhost:3000` to access the Orchestrator cockpit.

---

## 📄 License
MIT License © **[Ros Rendo](https://github.com/RosRendo)**
