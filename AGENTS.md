# GuíaTV agent instructions

Project: Guía Programación TV. Framework: Angular SSR. Backend: Node/TypeScript. Package manager: npm workspaces.

Commands: `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run agent:verify`.

Preserve product behavior and existing user changes. Never read, print, or commit secrets. Use semantic design tokens in `apps/frontend/src/styles/design-tokens.scss`; keep theme behavior in `ThemeService`.

Use Graphify before architectural, cross-domain, navigation, shared-component, data-flow, or performance changes. Do not use it for a known isolated edit, formatting, or a known test. Query only the relevant subgraph.

For UI work, use Impeccable as the primary refinement skill and Vercel Web Interface Guidelines for UX/accessibility review. Use UI UX Pro Max only when exploring visual directions, palettes, typography, or comparative research. Use Playwright plus axe for browser validation and Lighthouse for performance baselines.

Default to one agent. Delegate only bounded, independent implementation, visual-review, verification, or performance work. No persistent swarms.

Definition of done: scoped diff, no secrets, relevant checks run, and failures classified as introduced, pre-existing, environmental, or blocked.

Workspace skills: also discover the canonical on-demand catalog at `/var/www/.agents/skills/manifest.json`; use Vercel skills for web audits, Impeccable for visual quality, and Graphify for structural context.
