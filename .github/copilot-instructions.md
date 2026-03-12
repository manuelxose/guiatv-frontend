SiliconFlow image generation is available in this workspace through the MCP server `siliconflow-images` and the tool `generate_image`.

Use `generate_image` whenever a task would benefit from a real visual asset instead of only describing one. Typical cases include blog covers, social cards, OG images, thumbnails, banners, hero images, placeholders, or other editorial artwork.

Default behavior:
- Use `black-forest-labs/FLUX.2-pro` by default unless a task explicitly requires another model.
- Use one of these supported sizes unless the task explicitly needs a different supported aspect ratio: `1024x576`, `1024x768`, `768x1024`, `576x1024`, `512x512`.
- The canonical storage location is the workspace-root folder `generated-assets/`, at the same level as `apps/`.
- Save every generated image first under `generated-assets/<project>/`.
- Project folders may contain a symlink named `generated-assets` that points back to their canonical subfolder under the root storage directory.
- Set `project` explicitly when generating. Use project names that match the workspace, such as `frontend` or `backend`. If `assetOutputPath` already targets `apps/<project>/...`, the tool may infer the project automatically.
- If the image becomes part of the shipped app, also save a second copy to the final project asset path, for example `apps/frontend/src/assets/...`, using `assetOutputPath` in the same generation when possible.
- Prefer Spanish prompts for Spanish-facing content unless the task explicitly requires another language.
- Never expose, duplicate, or hardcode the SiliconFlow API key in tracked files, prompts, logs, or responses.
