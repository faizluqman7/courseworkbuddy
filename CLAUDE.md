# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (vite, proxies /api to localhost:8000)
npm run build    # tsc + vite build
npm run lint     # eslint
npm run preview  # preview prod build
```

## Architecture

React 19 + Vite + Tailwind 4 SPA for coursework decomposition ("InfoFlow").

**Flow:** User uploads PDF → `UploadZone` → `useDecomposition` hook (react-query mutation) → POST `/api/decompose` → displays `Roadmap` with milestones/tasks.

**Key paths:**
- `src/types/index.ts` - core types: `Task`, `Milestone`, `DecompositionResponse`
- `src/services/api.ts` - API client (`decomposePdf`, `ApiError`)
- `src/hooks/useDecomposition.ts` - react-query mutation wrapper
- `src/components/tasks/Roadmap.tsx` - main task visualization
- `src/components/ui/` - CVA-based UI primitives (button, card, badge)
- `src/lib/utils.ts` - `cn()` helper (clsx + tailwind-merge)

**Path alias:** `@/` → `./src/`

**Backend:** Expects API at `localhost:8000` (proxied via vite). Not in this repo.
