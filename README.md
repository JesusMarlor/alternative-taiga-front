# Taiga Modern Frontend

A fast, responsive, and customizable next-generation frontend for [Taiga.io](https://taiga.io/), built with **Node.js v22**, **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**.

Designed to replace the legacy AngularJS frontend with a fluid, modern user experience (inspired by Linear and modern agile tools), featuring dynamic theming, white-label branding, and real-time updates via WebSockets.

---

## ✨ Features

- **⚡ Lightning-Fast Performance**: Powered by Vite and React 19 with instant Hot Module Replacement (HMR) and optimized production bundles.
- **🎨 Dynamic Theming & White-Labeling**:
  - Live color palette switcher (Alternative Violet, Taiga Teal, Emerald Peak, Oceanic Blue, Cyber Rose, Amber Sunset, Slate Executive).
  - Custom HEX color picker that dynamically generates CSS variables for all Tailwind color shades (`50` to `900`).
  - Dark, Light, and System display modes.
  - Fully customizable brand identity: change company logo (URL/image) and application title directly in the UI with local persistence.
- **🔄 Real-Time WebSockets**:
  - Native integration with `taiga-events` via `wss://`.
  - Live board synchronization across team members with automatic reconnection, heartbeat management, and `x-session-id` tracking.
- **📊 Comprehensive Agile Modules**:
  - **Kanban Board**: Drag-and-drop workflow, status limits, user story cards with points, tags, and assignee avatars.
  - **Scrum & Backlog**: Sprint/milestone tracking, burndown progress, points estimation, and unassigned backlog management.
  - **Issues & Bugs**: Matrix tracking with priority, severity, type, and quick creation modals.
  - **Epics**: Strategic goals and multi-story progress tracking.
  - **Wiki**: Markdown documentation viewer and page navigation.
  - **Team Directory**: Roles, member avatars, and permission badges.
  - **Project Settings (`/admin/project-profile/details`)**: Edit project name, description, privacy (Public vs. Private), module toggles, and talent search notes.
- **📱 Fully Responsive**: Seamless experience on mobile, tablet, and widescreen desktop displays.

---

## 🛠️ Prerequisites

- **Node.js**: `v22.x` (or newer)
- **pnpm**: `v9.x` / `v10.x` / `v12.x` (can be enabled via `corepack enable`)
- An active Taiga backend instance (e.g. `https://your-taiga-server.com` or local `http://localhost:8000`).

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd alternative-taiga-front
```

### 2. Use Node.js 22 & Enable pnpm
If you use [nvm](https://github.com/nvm-sh/nvm):
```bash
nvm use 22
corepack enable
```

### 3. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```

Open `.env` and configure your Taiga backend URL and settings:
```env
# Taiga REST API base URL (/api/v1 uses the local Vite proxy during development)
VITE_API_BASE_URL=/api/v1

# Real-time WebSocket server endpoint (taiga-events)
VITE_EVENTS_URL=wss://your-taiga-domain.com/events

# Target server for the local Vite proxy (avoids CORS issues during local dev)
VITE_TAIGA_BACKEND_URL=https://your-taiga-domain.com

# Default branding names (can also be customized from the UI)
VITE_DEFAULT_APP_TITLE=Taiga Modern UI
VITE_DEFAULT_COMPANY_NAME=Taiga
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Start Development Server
```bash
pnpm dev
```

The application will be accessible at:
👉 **`http://localhost:5173`**

---

## ⚙️ Environment Configuration Guide

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base path for REST API calls | `/api/v1` |
| `VITE_EVENTS_URL` | WebSocket URL for live updates (`taiga-events`) | `wss://taiga.domain.com/events` |
| `VITE_TAIGA_BACKEND_URL` | Destination backend for Vite dev proxy | `https://taiga.domain.com` |
| `VITE_DEFAULT_APP_TITLE` | Default application title displayed in header | `Taiga Modern UI` |
| `VITE_DEFAULT_COMPANY_NAME`| Default organization / brand name | `Taiga` |

---

## 📦 Building for Production

To create an optimized production build:

```bash
pnpm build
```

This compiles TypeScript, bundles static assets with Vite into the `dist/` directory, and checks types with `tsc`.

To preview the built production bundle locally:
```bash
pnpm preview
```

---

## 🐳 Docker Deployment

A production-ready multi-stage [Dockerfile](Dockerfile), [nginx.conf](nginx.conf), and [docker-compose.yml](docker-compose.yml) are included.

### Option 1: Run with Docker Compose (Recommended)
```bash
# 1. Create your environment file from template
cp .env.example .env

# 2. Build and start container in detached mode
docker compose up -d --build

# 3. Check logs
docker compose logs -f
```
The app will be running on port `8080` (e.g. `http://your-vps-ip:8080`).

### Option 2: Build & Run with plain Docker
```bash
# Build image
docker build -t taiga-modern-frontend:latest .

# Run container
docker run -d \
  --name taiga-modern-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  taiga-modern-frontend:latest
```

---

## 📁 Project Structure

```
alternative-taiga-front/
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules (protects credentials & .env)
├── .nvmrc                  # Node version specification (v22)
├── index.html              # HTML entry point with Inter Google font
├── package.json            # Scripts & dependencies (pnpm)
├── pnpm-lock.yaml          # pnpm lockfile
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Dynamic Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with proxy and path aliases
└── src/
    ├── api/                # API client & services
    │   ├── auth.ts         # Login & JWT refresh
    │   ├── client.ts       # Fetch wrapper with x-session-id & Bearer token
    │   ├── epics.ts        # Epics & Wiki API
    │   ├── events.ts       # Real-time WebSocket client (taiga-events)
    │   ├── issues.ts       # Issues & Bugs API
    │   ├── milestones.ts   # Sprints API
    │   ├── projects.ts     # Projects, memberships & settings API
    │   ├── tasks.ts        # Tasks API
    │   └── userstories.ts  # User stories API
    ├── components/
    │   ├── layout/         # Navbar, Sidebar, ProjectLayout
    │   ├── shared/         # UserAvatar, StatusBadge, PriorityBadge
    │   └── theme/          # ThemeDrawer & branding customizer
    ├── pages/
    │   ├── EpicsPage.tsx
    │   ├── IssuesPage.tsx
    │   ├── KanbanPage.tsx
    │   ├── LoginPage.tsx
    │   ├── ProjectsPage.tsx
    │   ├── ProjectSettingsPage.tsx
    │   ├── ScrumPage.tsx
    │   ├── TeamPage.tsx
    │   └── WikiPage.tsx
    ├── stores/             # Zustand state management
    │   ├── authStore.ts    # Authentication state & persistence
    │   ├── projectStore.ts # Active project & memberships state
    │   └── themeStore.ts   # Theme, colors & white-label settings
    ├── types/              # TypeScript interfaces for Taiga models
    │   └── taiga.ts
    ├── utils/
    │   └── colors.ts       # Dynamic HEX to CSS variables converter
    ├── App.tsx             # Routes & authentication guards
    └── main.tsx            # Application bootstrapping
```

---

## 🔒 Security Best Practices

- Never commit `.env` or files containing production passwords, tokens, or private endpoints.
- The `.gitignore` file is pre-configured to ignore `.env` and all `.env.*` variants while tracking `.env.example`.
- All authentication tokens are stored securely in browser storage and transmitted using Bearer authorization headers over HTTPS/WSS.

---

## 📄 License

This project is an open-source frontend client designed to interact with the Taiga.io REST and WebSocket API.
Licensed under the [MIT License](LICENSE).
