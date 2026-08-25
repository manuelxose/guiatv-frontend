# GuíaTV agent policy

GuíaTV is an Angular SSR frontend and Node/TypeScript backend monorepo using npm workspaces.

## Essential commands

- `npm run build` — production backend and frontend SSR build
- `npm run lint` — backend and frontend linting
- `npm test` — backend and frontend tests
- `npm run test:e2e` — Playwright browser tests
- `npm run agent:verify` — environment and repository checks

## Working rules

- Inspect before editing and preserve unrelated working-tree changes.
- Keep application behavior unchanged during tooling migrations.
- Never expose or commit secrets, `.env` files, credentials, or machine-local paths.
- Use Graphify for cross-cutting or architectural changes; use direct inspection for isolated edits.
- Load interface-design skills only for interface work. Use UI UX Pro Max only for design exploration.
- Validate UI changes with Playwright screenshots, axe checks, console/network errors, and responsive viewports.
- Keep changes scoped, accessible, responsive, and consistent with the existing design tokens.

## Definition of done

Run the relevant lint, typecheck, tests, build, and browser checks. Record pre-existing or environmental failures explicitly. Do not use persistent swarms or consensus orchestration for ordinary tasks.
