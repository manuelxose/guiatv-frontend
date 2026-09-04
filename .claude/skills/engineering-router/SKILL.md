---
name: engineering-router
description: Classifies software-engineering requests by work type, scope, risk, user impact, and operational impact, then selects the minimum skills, owner, reviewers, tools, tests, and evidence. Use automatically for any repository or software task.
---

# Engineering Router

This is a routing index, not a handbook. Inspect the active repository's local instructions, stack, package manager, tests, CI, and Graphify state before selecting work.

## Route

1. Classify work: discovery, requirements, planning, architecture, frontend, UI/UX, backend, API, database, migration, integration, auth, security/privacy, testing, debugging, performance, refactoring, dependency, DevOps/CI, observability, incident, documentation, release, review, or maintenance.
2. Classify scope: file, component, package, multi-package, cross-cutting, repository, monorepo, or multi-repository.
3. Classify risk: low, medium, high, or critical; record user-facing and operational impact.
4. Choose one primary owner from the active repository's `.agents/roles/` or the configured shared skills/roles catalog. Add no more than three specialists unless risk and blast radius justify more.
5. Use Graphify first for every repository question or engineering change to retrieve a bounded subgraph. Skip only for a confirmed trivial isolated edit, formatting, or a known command. Never read a full graph report when a query/path/explain result is sufficient.
6. Select proportional checks: static checks, tests, build, browser/axe, performance, security, dependency, deployment, or smoke checks.
7. Return concise evidence, residual risk, and any unresolved authority or destructive-action decision.

## Escalation

Any user-facing change triggers a proportional UI review: inspect current tokens/components, use Impeccable for visual refinement, Vercel guidelines for objective audit, and browser/axe checks. Use UI UX Pro Max only for exploration.

High-risk, security, data, production, or irreversible work requires evidence, rollback/migration notes, and specialist review. Never invent stack conventions, credentials, APIs, or deployment permissions.

## Lightweight defaults

- Small isolated fix: one owner, direct inspection, relevant test.
- Cross-cutting change: Graphify first, architect or owning engineer, targeted regression suite.
- UI change: frontend or UI owner, browser/axe review, screenshots when visual behavior changes.
- Incident: SRE/incident owner, evidence before edits, safe mitigation, regression protection.
- Dependency: source/release-note review, audit, compatibility tests, rollback plan.

## Token policy

Prefer `graphify query "..." --budget N`, `graphify path`, and `graphify explain` over broad source scans. Run `graphify update <repo> --no-cluster` after structural changes; cluster only when community labels or architecture views are needed. Use the smallest relevant skill body and pass only the returned subgraph to specialists.
