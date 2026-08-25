# Agent engineering system

GuíaTV uses one primary agent by default. Codex, Claude Code, and Cursor share the concise policies in `AGENTS.md` and `CLAUDE.md`; skills are selected on demand and are not injected as a permanent swarm prompt.

| Task | Skill or tool |
| --- | --- |
| Implement or polish UI | Impeccable |
| Explore visual direction | UI UX Pro Max + Impeccable |
| UX/accessibility audit | Vercel Web Interface Guidelines |
| Cross-cutting repository change | Graphify first |
| Responsive regression | Playwright + screenshots |
| Accessibility regression | Playwright + axe |
| Performance validation | Lighthouse + repository profiling |

Graphify is selective: query it for architectural, navigation, shared-component, data-flow, and blast-radius work; do not query it for isolated edits or known tests. Keep delegated work bounded to implementation, visual review, verification, or performance, and never configure a persistent swarm.

Run `npm run agent:setup` to synchronize the local skill manifest and `npm run agent:verify` to check RuFlo absence, tooling, dependencies, and lint health. The setup is idempotent and does not install global packages or read secrets.

## Short prompts

- UI page: “Use Impeccable. Inspect the target route, implement the scoped page, then validate responsive behavior with Playwright and axe.”
- Navigation: “Query Graphify for route ownership and shared navigation dependencies, then make the smallest cross-cutting change and run the relevant checks.”
- Mobile regression: “Use browser validation at mobile widths, capture evidence, fix only the identified regression, and rerun axe.”
- Visual audit: “Use UI UX Pro Max for alternatives, then use Impeccable to audit the existing page without changing product scope.”
- Performance: “Measure the current route first, identify the bottleneck, change only the relevant layer, and compare before/after evidence.”
