# Implementation Plan: M9 quality closure

## Overview

Revalidate the completed rebuild against the M9 quality gates without changing production state. Existing production evidence is reused where still valid; current-code checks cover regressions introduced through M8.

## Architecture decisions

- Run resource-heavy checks serially because the shared host has documented contention.
- Treat browser and audit output as evidence, not as permission to deploy or update visual baselines.
- Fix only reproducible current-code regressions; preserve the existing warning backlog as visible debt.

## Task list

1. Run repository lint, backend tests and both production builds.
2. Audit current dependencies and security-sensitive configuration; apply non-breaking patched runtime versions where required.
3. Run the serialized Playwright suite and inspect any failures before changing code.
4. Record current M9 evidence and residual risks in the rebuild ledger. (complete)

## Risks and mitigations

- Shared backend latency can create false E2E failures: use the repository's bounded-worker configuration and distinguish infrastructure timing from product defects.
- The worktree contains unrelated changes: scope edits to M9 evidence or directly reproduced regressions.
- Dependency audit findings may require upgrades outside M9 scope: report them before any breaking package mutation.

## Open questions

- None; the milestone gate and acceptance criteria are defined in the rebuild ledger.

## M10 release closure

1. Recheck legacy/dead-code candidates against current consumers. (complete)
2. Harden and execute a non-destructive release preflight. (complete)
3. Verify active production state read-only and document rollback. (complete)
4. Publish/restart/smoke the new release only after explicit deployment approval. (complete: `20260827124645`)
