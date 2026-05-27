# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a workspace containing two independent Chinese-language product landing/download sites. They share no code — each has its own dependencies, build pipeline, and CLAUDE.md.

- **ClaudeCode/** — Anthropic Claude Code CLI 的中文下载/介绍页。Express + Vite + vanilla TypeScript (no React)。所有 HTML 由 `src/main.ts` 模板字符串生成，SVG 图标在 `src/icons.ts`。
- **OpenClaw/** — OpenClaw 龙虾助手中文下载页。Express + Vite + vanilla TypeScript (no React)。所有 HTML 由 `src/main.ts` 模板字符串生成，SVG 图标在 `src/icons.ts`。

## Shared Conventions

- **Package manager**: pnpm only (>=9.0.0). Both projects have `preinstall` scripts that block npm/yarn.
- **TypeScript strict**: No implicit `any`, no `as any`. All Express req/res typed.
- **Coze platform**: Both projects were created by the Coze Coding CLI. Build/dev/start commands are shell scripts in `scripts/` directories. `COZE_PROJECT_ENV` controls dev/prod mode.
- **Port 5000**: Both dev servers run on port 5000 by default.
- **Design**: Both are dark-themed, Chinese-primary landing pages. No tech-blue/purple gradients as primary color. No cartoon/cute elements.
- **No tests**: Neither project has a test suite.

## Commands

All commands are run from within the project subdirectory:

```bash
cd ClaudeCode    # or cd OpenClaw
pnpm install     # Install dependencies
pnpm dev         # Start dev server (port 5000)
pnpm build       # Production build
pnpm start       # Start production server
pnpm ts-check    # TypeScript type checking
pnpm lint        # ESLint
pnpm validate    # Parallel ts-check + lint:build
```

## Project-Specific Docs

Each project has detailed architecture, design system, and code style docs — read those when working within a project:

- `ClaudeCode/CLAUDE.md` — Express+Vite architecture, vanilla TS patterns, dark theme tokens (terracotta, terminal-green, code-purple), terminal animation, copy buttons
- `ClaudeCode/DESIGN.md` — Color palette, typography, animation specs, page structure, design prohibitions
- `ClaudeCode/AGENTS.md` — Directory layout, code style, common fixes (Tailwind config, copy button rebinding)
- `OpenClaw/CLAUDE.md` — Express+Vite architecture, platform detection, animation system, API routes, env vars
- `OpenClaw/DESIGN.md` — Lobster-red accent (#F04D5A), terminal interaction design, page structure
- `OpenClaw/AGENTS.md` — Coding conventions, i18n structure, build pipeline details