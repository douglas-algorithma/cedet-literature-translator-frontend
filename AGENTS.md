# CEDET Literature Translator Frontend

## Overview
- Next.js 16 frontend for the CEDET Literature Translator.
- Package manager is `npm` with a committed `package-lock.json`.

## Setup
```bash
npm ci
```

## Validation
- Run targeted checks for touched areas first, then full validation when practical:
```bash
npm run test
npm run lint
npm run build
```

## Local Run
```bash
npm run dev
```

## Integration Notes
- The frontend talks to the backend through `NEXT_PUBLIC_API_URL` and `API_BASE_URL`.
- There is a backend proxy route under `app/backend-api/[...path]/route.ts`.
- If a change affects translation flows, also inspect related tests in `lib/*.test.ts`.

## Guardrails
- Preserve the existing Next.js app structure and shared UI patterns.
- Do not add dependencies unless the task clearly requires them.
