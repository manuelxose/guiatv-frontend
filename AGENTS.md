# AGENTS.md - GuiaTV AI Agents

Role-based agent configuration for the GuiaTV project.

## Available Agent Roles

| Role | Mission | Primary Tools |
|------|---------|---------------|
| **Architect** | EPG Pipeline & Architecture | analysis, planning |
| **Developer** | Full-stack implementation | write_to_file, etc. |
| **Tester** | EPG Validation & QA | job:syncEPG, npm test |
| **UX/UI** | TV Guide Visual Distinction | generate_image, CSS |

## Optimization Policy
- **Data Awareness**: Prioritize understanding the EPG data model before making backend changes.
- **SSR Efficiency**: Consider performance implications for Angular SSR when modifying the frontend.
- **Batch Processing**: Use single turns for multiple related operations to save tokens.

## Design system & theme (mandatory)
- Semantic tokens in `apps/frontend/src/styles/design-tokens.scss` (`--portal-*`, `--accent-*`, `--guide-*`); dark palette under `html[data-theme='dark']`.
- Theme owned by `ThemeService` (`apps/frontend/src/app/services/theme.service.ts`): `light`/`dark`/`system`, SSR-safe, no-flash bootstrap in `index.html`.
- NEVER hardcode semantic surfaces (`slate-*`, `gray-*`, `text-white`, `bg-white`, `bg-black`, `#081018`). Use `bg-[var(--portal-*)]`/`text-[var(--portal-*)]`. Exceptions: `text-white` on red accent buttons; `bg-black/<opacity>` backdrops.

## Build, test, deploy
```bash
# Frontend unit tests (Chrome binary is at the Playwright cache, not on PATH)
cd apps/frontend && CHROME_BIN=/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox

# Production build (backend + frontend SSR)
npm run build

# Lint
npm run lint

# Deploy (must run as root; script aborts unless EUID==0)
bash ./deploy-guiatv.sh
```
Post-deploy: `readlink -f current`, `systemctl is-active guiatv-api guiatv-ssr`, `NRestarts` must be `0`/`0`, then smoke `/v2/health`, SSR `/`, `/programacion-tv/guia-canales`, `/deportes`.
