# Repository Guidelines

## Project Structure & Module Organization
- `client-side/`: Legacy React + JavaScript app (Vite).
- `client-side-ts/`: Active React + TypeScript app (Vite, Tailwind, Radix UI). New frontend work should prefer this module unless a task is explicitly legacy-only.
- `server-side/`: Express + TypeScript API (`src/controllers`, `src/routes`, `src/models`, `src/middlewares`, `src/assets`).
- `docs/` and `server-side/docs/`: flow and API notes.
- `.github/workflows/`: CI pipelines for client/server build checks.

## Build, Test, and Development Commands
Run commands inside each package directory:

```bash
# Frontend (TS)
cd client-side-ts
npm run dev          # Vite dev server
npm run build        # TypeScript + production build
npm run lint         # ESLint
npm run format       # Prettier write

# Frontend (legacy JS)
cd client-side
npm run dev | npm run build | npm run lint

# Backend
cd server-side
npm run dev          # Nodemon
npm run build        # Compile TS + copy assets
npm start            # Run dist/index.js
```

## Coding Style & Naming Conventions
- Formatting is centralized in root `.prettierrc`: 2 spaces, semicolons, double quotes, trailing commas (`es5`), max width 80.
- Use `npm run format` (`client-side-ts`) or Prettier from repo root before opening PRs.
- TS/React naming: components in `PascalCase` (`EventCard.tsx`), utilities/services in `camelCase` (`eventService.ts`), route/controller files use domain-based names (`eventsV2.route.ts`, `eventV2.controller.ts`).

## Testing Guidelines
- There is currently no committed automated test suite; CI primarily validates install/build.
- Minimum pre-PR checks: `npm run lint` and `npm run build` in the module(s) you changed.
- For backend changes, also run `npm run dev` once and verify touched endpoints manually.

## Commit & Pull Request Guidelines
- Follow Conventional Commits used in history: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Branch from `staging` using prefixes like `feat/...`, `fix/...`, `refactor/...`.
- Open PRs to `staging` (not `master`), include:
  - clear summary and scope,
  - linked issue/task,
  - screenshots/video for UI changes,
  - notes on env/config changes.

## Security & Configuration Tips
- Never commit `.env` or secrets.
- Request environment values from maintainers; keep sensitive student/payment data out of logs.
