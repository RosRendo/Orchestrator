# Knowledge Sync: Orchestrator Trading Agent & Embedded Dashboard

## 1. Port 3000 Conflict Resolution
*   **Context**: The user runs a dockerized multi-service stack for their custom trading dashboard (Journex). The frontend container in that compose file maps port `3000` to the host.
*   **Problem**: By default, Next.js starts on port `3000`. Running both the Orchestrator panel and the Journex containers simultaneously triggered port allocation failures on the host machine.
*   **Resolution**: Shifted the Orchestrator Next.js frontend dev port to `3010` via `package.json` (`next dev -p 3010`). This frees up port `3000` entirely for the user's dashboard container stack.

## 2. TCP Port Telemetry Scanner
*   **Context**: The cockpit dashboard needs to display whether local workspace engines are online or offline (ports 3000, 3005, 3010, 5000, 5003, 5555, 5678, 5432).
*   **Design Choice**: Checking raw ports via client-side fetch from the browser throws CORS blocking alerts for non-HTTP ports or ports without CORS headers.
*   **Implementation**: Added a backend handler `GET /automation/ports/check` in NestJS `AutomationController`. It pings local host TCP ports using raw Node `net.Socket` connection attempts (600ms timeouts), returning a clean status map.

## 3. Automated Database Port 5432 Switcher
*   **Problem**: Both the native local PostgreSQL installation on the Windows host and the dockerized Dashboard project database container default to port `5432`. Spawning the Dashboard container failed with `5432 failed: port is already allocated` due to the native service owning the port.
*   **Resolution**: Integrated automated Windows service switching inside the NestJS `projects.service.ts` startup/shutdown script runners:
    *   **Startup Switch**: Before running `start_local.bat` for the Dashboard, the service automatically executes `net stop postgresql-x64-18` to stop the native service and free up port `5432`.
    *   **Startup Note**: Returns notification warnings if the backend is not running with administrative privileges, helping users run it with UAC elevation.
    *   **Shutdown Switch**: After running `stop_local.bat` for the Dashboard, the service automatically executes `net start postgresql-x64-18` to start the native service back up and restore host operations.

## 4. Prisma Alpine Musl Docker Resolution
*   **Problem**: When starting the Dashboard backend container, Prisma fails to load its engine with error `PrismaClientInitializationError: Unable to require(/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node)`.
*   **Diagnosis**: Alpine Linux does not contain `openssl` libraries by default. Because of this, Prisma is unable to load the engine on runtime.
*   **Resolution**: Modified `Dashboard/backend/Dockerfile` to install dependencies natively on container build: `RUN apk add --no-cache openssl libc6-compat`.

## 5. Next.js Docker Proxy Resolution (ECONNREFUSED)
*   **Problem**: Next.js frontend container throws HTTP 500 errors (`ECONNREFUSED 127.0.0.1:5000` / `127.0.0.1:5003`) when proxying WebSocket and API traffic. Next.js statically bakes `next.config.ts` rewrite destinations at build time, failing to read runtime env variables.
*   **Resolution**: 
    *   **Dockerfile build args**: Added `ARG` and `ENV` parameters for `INTERNAL_API_URL` and `BRIDGE_URL` inside `Dashboard/frontend/Dockerfile`.
    *   **Docker Compose Arguments**: Modified `docker-compose-full.yml` to feed build arguments mapping `INTERNAL_API_URL: http://backend:5000` and `BRIDGE_URL: http://host.docker.internal:5003` to the frontend container build stage, and added `extra_hosts` for `host.docker.internal` gateway resolution.
    *   **Dynamic configuration**: Updated `Dashboard/frontend/next.config.ts` to utilize environment variables for proxy rewrites, with localhost fallbacks for native runs.

## 6. Trading Agent Simplified Dashboard Workspace
*   **Context**: The user wanted the custom operations panels removed from the cockpit, as the local Journex UI dashboard (embedded on port 3000) already displays all statistics, orders, webhooks, and balance cards.
*   **Layout Implementation**:
    *   **Standby Launcher (Offline State)**: If the service is offline, it renders a sleek launcher cockpit showing a prominent **"🚀 Run Trading Agent"** button.
    *   **Active Cockpit Dashboard (Online State)**: Shows only:
        *   **Header Bar**: Displays status highlights and the **"🛑 Stop Trading Agent"** shutdown action trigger.
        *   **Full-Frame Viewport**: Includes an iframe rendering the local Journex UI dashboard at `http://localhost:3000/dashboard` directly.

## 7. Cockpit Sidebar Reorganization
*   **Context**: The cockpit sidebar had unstructured tool groupings and some misordered items (like hardware monitoring being separated from system analytics, and dev tools scattered).
*   **Layout Reorganization**:
    *   **Main Menu**: Regrouped core systems. Moved `System Hardware` directly under `System Analytics` for unified system telemetry. Placed `Docker Manager` at the top level of this section before collapsible lists.
    *   **Knowledge & Planning**: Focused purely on knowledge hubs (`AI Intelligence`, `Obsidian Vault`, and `Notion Workspace`).
    *   **Developer Tools**: Added a new dedicated sidebar section grouping developer utilities together (`Database Explorer` (Prisma Studio), `API Client` (Postman), `Workspace Git`, and `GitHub Integration`).
    *   **Local Agents**: Elevated `Trading Agent` (Journex) to the absolute top of the Local Agents list to make it easily accessible.

## 8. Premium Agent Cockpits
*   **Context**: Added 6 new local agent roles to the workspace defaults list to allow users to invoke specialized operational capabilities.
*   **Registered Agents**:
    *   **Research Agent** (Web research, competitor analysis, paper summaries, reference libraries, reporting).
    *   **Business Agent** (Startup ideas, market validation, pricing tier reviews, persona generation, competitor metrics).
    *   **Marketing Agent** (SEO high-value keyword suggestions, content calendars, social blueprint scripts, brand guidelines).
    *   **Sales Agent** (Boutique lead profiling, outreach emails, CRM transaction logs, follow-up follow-throughs).
    *   **Finance Agent** (Expense breakdowns, investment guidelines, forecast budgets).
    *   **Personal Assistant** (Daily agenda schedules, backups, strategic planning, daily review).
*   **Design & Architecture**:
    *   Created `AgentCockpit` React dashboard rendering dynamically for these local agents.
    *   Features a split interface: the left panel selects the agent's capability, and the right panel takes query inputs, displays a mock agent runtime sequence (status log timeline), and renders copyable Markdown outputs.


