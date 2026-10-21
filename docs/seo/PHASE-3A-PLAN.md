# Phase 3A public entity reads

Spec: [Phase 3 entry contract](PHASE-3-ENTRY-CONTRACT.md), plus the owner's Phase 3A request (2026-10-21).

Architecture: reuse `ContentIdentityService.resolvePath` and the canonical slug registry. A separately flagged GET returns an allowlisted DTO for manually verified active entities. Existing detail routes use the new view only when reads are enabled; disabled reads retain legacy behavior. No entity discovery, indexing, write flags, schema migration or new dependency.

- [x] Test and strengthen canonical ownership resolution; use bounded indexed lookups without writes.
- [x] Test and implement `GET /v2/entities/resolve?path=...`, DTO, independent default-off flag, explicit HTTP errors and no-store/noindex headers.
- [x] Test and implement responsive Angular detail, disabled legacy fallback, SSR status/canonical/robots safety, and sitemap exclusion.
- [x] Run scratch Mongo lifecycle/HTTP/no-write tests, full backend and frontend checks, build and SSR checks.
- [x] Inspect the replay's effective operations; execute only within read-only authorization. Record any discrepancy or denied access without bypassing it.
- [ ] Review changes, create focused PR, await required CI, merge and verify approved deployment with public reads still off.

Checks: backend `npm run lint:backend`, `TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm run test:backend`; frontend `npm run lint:frontend`, `npm run test:frontend`; `npm run build`; SSR node tests and runtime entity smoke; `npm run test:deploy`. Existing scratch fixtures use `createEntity` then `verifyEntity`, never direct active insertion. Capture outcomes in `PHASE-3A-VALIDATION-2026-10-21.md`.
