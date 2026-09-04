# Engineering workflows

Each workflow has one primary owner. Activate only the relevant skill and specialist; maximum three specialists, no recursive delegation or consensus voting.

| Workflow | Primary | Required evidence |
| --- | --- | --- |
| Feature development | owning engineer | spec, tests, build, review |
| Bug fixing | owning engineer | reproduction, root cause, regression test |
| Security change | security engineer | threat model, hardening, security checks |
| Performance optimization | performance engineer | before/after measurements |
| Dependency upgrade | devops engineer | source/license, audit, tests, rollback |
| Provider integration | integration engineer | contract, timeout/retry/fallback tests |
| Schema migration | data engineer | migration plan, backup/rollback, validation |
| UI redesign | ui-design engineer | Impeccable review, screenshots, axe, Playwright |
| Incident response | SRE engineer | timeline, mitigation, follow-up actions |
| Release preparation | release manager | gates, changelog, smoke and rollback evidence |
| Post-release verification | SRE engineer | health, smoke, logs, deployment evidence |
| Deprecation/removal | software architect | consumers, migration window, rollback |

Every workflow: inspect first; state constraints; use Graphify for cross-cutting work; preserve behavior; run relevant tests; classify failures; document residual risk.
