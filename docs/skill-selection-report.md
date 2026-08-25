# Skill selection report

Reviewed source: `https://github.com/addyosmani/agent-skills`, commit `5a5ea45e806f82273549fd85e60adb95d55f510d` (MIT). The repository contains Markdown skills and plugin metadata; no package scripts were required for the selected directories. Its hooks and executable scripts were inspected and deliberately excluded from the project installation.

Installed on demand in `.agents/skills/`: API/interface design, browser testing, CI/CD, code review, simplification, context engineering, debugging, migration, documentation/ADRs, doubt-driven development, frontend UI engineering, Git workflow, idea refinement, incremental implementation, interview, observability, performance, planning, security, shipping, source-driven development, spec-driven development, and TDD.

Preserved existing UI UX Pro Max, browser-validation, and Impeccable references without duplicating their bodies. Vercel guidelines remain an audit reference. No React-specific skill was installed because the app is Angular.

Rejected full plugin/hook installation because it would add unnecessary executable hooks and permanently injected context. No external observability, deployment, database, or GitHub MCP was installed because local tooling is sufficient and credentials were not authorized.
