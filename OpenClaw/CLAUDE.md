# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenClaw Chinese download page — a dark-themed, immersive product landing site for an AI assistant called "OpenClaw" (龙虾助手). The site auto-detects user platform (Windows/macOS ARM/macOS Intel) and provides download links, terminal demo interactions, and model integration showcases.

## Architecture

Single-process Express + Vite app (created by Coze Coding CLI):

- **Frontend**: Vanilla TypeScript (no React/Vue). All HTML is generated via template literals in `src/main.ts`, styled with Tailwind CSS utility classes + custom CSS animations in `src/index.css`. SVG icons are inline functions in `src/icons.ts`.
- **Backend**: Express server in `server/server.ts`. Routes defined in `server/routes/index.ts`. Vite runs as middleware in dev mode (`server/vite.ts`); static files served from `dist/` in production.
- **Build**: Shell scripts in `scripts/` handle dev/build/start. Frontend builds via `pnpm vite build` → `dist/`. Backend bundles via `pnpm tsup` → `dist-server/server.js` (CommonJS).

## Commands

```bash
pnpm install              # Install dependencies (pnpm only, npm/yarn forbidden)
pnpm dev                  # Start dev server (Express + Vite HMR, port 5000)
pnpm build                # Build frontend + backend
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm lint:build           # Run ESLint (quiet, for CI)
pnpm ts-check             # TypeScript type checking (no emit)
pnpm validate             # Parallel ts-check + lint:build
```

## Key Technical Details

- **Package manager**: pnpm only (>=9.0.0). A `preinstall` script blocks npm/yarn.
- **TypeScript**: strict mode. No implicit `any` or `as any`. All Express `req`/`res` must be typed.
- **Platform detection**: `detectPlatform()` in `src/main.ts` uses UA strings + WebGL extensions to identify Windows vs macOS ARM vs macOS Intel.
- **Animations**: CSS keyframes in `src/index.css` (jelly, gradientShift, scalePulse, fadeInUp, etc.) + IntersectionObserver for scroll-triggered reveals.
- **API routes**: All start with `/api`. New routes go in `server/routes/index.ts` or new files imported into `server/server.ts`.
- **Environment variables**: Client-side must prefix with `VITE_` to be accessible via `import.meta.env`.
- **Dev mode flag**: `process.env.COZE_PROJECT_ENV !== 'PROD'` controls dev/prod behavior in both server and vite integration.

## Design Constraints

- Accent color: `#F04D5A` (lobster red), teal accent: `#00E5CC`, dark bg: `#030712`
- No blue-purple gradients as primary color
- No cartoon/cute elements
- Chinese-primary font stack: "PingFang SC", "Microsoft YaHei"
- Code font: "JetBrains Mono"