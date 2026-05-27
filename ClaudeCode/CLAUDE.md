# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chinese-language landing/download page for Anthropic's Claude Code. Single-page site with dark theme, terminal animation, feature cards, install guide, and IDE integration sections. Built with Express + Vite + vanilla TypeScript (no React).

## Commands

- `pnpm dev` — Start dev server (Express + Vite HMR, port 5000). Runs `scripts/dev.sh` which kills existing port process then launches `tsx watch server/server.ts`
- `pnpm build` — Production build. Runs `scripts/build.sh`: `pnpm install` → `pnpm vite build` → `pnpm tsup server/server.ts` → frontend to `dist/`, server to `dist-server/server.js`
- `pnpm start` — Start production server from `dist-server/server.js` on port 5000
- `pnpm ts-check` — TypeScript type checking (`tsc -p tsconfig.json`)
- `pnpm lint` — ESLint check
- `pnpm lint:build` — ESLint check (quiet mode)
- `pnpm validate` — Runs `ts-check` + `lint:build` in parallel

No test suite exists in this project.

**Package manager: pnpm only** (preinstall script blocks npm/yarn).

## Environment

- `COZE_PROJECT_ENV` — Controls dev/prod mode (`DEV` vs `PROD`). The server reads this to decide whether to use Vite middleware or static file serving.
- `PORT` — Server port (defaults to 5000)
- `HOSTNAME` — Server hostname (defaults to `localhost`)
- `DEPLOY_RUN_PORT` — Override port for deployment (used by `scripts/dev.sh`)

## Architecture

- **Frontend**: Vanilla TypeScript. All HTML is generated via template literals in `src/main.ts`, styled with Tailwind CSS utility classes + custom CSS in `src/index.css`. SVG icons are inline functions in `src/icons.ts`.
- **Backend**: Express server in `server/server.ts`. Routes in `server/routes/index.ts`. Vite middleware in dev (`server/vite.ts`); static files from `dist/` in production.
- **Build**: Shell scripts in `scripts/` handle dev/build/start. Frontend: `pnpm vite build` → `dist/`. Backend: `pnpm tsup` → `dist-server/server.js` (CommonJS, Node 20 target).

## Design System (see DESIGN.md)

Dark theme with custom color CSS variables in `src/index.css`:

- `--accent` (#d4704e) — terracotta brand accent, CTAs, highlights
- `--terminal-green` (#4ade80) — terminal output, success states
- `--code-purple` (#a78bfa) — info/secondary accent
- `--card-bg` (#1a1a2e) — card background
- `--secondary-bg` (#16213e) — secondary background
- `--fg` (#f0ece2) — primary text

Font stack: Chinese-specific — 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', then system sans-serif. Monospace: SF Mono, Menlo, Consolas.

**Design prohibitions**: No tech-blue/purple gradients as primary color. No pure-white card backgrounds. No 3D renders or excessive decoration. No more than 2 concurrent animations. No pure-black text on dark backgrounds.

## Key Patterns

- All page sections are template literal HTML in `src/main.ts` — scroll tracking, tab switching, copy buttons, terminal animation all use vanilla DOM event handlers
- `initApp()` is the entry point: calls `renderApp()` (innerHTML) then `setupInteractions()` (DOM events)
- Animations use CSS keyframes + `IntersectionObserver` for scroll-triggered reveals, not animation libraries
- Terminal animation uses `setTimeout` chain with varying delays (800ms initial, 120ms headers, 200ms others)
- Install section tab switching re-renders the steps area via `renderInstallSteps()` and re-binds copy buttons
- Copy buttons use `navigator.clipboard.writeText()` with visual feedback swap
- Environment variables: client-side must prefix with `VITE_` to be accessible via `import.meta.env`