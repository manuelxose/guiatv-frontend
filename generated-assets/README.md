# Generated Assets

Central repository for AI-generated images before they are copied into the final assets of each project.

Location:
- This folder lives at the workspace root, alongside `apps/`.
- It is the canonical source of truth for generated imagery.
- Projects may expose symlinks that point back here for convenience.

Rules:
- Save new generations under `generated-assets/<project>/`.
- Use a project folder name that matches the workspace project, for example `frontend` or `backend`.
- Default image model for agent-driven generation is `black-forest-labs/FLUX.2-pro`.
- When an image becomes part of the shipped product, also copy it to that project's real asset path, such as `apps/frontend/src/assets/...`.
- Keep this folder as the source-of-truth history for prompts, variants, and regeneration workflows.
