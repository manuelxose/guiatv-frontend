# Production engineering system

## Stack and boundaries

GuíaTV is an npm workspace with an Angular SSR frontend in `apps/frontend` and a Node/TypeScript backend in `apps/backend`. Domain areas include schedules/channels, football, editorial, search, authentication, chat, AI, integrations, caching, SEO, and analytics. Deployment is driven by `deploy-guiatv.sh`; production checks must not assume credentials or external services.

## Routing

One primary agent owns each task. Activate only the role and skill required by the change. Use `AGENTS.md` for the short policy, `.agents/roles/` for inactive role briefs, and `.agents/workflows/` for lifecycle routing. Skills live in `.agents/skills/` and load on demand.

Use Graphify before changes spanning routes, shared components, domains, providers, data flow, performance, or architecture. Query only the relevant subgraph. Run `graphify update .` after material structural changes.

## Quality gates

Mandatory for applicable changes: `npm run lint`, `npm test`, `npm run build`. Browser changes additionally use `npm run test:e2e`, screenshots, console/network checks, and `@axe-core/playwright`. Lighthouse is a baseline tool only while no stable threshold has been measured. Run `npm audit` and secret detection for dependency/security work. Existing failures must be classified rather than hidden.

Current repository gap: there is no committed typecheck script, dedicated Lighthouse command, secret-scanning command, or CI workflow covering all gates. The existing `.github/workflows/performance.yml` and `package.json` scripts are the source of truth; add gates only after measuring the baseline.

## Security and operations

Use vendor-neutral structured logs, correlation IDs, health/readiness checks, redaction, and runbooks. Do not add observability vendors, production MCPs, credentials, or external data transmission without explicit authorization. External integrations require typed contracts, timeout/retry/fallback behavior, and secret-safe configuration.

## Token efficiency

Only short trigger metadata is automatically visible. Bodies are loaded on demand. Specialists receive the smallest relevant file set and Graphify result. Detailed logs are artifacts, not prompt context. No permanent swarm, recursive delegation, duplicate investigation, or consensus voting.
