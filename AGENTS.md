# GuíaTV agent instructions

Project: Guía Programación TV. Framework: Angular SSR. Backend: Node/TypeScript. Package manager: npm workspaces.

Commands: `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run agent:verify`.

Preserve product behavior and existing user changes. Never read, print, or commit secrets. Use semantic design tokens in `apps/frontend/src/styles/design-tokens.scss`; keep theme behavior in `ThemeService`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

Use Graphify before architectural, cross-domain, navigation, shared-component, data-flow, or performance changes. Do not use it for a known isolated edit, formatting, or a known test. Query only the relevant subgraph.

For UI work, use Impeccable as the primary refinement skill and Vercel Web Interface Guidelines for UX/accessibility review. Use UI UX Pro Max only when exploring visual directions, palettes, typography, or comparative research. Use Playwright plus axe for browser validation and Lighthouse for performance baselines.

Default to one agent. Delegate only bounded, independent implementation, visual-review, verification, or performance work. No persistent swarms.

Definition of done: scoped diff, no secrets, relevant checks run, and failures classified as introduced, pre-existing, environmental, or blocked.

Workspace skills: also discover the canonical on-demand catalog at `/var/www/.agents/skills/manifest.json`; use Vercel skills for web audits, Impeccable for visual quality, and Graphify for structural context.

<!-- BEGIN AGENTIC-ENGINEERING-PLATFORM -->
# Managed engineering policy

Use repository evidence before assumptions. For non-local codebase, architecture, dependency, or data-flow questions, query Graphify first when `graphify-out/graph.json` exists; use scoped query/path/explain output to find the smallest relevant source set. Never bulk-read generated graph artifacts.

For non-trivial changes: understand → graph discovery → plan → implement narrowly → test → independent review when practical → verify. Preserve unrelated work. Claude Code may delegate to globally installed native agents; Codex must use its own supported decomposition and review workflow, not Claude agent files.

Never hardcode secrets or claim unexecuted checks. Refresh Graphify after material structural changes. UI work must assess responsive, keyboard/focus, accessibility, and all interaction states.
<!-- END AGENTIC-ENGINEERING-PLATFORM -->
