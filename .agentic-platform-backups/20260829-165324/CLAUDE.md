# GuíaTV agent policy

GuíaTV is an Angular SSR frontend and Node/TypeScript backend monorepo using npm workspaces.

## Essential commands

- `npm run build` — production backend and frontend SSR build
- `npm run lint` — backend and frontend linting
- `npm test` — backend and frontend tests
- `npm run test:e2e` — Playwright browser tests
- `npm run agent:verify` — environment and repository checks

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships. A project-level skill is installed at `.claude/skills/graphify/SKILL.md`; use it for any codebase question.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Working rules

- Inspect before editing and preserve unrelated working-tree changes.
- Keep application behavior unchanged during tooling migrations.
- Never expose or commit secrets, `.env` files, credentials, or machine-local paths.
- Use Graphify (see above) for cross-cutting or architectural changes; use direct inspection for isolated edits.
- Load interface-design skills only for interface work. Use UI UX Pro Max only for design exploration.
- Validate UI changes with Playwright screenshots, axe checks, console/network errors, and responsive viewports.
- Keep changes scoped, accessible, responsive, and consistent with the existing design tokens.

## Definition of done

Run the relevant lint, typecheck, tests, build, and browser checks. Record pre-existing or environmental failures explicitly. Do not use persistent swarms or consensus orchestration for ordinary tasks.

<!-- BEGIN AGENTIC-ENGINEERING-PLATFORM -->
# Managed engineering policy

Use repository evidence before assumptions. For codebase, architecture, dependency, or data-flow questions, query Graphify first when `graphify-out/graph.json` exists; use its scoped query/path/explain output to identify the smallest relevant file set. Do not bulk-read generated graph artifacts.

For non-trivial changes: understand → graph discovery → plan → implement narrowly → test → independent review when practical → verify. Preserve repository architecture and unrelated working-tree changes. Select skills and a focused specialist only when they materially help; do not create persistent swarms.

Never hardcode secrets, providers, credentials, or machine-local assumptions. Never claim a check passed unless it was executed. Keep context lean without skipping security, migrations, dependency inspection, or validation. Refresh Graphify after material structural changes.

For UI work, use the existing design system and assess responsive layouts, keyboard/focus behavior, accessibility, loading/empty/error/success states, and light/dark themes where supported. Do not present placeholders or fake metrics as working product behavior.
<!-- END AGENTIC-ENGINEERING-PLATFORM -->
