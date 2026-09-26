# Architectural Decision: Full-Height Sidebar Viewport Layout

## Context
The user requested a standard dashboard layout where:
1. The **Sidebar** is on the far left and stretches all the way from the top of the viewport to the bottom.
2. The right side has a **Top Bar** containing breadcrumbs and dynamic action buttons.
3. Below the Top Bar is the **Main Workspace** panel, containing the grid of project directories or the agent web view frames.

## Implementation Details
We updated the dashboard landing page (`frontend/src/app/page.tsx`) to shift from a stacked layout (header spanning full-width on top) to a column-first split layout:
- **Root Container:**
  - `height: 100vh`, `width: 100vw`, `display: flex`, `flexDirection: row`, `overflow: hidden`, `padding: 0`.
- **Sidebar (`aside`):**
  - Positioned far-left.
  - Stretches `height: 100%` top-to-bottom.
  - Width fixed at `280px` with a solid right border and no border radius.
  - Houses the brand logo (`ORCHESTRATOR`), sub-labels, and the navigation items.
- **Right Area Wrapper:**
  - `flex: 1`, `height: 100%`, `display: flex`, `flexDirection: column`, `overflow: hidden`.
- **Top Bar (`header`):**
  - Height of `64px` inside the right area.
  - Contains path breadcrumbs (`Dashboard / Projects` or `Dashboard / AgentName`) and dynamic workspace actions (e.g. `+ New Project`).
- **Main Workspace Content (`main`):**
  - Fills the remaining height (`flex: 1`), padding is set to `32px`.
  - Content overflow handles scrolling (`overflowY: auto`) internally, keeping the top bar and sidebar pinned to the page.

## Result
This layout aligns with standard SaaS dashboards (e.g., Slack, Vercel, VS Code) and ensures a premium, clean developer experience.

## Logo Branding and Sidebar Guidelines
- **Logo Style:** The brand wordmark `ORCHESTRATOR` retains a high-end purple-indigo linear text gradient (`linear-gradient(90deg, #818cf8, #a78bfa)`) with a hidden text fill, sitting on top of a soft blurred glow element (`filter: blur(16px)`).
- **Branding Consistency:** The logo is displayed at the top of **all navigation sidebars** in the application:
  1. At the top of the Left Portal Sidebar on the main dashboard (`app/page.tsx`).
  2. At the top of the Left File Explorer panel inside the project workspace code console (`app/workspace/[id]/page.tsx`).
- **Sidebar Sizing:** Sidebar widths are kept compact (`280px`) with fine border separating lines (`#1d1e22`) and solid layout colors matching the premium dark theme.
- **Theme Variables:**
  - Background is `#0a0b0d` (ultra dark slate).
  - Sidebar is `#0f1013` (slightly lighter gray).
  - Metric / Project Cards are `#13151a` (solid slate cards) with `#1d1e22` borders.
  - Primary Accent is `#8b5cf6` (vibrant purple).
- **Navigation Controls:** Row-based `.sidebar-item` list elements, custom search bars, and metrics tab are implemented natively to mimic enterprise SaaS platforms. Emojis for core actions (Workspaces, Search, Analytics, Add Agent), external platforms (ChatGPT, Claude, Gemini), and local agents (Hermes, OpenCode) have been replaced with precise inline vector SVG outlines.
- **Portal Embeds:** External agent dashboards render their target frames directly and immediately upon sidebar click to provide a native, zero-click portal experience.
- **Project Cards:** Card folder icons render with white fill/stroke against a neutral, semi-transparent white box (`rgba(255, 255, 255, 0.08)`). Project titles are rendered in bold pure white (`#ffffff`) and workspace location paths use a clean, secondary opacity white (`rgba(255, 255, 255, 0.6)`) to keep cards visually clean and eliminate raw purple/indigo text glows.
- **Git Cloning Workspace Sandboxes:** Supported direct remote cloning on project creation when a Git URL (`http://`, `https://`, `git@`, or ending in `.git`) is inputted. Clones repositories using a fast shallow-depth command (`git clone --depth 1`) directly into the server's `backend/cloned_repos/` cache workspace and registers this directory as the workspace path. Deleting a cloned project automatically purges the corresponding repository folder from the server's disk storage to prevent disk leakages.
- **System Terminal (Dashboard):** Added a global "System Terminal" tab under the Main Menu sidebar utilizing a vector command-line SVG. The gateway fallback targets `process.cwd()` (the Orchestrator server's root folder) whenever `projectId` is set to `"system"`, allowing terminal shell operations on the host system directly from the main dashboard.
