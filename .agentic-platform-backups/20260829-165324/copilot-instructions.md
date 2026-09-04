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

## Frontend design system & theme (always apply)
- All frontend theming goes through semantic tokens in `apps/frontend/src/styles/design-tokens.scss` (`--portal-*`, `--accent-*`, `--guide-*`).
- Real light/dark/system theme is owned by `apps/frontend/src/app/services/theme.service.ts`, mirrored on `<html data-theme>` + `color-scheme`, with an inline no-flash script in `apps/frontend/src/index.html`.
- NEVER hardcode semantic surfaces in components: `slate-*`, `gray-*`, `text-white`, `bg-white`, `bg-black`, `#081018`. Use `bg-[var(--portal-*)]` / `text-[var(--portal-*)]` / `border-[var(--portal-border)]`. Exceptions: `text-white` on red accent buttons; `bg-black/<opacity>` modal backdrops only.
- Verify both light and dark themes on any UI change.

<!-- BEGIN AGENTIC-ENGINEERING-PLATFORM -->
Use repository evidence before assumptions. When `graphify-out/graph.json` exists, query Graphify before broad repository exploration; determine impacted files, callers, dependencies, and data flows, then read only the minimum relevant source. Never ingest graph artifacts wholesale.

For non-trivial work: understand → graph discovery → plan → implement narrowly → test → review → verify. Preserve unrelated behavior and existing instructions. Do not hardcode secrets, providers, credentials, or environment-specific values. Do not invent repository behavior or claim checks passed unless executed. Keep token use lean, but never skip correctness, security, migrations, or critical dependency inspection. For UI changes, verify responsive behavior, accessibility, and all interaction states.
<!-- END AGENTIC-ENGINEERING-PLATFORM -->
