---
name: browser-validation
description: Validates UI changes in real browsers with Playwright and axe. Use after any frontend change to check responsive viewports, console/network errors, navigation, loading/empty/error states, and accessibility violations.
---

# Browser validation

Use the repository command `npm run test:e2e`. Cover representative small-mobile, large-mobile, tablet, laptop, and desktop widths. Check console errors, failed network requests, navigation, loading/empty/error states, and theme/mobile navigation. Use `@axe-core/playwright` and fail on serious or critical violations. Capture screenshots as evidence; avoid brittle pixel-perfect assertions for dynamic data.
