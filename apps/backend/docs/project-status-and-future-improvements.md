# Backend Status and Future Improvements

## Current status

The backend is now in a materially better state for frontend consumption than the pre-recovery baseline.

### Strengths

- Canonical TV read model exists and is the main source for guide and channel pages.
- Discovery and content detail now have clearer surface endpoints.
- The route surface is smaller and more coherent than the previous mixed legacy/canonical state.
- Documentation now reflects the active contract instead of multiple historical layers.

### Weak areas that still deserve attention

- Legacy controller and use-case files still exist internally even though their public route families were removed.
- Some frontend adapters still derive layout-like data from canonical reads instead of using only surface endpoints.
- Runtime validation against production-like Mongo data still depends on environment access and cannot be replaced by build-only checks.
- The catalog and AI/chat layers remain integration-heavy and should keep gaining contract tests.

## What was fixed in this recovery pass

- TV guide payload truncation caused by an incorrect global limit in the canonical TV read path
- stale secondary consumers still calling removed route families
- dead route wiring for unmounted TV endpoints
- outdated backend documentation and Swagger surface
- backend/frontend contract mismatch around the active guide and discovery surfaces

## Remaining technical debt

- stronger contract testing around `TvReadDTO`, guide surfaces, and unified detail
- broader integration coverage for discovery and chatbot retrieval
- more explicit observability for cache hit rate and payload size on surface endpoints
- additional cleanup of legacy controllers if they remain unreferenced over time

## Recommended next improvements

### Short term

- add endpoint-level contract tests for:
  - `/tv/surface/guide`
  - `/tv/surface/channels/:channelId`
  - `/discovery/home`
  - `/content/:id`
- add smoke tests for admin views that depend on canonical TV reads
- add explicit metrics for TV read payload sizes and cache hit ratios

### Medium term

- replace remaining layout-compatibility adapters in the frontend with direct surface usage
- add schema-based response validation in critical controllers
- add a deprecation checklist for future route removals
- isolate streaming catalog read models more explicitly from live TMDB lookups

### Long term

- add consumer-driven contract tests between frontend and backend
- formalize API lifecycle policy:
  - active
  - deprecated
  - removed
- expand observability for ingestion source quality and trust/suppression decisions

## Risk outlook

Current risk is moderate, not high:

- the main regression source is fixed
- active route documentation is aligned
- dead route drift was reduced

Residual risk remains in areas where:

- integration-heavy providers are involved
- runtime data quality varies by source
- frontend compatibility still depends on transitional adapters rather than final BFF-only consumption
