# CLAUDE.md

## Project Overview

Utaisds AI 影视 Studio — an AI-powered short drama/comic video production tool. 

## Tech Stack
- **Framework**: Next.js 15 App Router + React 19
- **Database**: MySQL + Prisma ORM + Redis + BullMQ + MinIO
- **Styling**: Tailwind CSS v4
- **Auth**: NextAuth.js
- **i18n**: next-intl (Chinese/English)
- **Package Manager**: **npm only** (>=9.0.0, yarn/pnpm blocked)

## Architecture

### Multi-Process Runtime

`npm run dev` starts four concurrent processes:

1. **Next.js (turbopack)** — React app + API routes (port 3002)
2. **BullMQ Workers** — Four worker types process async tasks:
   - `text.worker.ts` — LLM analysis, script generation
   - `image.worker.ts` — Image generation (characters, locations, panels)
   - `video.worker.ts` — Video generation, lip sync
   - `voice.worker.ts` — TTS, voice design
3. **Watchdog** — Monitors worker health, restarts hung tasks
4. **Bull Board** — Queue monitoring UI (separate port)

### Task System

All AI operations go through the task system for reliability and billing:

**Flow:** API route → `src/lib/task/submitter.ts` → BullMQ queue → Worker handler → Database update → SSE notification

**Key files:**
- `src/lib/task/types.ts` — Task types, statuses, billing info
- `src/lib/task/submitter.ts` — Task submission, billing freeze
- `src/lib/task/service.ts` — Task CRUD, state transitions
- `src/lib/task/queues.ts` — BullMQ queue definitions
- `src/lib/workers/handlers/` — Worker implementations per task type

**Task lifecycle:** `queued` → `processing` → `completed`/`failed`/`canceled`

### Graph Run System (Workflow Engine)

Complex multi-step workflows (story→script→storyboard) use the graph run system:

**Database models:** `GraphRun`, `GraphStep`, `GraphStepAttempt`, `GraphEvent`, `GraphArtifact`

**Key files:**
- `src/lib/run-runtime/service.ts` — Run lifecycle, step execution
- `src/lib/run-runtime/workflow.ts` — Workflow type definitions
- `src/lib/novel-promotion/run-stream/` — Streaming execution engine
- `src/lib/workflow-engine/` — Workflow orchestration (deprecated, use run-runtime)

**Pattern:** Each run has multiple steps, each step can have multiple attempts. Artifacts are stored per-step. Events stream via SSE.

### Billing System

Three-mode billing: `OFF` (disabled), `SHADOW` (track but don't enforce), `ENFORCE` (deduct balance)

**Flow:** Task submission → freeze estimated cost → worker completes → settle actual cost → release freeze

**Key files:**
- `src/lib/billing/cost.ts` — Price calculations per model/type
- `src/lib/billing/service.ts` — Billing orchestration
- `src/lib/billing/ledger.ts` — Balance tracking, transactions
- `src/lib/billing/task-policy.ts` — Billing rules per task type
- `prisma/schema.prisma` — `UserBalance`, `BalanceFreeze`, `BalanceTransaction`

### Model Gateway

Unified interface to multiple AI providers (OpenAI, Google, FAL, Ark, etc.):

**Key files:**
- `src/lib/model-gateway/` — Router, provider adapters
- `src/lib/model-gateway/openai-compat/` — OpenAI-compatible client
- `src/lib/model-capabilities/` — Model capability registry
- `src/lib/model-pricing/` — Pricing catalog
- `src/lib/providers/` — Provider-specific implementations (fal, bailian, siliconflow)

**Pattern:** All LLM/image/video/voice calls go through the gateway. No direct provider imports in business logic.

### Storage Abstraction

`src/lib/storage/` provides unified interface for file operations:

**Providers:** MinIO (default), Local filesystem, COS (placeholder)

**Key files:**
- `src/lib/storage/index.ts` — Provider factory
- `src/lib/storage/signed-urls.ts` — Presigned URL generation
- `src/lib/media/` — Media object management, `MediaObject` table references

**Pattern:** All file uploads/downloads use `getStorageProvider()`. Database stores `MediaObject` references, not raw URLs.

### Novel Promotion Workflow

Core business domain — transforms novels into videos:

**Stages:**
1. **Story → Script** — LLM analyzes novel, extracts characters/scenes/plot
2. **Script → Storyboard** — Generate episode clips, shots, panels
3. **Asset Generation** — AI creates character/location/panel images
4. **Voice Generation** — TTS for dialogue
5. **Video Generation** — Animate panels, lip sync

**Key directories:**
- `src/lib/novel-promotion/stages/` — Stage implementations
- `src/lib/novel-promotion/script-to-storyboard/` — Script processing
- `src/lib/novel-promotion/story-to-script/` — Novel analysis
- `src/lib/generators/` — AI generation (image, video, audio)

**Database models:** `NovelPromotionProject`, `NovelPromotionEpisode`, `NovelPromotionClip`, `NovelPromotionShot`, `NovelPromotionStoryboard`, `NovelPromotionPanel`, `NovelPromotionCharacter`, `NovelPromotionLocation`

### Asset Hub

Global asset library (characters, locations, voices) reusable across projects:

**Database models:** `GlobalCharacter`, `GlobalLocation`, `GlobalVoice`, `GlobalAssetFolder`

**Pattern:** Assets in asset hub are templates. When added to a project, they're copied to project-scoped tables (`NovelPromotionCharacter`, etc.).

## Key Patterns

### API Routes

All API routes follow this contract:
1. Validate auth via `getServerSession()`
2. Parse request with Zod schema
3. Submit task via `submitTask()` (never call AI directly)
4. Return task ID immediately (async processing)
5. Client polls via SSE or `/api/tasks/:id`

**Guard:** `scripts/guards/api-route-contract-guard.mjs` enforces this pattern.

### Database Access

- Use Prisma client: `import { prisma } from '@/lib/prisma'`
- All models use UUID primary keys
- Timestamps: `createdAt`, `updatedAt` on all tables
- Soft deletes not used — cascade deletes via foreign keys

### Error Handling

- Use `ApiError` class for HTTP errors in API routes
- Use `createScopedLogger()` for structured logging
- Never throw raw errors — wrap in domain-specific error types

### i18n

- Routes: `/[locale]/...` (zh, en)
- UI translations: `messages/{locale}.json`
- Prompt translations: `lib/prompts/**/*.txt` (Chinese/English pairs)
- Use `useTranslations()` hook in components
- Use `getTranslations()` in server components/API routes

### Testing Patterns

- **Unit tests:** Pure functions, no database
- **Integration tests:** Real database + Redis, test service layer
- **Chain tests:** End-to-end provider integration (mocked AI responses)
- **System tests:** Full workflow execution (story→script→storyboard)
- **Regression tests:** Bug fix verification

Test files colocated with implementation or in `tests/` directory. Use `describe`/`it`/`expect` from Vitest.

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes (zh, en)
│   ├── api/               # API routes
│   └── m/[publicId]/      # Public media routes
├── lib/                   # Core business logic
│   ├── task/              # Task system
│   ├── workers/           # BullMQ workers
│   ├── run-runtime/       # Graph workflow engine
│   ├── billing/           # Billing system
│   ├── model-gateway/     # AI provider abstraction
│   ├── storage/           # File storage
│   ├── media/             # Media object management
│   ├── novel-promotion/   # Core workflow
│   ├── generators/        # AI generation (image/video/audio)
│   ├── providers/         # Provider implementations
│   └── assets/            # Asset hub
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # React hooks
├── i18n/                  # i18n configuration
└── types/                 # TypeScript types

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests (api, billing, chain, task)
├── system/                # End-to-end workflow tests
├── regression/            # Bug fix verification
├── contracts/             # API contract tests
└── setup/                 # Test environment setup

scripts/
├── guards/                # Architectural invariant checks
└── migrations/            # Database migrations

prisma/
└── schema.prisma          # Database schema (1038 lines)
```

