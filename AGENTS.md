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
