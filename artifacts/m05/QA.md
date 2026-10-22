# M05 independent QA evidence

Baseline: public production `20261022182542`, captured 2026-10-22. `before/report.json` contains payloads, SEO surface, API/SSR timings, image state, browser errors and axe findings. `before/*.png`: seven routes at 375, 768, 1280 and 1440 px. Captures wait for the rendered detail, rather than a loading skeleton.

Representative routes cover complete movie, available broadcast inventory, complete series, programme-sourced series, episode-titled series, `/series/camino-a-la-perdicion`, and a guaranteed missing movie. The live catalogue is mutable; inventory may differ from the historical M03 sample.

Baseline results:

- Six valid HTTP 200 pages; missing movie HTTP 404, noindex.
- Zero horizontal overflow across all 28 combinations; zero page errors.
- Single canonical, existing robots decisions and JSON-LD captured for comparison.
- Serious pre-existing axe defects: subscription eyebrow contrast (four pages) and related-content scrolling region missing keyboard focus (three pages).
- Mobile hero measured 400.5–712.5 px; Bala perdida 680.5 px.
- Three request samples per API/detail route; medians approximately API 74–133 ms, SSR 76–115 ms. These are indicative internet/cache observations, not controlled benchmarks or field Core Web Vitals.

Deterministic regression coverage:

- `e2e/entity/m05-detail.spec.ts`: actual work airings separated from channel suggestions, two simultaneous live airings retained, unknown episode destination falls back to channel, SSR visible content, canonical/JSON-LD safety, whole-series runtime omitted, incomplete metadata and empty schedules, CTA scroll behavior, all four requested widths in light/dark with WCAG AA axe.
- `apps/frontend/scripts/legacy-enrichment-ssr.test.mjs`: existing SEO parity/hostile JSON-LD tests updated for the shared schedule, plus known-ID route rendering/noindex/redirect regression.
- Existing entity/legacy Playwright suite remains part of the release gate.

Initial candidate review found and reported two new release blockers: live badge contrast and hero CTA navigating to `/` under the document base URL. Frontend owner is correcting both; full final rebuilt run required.

Run the capture after release with `M05_LABEL=after node artifacts/m05/capture.mjs`, or against a local candidate with `M05_ORIGIN=http://127.0.0.1:PORT M05_LABEL=candidate node artifacts/m05/capture.mjs`.

Do not interpret implementation or this baseline as M05 completion. Final browser/SSR checks, green CI, reviewed integration, release and post-release verification remain required.
