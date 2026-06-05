# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a workspace containing three independent projects. They share no code — each has its own dependencies, build pipeline, git history, and CLAUDE.md. When working on a project, always `cd` into its directory first.

- **ClaudeCode/** — Anthropic Claude Code CLI 的中文下载/介绍页。Express + Vite + vanilla TypeScript (no React)。所有 HTML 由 `src/main.ts` 模板字符串生成，SVG 图标在 `src/icons.ts`。pnpm only。
- **OpenClaw/** — OpenClaw 龙虾助手中文下载页。Express + Vite + vanilla TypeScript (no React)。所有 HTML 由 `src/main.ts` 模板字符串生成，SVG 图标在 `src/icons.ts`。pnpm only。
- **Utaisds/** — AI 影视 Studio (短剧/漫画视频制作工具)。Next.js 15 + React 19 + Prisma + BullMQ。有自己的 `.git` 目录，独立于父仓库管理。npm only。有完整的测试套件和大量 guard scripts。

## Conventions by Project

| | ClaudeCode / OpenClaw | Utaisds |
|---|---|---|
| Package manager | pnpm (>=9.0.0), npm/yarn blocked | npm (>=9.0.0) |
| TypeScript | strict, no implicit any | strict |
| Framework | Express + Vite, vanilla TS | Next.js 15 App Router + React 19 |
| Tests | None | Vitest (unit, integration, system, regression) |
| Dev port | 5000 | 3000 (Docker: 13000) |
| i18n | VITE_ env vars / JSON locales | next-intl (`/zh/...`, `/en/...`) |
| Design | Dark-themed, Chinese-primary, no tech-blue/purple | Dark glass theme, Chinese-primary |

Both ClaudeCode and OpenClaw were created by the Coze Coding CLI. Build/dev/start commands are shell scripts in `scripts/` directories. `COZE_PROJECT_ENV` controls dev/prod mode.

## Commands

### ClaudeCode / OpenClaw (from within project subdirectory)

```bash
pnpm install     # Install dependencies
pnpm dev         # Start dev server (port 5000)
pnpm build       # Production build
pnpm start       # Start production server
pnpm ts-check    # TypeScript type checking
pnpm lint        # ESLint
pnpm validate    # Parallel ts-check + lint:build
```

### Utaisds (from within `Utaisds/` subdirectory)

```bash
cp .env.example .env   # Must do BEFORE npm install
npx prisma db push     # First-time DB schema — MUST run before dev server
npm install
npm run dev            # Starts: Next.js (turbopack) + workers + watchdog + Bull Board
npm run test:unit:all  # All unit tests
npm run test:all       # Full regression suite
npm run typecheck      # tsc --noEmit
npm run lint:all       # ESLint across entire project
npm run verify:push    # lint + typecheck + test:all + build
```

## Project-Specific Docs

Each project has detailed architecture, design system, and code style docs — read those when working within a project:

- `ClaudeCode/CLAUDE.md` — Express+Vite architecture, vanilla TS patterns, dark theme tokens (terracotta, terminal-green, code-purple), terminal animation, copy buttons
- `ClaudeCode/DESIGN.md` — Color palette, typography, animation specs, page structure, design prohibitions
- `ClaudeCode/AGENTS.md` — Directory layout, code style, common fixes (Tailwind config, copy button rebinding)
- `OpenClaw/CLAUDE.md` — Express+Vite architecture, platform detection, animation system, API routes, env vars
- `OpenClaw/DESIGN.md` — Lobster-red accent (#F04D5A), terminal interaction design, page structure
- `OpenClaw/AGENTS.md` — Coding conventions, i18n structure, build pipeline details
- `Utaisds/CLAUDE.md` — Full architecture: multi-process runtime, model gateway, task system, storage abstraction, billing, guard scripts, i18n