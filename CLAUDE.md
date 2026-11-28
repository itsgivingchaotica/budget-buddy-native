# CLAUDE.md — Budget Buddy (client)

The Expo / React Native app for Budget Buddy. **Everything shared lives in the server repo** (`bb-server`, `itsgivingchaotica/budget-buddy-server`):

- **Workflow skill:** `bb-server/.claude/skills/project-build-workflow/SKILL.md`. You are the **Builder**; every task follows its Phase 3 loop (issue → branch → report with the understanding check → owner's OK → PR that closes the issue).
- **Ground rules and project rules:** `bb-server/CLAUDE.md` and `bb-server/docs/IMPLEMENTATION_PLAN.md`. They apply here too (no commits, pushes, issues or PRs without the owner's OK; no secrets; no financial text in logs; specs win, tell the owner about disagreements).
- **Docs, specs, screens, handoffs, glossary:** `bb-server/docs/` (`docs/product/SCREENS_*.md`, `docs/product/screens/*.png`, `docs/GLOSSARY.md`).

## Client specifics

- **The Builder keeps the issue checklists current** (same rule as the server). Tick each box on the task issue as soon as it's verified, with a one-line proof comment (test, CI run, commit). Never tick the owner-only items (understanding check, phone test, screenshots) until the owner has done them. Before asking the owner to merge, every box is ticked or explained.
- **End every report that needs the owner with an "Owner action needed" block:** what to do, where, what to reply, and which boxes it unlocks. The owner shouldn't have to go looking.
- **npm only** (`npm install`, `npm ci`): the Kinde SDK relies on npm `overrides` to share the app's Expo modules.
- **TypeScript baseline:** `npm run tsc:check` must stay at or below the recorded count (48), in total and per file.
- **Tests:** `npm run test:ci`. Keep test files out of `app/` (Expo Router turns them into routes); use `__tests__/` or `utils/__tests__/`.
- **Screens do no maths:** every figure comes from the API; display rounding only through `utils/money.ts` (rounds against the user). All API calls go through `utils/api.ts`, never axios directly. New screens use `constants/Theme.ts`; buttons use `PressableBox` (never a style function).
- **Phone checks:** every PR that changes what's on screen gets a phone test and screenshots (2–4 states, optional recording) using demo data, reached with the server's `bin/rails "demo:…[STATE]" USER_EMAIL=…` tasks; the PR template's screenshots section is filled in.
- **Physical iPhone:** local development build (SDK 54), built from Xcode (`ios/bbclient.xcworkspace`); `pod install` / `prebuild` with `RBENV_VERSION=3.4.13`; then `npx expo start -c` and open the app. Details in `bb-server/docs/PROGRESS.md`.

## Commands

```bash
npm install
npx expo start -c
npm run tsc:check
npm run test:ci
```
