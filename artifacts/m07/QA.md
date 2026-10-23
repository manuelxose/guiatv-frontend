# M07 QA evidence

- Full deterministic M05 + M07 Playwright run: **14 passed**, desktop Chromium and Pixel 5 emulation; command `npx playwright test -c playwright.entity.config.ts e2e/entity/m05-detail.spec.ts e2e/entity/m07-tv.spec.ts`.
- M07: channel and programme each tested at 375, 768, 1280, 1440 px, light/dark, both projects: **32 axe scans and screenshots**, zero WCAG A/AA violations, zero page errors, no horizontal overflow. Browser timezone America/New_York verifies displayed channel times remain Europe/Madrid.
- Journeys verify chronological finished/live/upcoming rows, keyboard category activation and pressed state, verified programme navigation, unresolved destination fallback, SSR content, canonical URLs, programme schema identity, programme broadcasts separated from channel suggestions, empty channel versus missing 404/noindex channel.
- Existing M05 regression coverage passed, including its 16 viewport/theme axe scans. Existing `node --test scripts/entity-read-ssr.test.mjs` passed.
- Backend build and **42 focused tests** across `TvSurfaceService`, `TvReadQueryService`, `CatalogService.detail-path`, `SitemapController` passed with zero failures/skips.
- Independent review found stale cached `timingContext.liveNow` after channel/mobile normalization; both callers now refresh both flags. Backend channel-surface cache also retained expired current programmes: fixed with existing runtime hydrator, preserves verified destination, adds no queries and does not mutate cache; regression test passes.
- Axe found white/live-strong contrast 4.47 and live-card pill contrast 2.59; shared token/card text fixes verified by the passing full matrix.
- Visual inspection: channel 375 light and 1440 dark; programme 375 dark and 1440 light. Light-channel breadcrumb inherited white hero text; scoped portal-colour correction visually verified at 375 light. Rebuilt matrix rerun also covers a live related channel card.
- M07 theme harness sets storage before navigation and asserts the resolved theme, avoiding accumulated init scripts with undefined ordering; reduced-motion preference avoids sampling intermediate transition colours.

Screenshots: `test-results/m07-tv-M07-channel-and-programme-responsive-WCAG-AA-matrix-{desktop,mobile}/`. They are generated outputs, not committed source artifacts.

Limits: deterministic fixture coverage does not replace the integrator's real-API candidate/production captures or deployment checks. Full backend suite has a pre-existing Windows POSIX private-key permission assertion failure; green Linux CI remains required. No database writes, commits or deployment performed by this QA agent.
