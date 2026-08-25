# Browser validation

Use the repository command `npm run test:e2e`. Cover representative small-mobile, large-mobile, tablet, laptop, and desktop widths. Check console errors, failed network requests, navigation, loading/empty/error states, and theme/mobile navigation. Use `@axe-core/playwright` and fail on serious or critical violations. Capture screenshots as evidence; avoid brittle pixel-perfect assertions for dynamic data.
