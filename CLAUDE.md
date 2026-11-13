# Litesheet: rules for Claude Code

Read `docs/PRD.md` first. It is the spec.

## Order of work

Phase A (repo setup) → Phase B (design canvas, approved by Finn) → M0 to M7 (PRD §11).

- No feature code (parsers, storage, Excel export) before Phase B is approved.
- Don't start a phase or milestone until the previous one meets its acceptance criteria.
- One branch + pull request per phase/milestone, merged only when CI is green.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Ask Finn before anything public or irreversible (repo settings, Pages, releases).

## Commands

- `pnpm test`: unit tests (Vitest)
- `pnpm test:e2e`: Playwright
- `pnpm check`: svelte-check + tsc
- `pnpm lint`: ESLint + Prettier check (`pnpm format` to fix)
- `pnpm build`: production build

## Rules

- Test-first for parsers and unit math. They are pure functions with exact expected outputs.
- Real export files in `fixtures/` win over the PRD. Record differences in `docs/FORMATS.md`.
- Client-side only: no backend, no accounts, no analytics, no network calls after load.
- Never bundle Mojang textures or the Minecraft logo.
- Every generated `.xlsx` must open without repair prompts in Excel, LibreOffice Calc and Google
  Sheets. Spreadsheet formulas avoid `LET`, `LAMBDA` and dynamic arrays.
- Update the design canvas (`/design`) whenever UI changes.
- GitHub repo is `izuulo/litesheet`; the site is served under `/litesheet/` (Vite `base`).
