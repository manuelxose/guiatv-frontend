# Workspace Agent Notes

- SiliconFlow image generation is available by default in VS Code agent mode through the MCP server `siliconflow-images`.
- Use the `generate_image` tool when a request needs an actual image asset, not just a written description of one.
- The canonical repository for AI images is the workspace-root folder `generated-assets/`, which sits alongside `apps/` rather than inside any single project.
- Save each generation under `generated-assets/<project>/` first.
- Project roots may expose a symlink named `generated-assets` that points to their subfolder inside the canonical root folder. Treat the root `generated-assets/` folder as the source of truth.
- Pass `project` explicitly whenever possible, for example `frontend` or `backend`. If omitted, the tool may infer it from `assetOutputPath`.
- Use `black-forest-labs/FLUX.2-pro` by default unless the task explicitly needs another image model.
- Use one of these supported sizes unless the task explicitly needs another supported aspect ratio: `1024x576`, `1024x768`, `768x1024`, `576x1024`, `512x512`.
- If the image is adopted by a project, also write it into that project's real assets path, for example `apps/frontend/src/assets/...`, preferably by using `assetOutputPath` in the same generation call.
- Prefer Spanish prompts for user-facing assets in this project unless the task specifies another language.
- Do not expose or duplicate the API key in tracked files or normal responses.
