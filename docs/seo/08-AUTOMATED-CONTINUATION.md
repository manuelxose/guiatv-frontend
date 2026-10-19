# Automated continuation — 2026-10-19

The owner requested autonomous continuation, including release preparation and deployment. This supplements the original audit; its historical statements about access and deployment are retained as audit evidence.

## New production evidence

- SSH access to the documented Contabo host works. Both GuíaTV services were active on release `20261017113851`, commit `31fecac`, before this continuation.
- `journalctl -u guiatv-api` confirms repeated `MongoWaitQueueTimeoutError` failures on `/v2/tv/read/channels` today, including 20:02:34 server time (18:02:34 UTC). That request took 11,227 ms and returned 500. The error means a MongoDB connection could not be checked out from the pool; the workload causing pool exhaustion has not yet been isolated.
- SSR logs contain 52 render timeouts on 2026-10-19 when inspected, plus backend 429s on channel and football requests. These are confirmed failure triggers, but do not prove the cause of every broken URL in the original crawl.
- The configured GSC credential file `/etc/guiatv/gsc-service-account.json` is absent. No traffic-loss estimate can be made from these logs.

## Auctorio operational change

The site-specific `guiatv-editorial` policy was confirmed to be enabled in **autopilot** mode. It is now **assisted**, using Auctorio's canonical mode flags: `autoApprove=false`, `autoPublish=false`. The pre-existing generation/repair/scheduling capabilities remain enabled. A private backup of the previous site policy is stored under `/var/backups/guiatv-seo/` on the server. Other sites and the tenant-wide policy were not changed. This confirms the current configuration, not which process published historical posts.

## Additional fixes

- SSR crashes, empty renders, and missing engine responses no longer become indexable or cacheable 200 fallbacks.
- Legacy catalog redirects distinguish API outages from missing content, use a bounded API timeout, and return 503/no-store/noindex during outages.
- Known machine reviewers are rejected even if mistakenly included in the human allowlist.
- Legacy redirects are crawlable in robots.txt so crawlers can discover their canonical destinations.
- The resilience runner clears its startup timer, bounds requests and waits for child cleanup, escalating termination if needed.

## Fresh validation

- Production frontend build: passed.
- Frontend tests: **254 passed**.
- Backend tests: **341 passed, 1 skipped**.
- Expanded SSR resilience: **11 routes passed**, including four legacy catalog paths, with 503, no-store, Retry-After and noindex assertions; runner exits cleanly.
- GSC comparison self-check and `git diff --check`: passed.
- Playwright full suite: attempted, failed checks and local 429 responses observed; interrupted when WSL stopped responding during concurrent builds. This is **not a passing end-to-end run**. Do not infer that the observed failures were introduced by this patch.

## Remaining owner or external inputs

Legal identity and named human reviewer are not inferred from Git authorship. Do not populate `EDITORIAL_HUMAN_REVIEWERS` with an invented identity. The public legal drafting note can be removed without deciding the entity; identity consistency remains unresolved. A public editorial policy must accurately describe the enforced approval gate and acknowledge the current corpus remediation work.

No new scheduled production job or automatic AdSense submission has been enabled. Content consolidation, sourcing, and factual editorial review remain open.

## First deployment and checks

- PR #7 was merged as `d0882c1`. Deployment workflow `39303756764` succeeded; active release: `20261019203836`.
- GitHub CI `39303756709` and PR verification `39303700363` succeeded. Expanded SSR regression `39303700505` succeeded.
- `/canales` and all 13 formerly broken editorial URLs now return 200 with their own title and one H1. Unknown article, category and programme probes return 404/noindex. The legal page no longer contains the internal AdSense note.
- The home title was correct at the direct SSR origin but initially stale at the public proxy. This was cache propagation, not a confirmed router defect. Release checks must distinguish cached responses from the active origin.

## Owner-provided editorial identities

The owner confirmed TecnoRia (`https://tecnoriasl.com/`) as the business, Max Nova as editor, and Beatriz Olmedo / Arturo Baroja as additional writers and reviewers. `EDITORIAL_HUMAN_REVIEWERS="Max Nova,Beatriz Olmedo,Arturo Baroja"` has been saved in `/etc/guiatv/api.env`, with a private backup of the previous env file. The API must restart to activate it.

The new `/politica-editorial` page names those people and describes sourcing, human review, AI assistance, affiliate disclosure and corrections. It explicitly states that archive remediation is unfinished. The footer and About page link to it; the About page's unsupported generic expert claim is replaced with the owner-provided names. Historical post authorship is not reassigned.

Local policy validation: production build, SSR 200/canonical/name checks, 390px and 1440px browser layouts without overflow, and axe checks of the policy content all passed (zero violations). Exact corporate legal name and tax ID have been requested because the linked TecnoRia site did not expose them through its public legal links. The existing individual fiscal identity is not silently relabelled as a company's tax ID.

## Confirmed identity and second deployment

The owner clarified that TecnoRia is a **trade name**, not a separate corporate entity, and confirmed that `53198877S` is his personal NIF. The existing individual legal name and address remain; the legal notice now distinguishes the TecnoRia trade name from the GPTV service. No corporate tax number is invented or needed for this distinction.

PR #8 merged as `f1b9a9b`; deployment `39305365427` and CI `39305365344` succeeded. Release `20261019204931` contains the public policy and editorial names. Direct inspection of the running API process confirms the three-name allowlist is active, the separate human review key remains configured, and automation approval credentials have been removed from the GuíaTV API. Auctorio remains assisted.

## Additional validation and completeness correction

- A read-only database count found **52 approved public posts**, not 50. The original audit and frontend both used the API's default 50-row limit. `getAllPosts` and the audit now explicitly request `limit=0`, the existing API contract for the complete list. A regression test reproduces the 50/52 boundary.
- The complete audit finds **35 posts with blocking issues**, **12 thin bodies**, 23 non-human posts without external sources, 19 near-duplicate posts, and the same 17 stored Markdown/image problems. The original 50-post snapshots remain as historical evidence, not a complete current inventory.
- Live-API local SSR confirms that loading all posts restores `index, follow` on `/editorial/categoria/max` (previously noindex despite being in the sitemap).
- Google Rich Results Test successfully fetched `/editorial/mejores-series-disney-plus`: one valid Article and two valid breadcrumb items; Article has only an optional missing author URL warning. The duplicate article breadcrumb generator is now removed in favour of the visible navigation's schema; local SSR confirms exactly one BreadcrumbList and an Article.
- Test result: https://search.google.com/test/rich-results/result?id=kx2oo6aQLXNNpz0PtYUODA . Screenshot: `artifacts/seo/rich-results-article.png`.
- Lighthouse 13.5.0, a single mobile lab run at 18:47 UTC: performance **84**, accessibility **96**, best practices **96**, SEO **100**; LCP **3.4 s**, TBT **290 ms**, CLS **0.001**. This is not field CWV or traffic recovery. Five icon requests transiently returned 503 during the run; a later direct and public probe returned 200. Existing contrast and accessible-name findings remain. Summary: `artifacts/seo/lighthouse-home-mobile-summary.json`; full local report in `.runtime/seo-ops/`.
- Frontend regression suite after the completeness fix: **255 passed**; production build and live-API SSR checks passed.

## Full crawl and follow-up

The paced full crawl inspected 453 sitemap URLs and three probes after the first release, overlapping the second deployment. It reported **15 URLs with findings**, including four 5xx responses, two editorial category noindex mismatches, the known `/programas/deportes` 404, three short discovery surfaces, and metadata-length warnings. This is not a clean-crawl claim. The raw snapshot is `artifacts/seo/crawl-post-deploy.json`; failed URLs must be rechecked on the stable final release to distinguish transient responses from persistent defects.

It also exposed an SSR redirect from `/programacion-tv/que-ver-hoy` to the same path with default filter parameters. Filter URL synchronisation is now browser-only; live-API SSR checks confirm the canonical path renders 200 directly. The crawl's metadata reader now decodes Angular's escaped attribute entities before measuring title/description lengths, with a runnable `--self-check`, avoiding false length findings for `&amp;` and `&quot;`.

## Final runtime release and recheck

- PR #9 merged as **`30b41e3`**. Final release: **`20261019210550`**, published at 19:05:51 UTC. Deployment `39307670951` and build/test workflow `39307670824` succeeded. Both services are active.
- The running API again verified the exact three-person allowlist, a configured human review key, and no automation approval key/reviewer. Only cached copies of changed public pages and the 15 flagged URLs were invalidated for validation; unrelated cache trees were untouched.
- The final recheck covered **all 15 flagged URLs plus five changed public pages**: 19 returned 200; `/programas/deportes` remains 404 while listed in the sitemap. The earlier four 5xx responses did not recur. `/programacion-tv/que-ver-hoy` now returns 200 without a default-filter redirect; Prime Video and Max category pages are indexable.
- Remaining crawl findings are one sitemap 404, three short discovery surfaces (`/plataformas`, football today and football live), and the 71-character Netflix-vs-Prime title. Short-word-count warnings are discovery signals, not proof that an interactive page lacks value. No clean full-crawl or permanent-availability claim is made.
- Artifact: `artifacts/seo/crawl-final-recheck.json`. Its wrapper restores sitemap/noindex/thin checks to the probe results; the underlying crawler's printed `with issues: 0` counts sitemap rows only and must not be interpreted as 20 clean pages.
- Google retested the final deployed article at 19:07 UTC: **two valid items, one Article and one BreadcrumbList**. The optional author URL warning remains. Result: https://search.google.com/test/rich-results/result?id=T9NNpTlLKi7FsAv1NQjohw ; screenshot: `artifacts/seo/rich-results-final.png`.

## Search Console analysis completed

The owner identified the authorized business Google account; the correct domain property is now accessible. Daily performance over 487 days, complete visible page/query/device tables, an equal-length comparison around the observed break, indexing reason counts and 404/crawled-not-indexed inventories were saved privately in ignored `.runtime/gsc/`. The official CSV download did not complete, so provenance is explicitly **rendered UI table extraction**, with normalized CSV copies and validation of daily totals against the UI.

The visibility decline is now dated and quantified; the private report distinguishes impressions from clicks and page aggregation from property aggregation. It does not infer lost visits or recovery. The homepage concentration changes the investigation priority; sitemap contraction alone is not an adequate explanation. Exact metrics and query data remain outside this public repository in `.runtime/gsc/TRAFFIC-RECOVERY.md`.

Manual actions and security reports both show no issues. Current submitted sitemaps are processed successfully; one obsolete API sitemap retains a historical fetch failure. Both mobile and desktop CWV reports have insufficient usage data over the last 90 days (updated October 17). No account permissions, sitemap submissions, validation batches or reindexing requests were changed.

The final targeted 21-route production probe returned 18 successful pages and three expected unknown-URL 404s, with no unexpected failures. Artifact: `artifacts/seo/post-deploy-targeted.json`.

## Remaining work

1. Monitor comparable Search Console windows using the private baseline; investigate homepage visibility without attributing the decline to a deployment solely from timing. Do not infer recovery from a release or a Lighthouse score.
2. Human editorial review of 35 flagged posts: factual sources, 12 short bodies, duplicate consolidation, image provenance and visible AI-assistance disclosure where relevant. Historical authorship has not been reassigned to the newly named editors.
3. Resolve the pre-existing `/programas/deportes` sitemap/resolver mismatch; assess the three short discovery surfaces and remaining metadata warning.
4. Investigate the workload behind MongoDB connection-pool exhaustion and SSR deadlines if it recurs. No arbitrary pool-size/rate-limit increase was applied, and production protections were retained.
5. Complete the full end-to-end suite; field CWV cannot yet be assessed because Google reports insufficient data. No new recurring job, automatic editorial approval, reindexing batch or AdSense re-review was enabled.
