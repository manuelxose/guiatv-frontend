# GuiaTV — UX/IA Recommendations (ux-product-researcher, Round 1)

Core test applied to every recommendation below: **¿Puede un usuario entrar y saber en pocos segundos qué está emitiéndose, qué viene después, qué merece la pena ver esta noche y dónde puede verlo?** Anything that doesn't answer this above the fold is flagged for cutting, not kept "for now."

Grounded against `docs/rebuild-audit-round1.md` and `docs/rebuild-scoreboard.md` — every IA move below only assumes data confirmed live on the canonical `/v2` surface (`/v2/tv/read*`, `/v2/tv/surface/*`, `/v2/discovery/*`, `/v2/catalog*`, `/v2/blog*`). Where a pattern would need data GuiaTV doesn't have (e.g. per-user "match score", social reviews, watch-progress sync across devices), it's explicitly excluded below rather than silently assumed.

---

## 0. What GuiaTV's data actually supports (constraint check before any IA)

From the audit, confirmed live and real (post Round 3 fix):
- `/v2/tv/read`, `/v2/tv/surface/guide` — real now/next/tonight airings, per-channel, with live-now flags.
- `/v2/discovery/home`, `/v2/discovery/browse`, `/v2/discovery/search`, `/v2/discovery/for-you` (auth-gated) — catalog discovery, platform-tagged.
- `/v2/catalog/*`, `/v2/catalog/platforms`, `/v2/catalog/suggest` — movie/series/program detail + platform metadata + search suggest.
- `/v2/blog`, `/v2/blog/categories` — editorial posts, categories, rankings (Top 10 pages exist under `blog/pages/top10`).
- Sports data flows through the same `/v2/tv/read` airings with genre/competition tags (`sports-view.component.ts` groups by `competition`/`sport`), **not** a separate scores/fixtures feed — no live score, no possession stats, no player data. Treat sports as **"where and when to watch," not a live-score product.**
- No confirmed personal watch-progress/continue-watching sync feed in this audit round (for-you exists but wasn't traced for "continue watching" semantics) — do not propose an Apple-TV-style cross-app "Continue Watching" rail without confirming this with backend-data-engineer first.

Everything proposed below is scoped to what's confirmed above.

---

## 1. Home

### Source patterns
- **Apple TV "Watch Now" (tvOS 26 redesign, 2025)**: fewer, better-grouped rows; the personal/live row sits at the very top, above editorial/marketing content, and the row *is* the content (poster + progress + live badge), not a headline about the row. [MacRumors 2022 "Featured" backlash / 9to5Mac 2025 update]
- **Google TV homescreen redesign (2025)**: navigation chrome collapsed into a single pill (Home / Live / Apps + search), freeing vertical space for content rows starting immediately below the fold line. Live channels surface directly in recommendation rows, not behind a separate marketing section.
- **JustWatch**: the "what's on your services right now" home concept — platform-scoped content is the first content row, not an explainer about platforms.

### GuiaTV IA proposal
Order above the fold, in priority:
1. **Live-now strip** — 1 lead item (current top program) + 3-5 compact cards, sourced from `liveNow()` (already wired via `PortalHomeFacade`). This *is* the hero. No separate copy hero above it.
2. **Tonight strip** — same treatment, `tonight()`.
3. Below the fold: streaming highlights, platform grid, sports-now, editorial, trending — current ordering in `home.component.html` is essentially right *once the lead copy block above it is removed/shrunk* (see §4).

### Time-to-answer justification
With the lead copy block removed, a real program title + channel + time is inside first viewport paint on both desktop and mobile — answers "what's on now" in under 2 seconds of scan time, no scrolling.

---

## 2. TV Guide / EPG — Desktop and Mobile as distinct UX

### Current state (confirmed by reading the components, not assumed)
GuiaTV's `live-guide-view.component.html` is **not a classic grid EPG** — it's already card-rail-based: a "feature grid" (1 lead card + stack), a channel-chip row, "spotlight modules" (rails), an `epg-row` list, and a "day" mode that groups `epg-row` lists by channel. This is much closer to a discovery-rail product than a channel×time grid. That's a real product decision to surface explicitly to ui-design-director (§5), not something to silently keep or silently discard.

### Source patterns
- **Plex grid guide (2018, still current pattern)**: channel×time grid is the correct pattern *for a "what's on every channel right now, and in the next few hours" comparison task* — you can eyeball 15 channels' current+next slot at once. This is a genuine desktop-only strength; it doesn't survive touch/narrow viewports.
- **Hulu + Live TV / YouTube TV mobile guide**: neither ports the grid to mobile. Both use a **vertical, channel-per-row list**, each row showing current program (with a scrub/progress indicator) and the option to page forward in time — i.e., time becomes a per-row horizontal micro-scroll or a single "next" affordance, not a 2D grid a thumb has to pan across. This is the direct precedent for "GuiaTV needs a genuinely different mobile EPG, not a shrunk grid" in the brief.
- **General mobile EPG research (2025)**: "you can't fit more than ~8 rows on a small screen without it turning into a blurry mess" — confirms channel-per-row-with-expand (tap a channel row to expand and reveal more of its schedule inline) beats attempting a scaled-down grid.

### GuiaTV IA proposal
**Desktop**: Add a true channel×time grid as *one* of the live-guide's views (it doesn't have one today — the current `day` mode is channel-grouped lists, not a grid). This is the single biggest structural gap relative to the "at-a-glance, scan 15 channels" job the grid uniquely does well. Feed: same `TvDataFacade.readView('all')` data, pivoted by channel × 30-min slot.

**Mobile**: Keep (and lead with) the current channel-row-chip + card-rail pattern — it is already the right shape for mobile, not a shrunk grid. Sharpen it:
- The lead "feature grid" card should always be the literal live-now program (it already is), not a chosen editorial "spotlight."
- Add per-channel expand-in-place (tap a channel chip → inline reveal of that channel's next 3-4 slots) rather than routing to `/canales/:id` for a quick glance — reserve full channel navigation for users who want the whole day.

### Divergence flag for ui-design-director (see §5)
This is the clearest place two of the three visual directions can genuinely diverge structurally: **EPG-grid-first** (desktop grid is the anchor, discover/streaming are secondary tabs) vs. **discovery-rail-first** (today's approach — live TV is "just another rail category") vs. a **hybrid** (grid unlocked only via explicit toggle, rails by default). Don't pick for them — flag it.

### Time-to-answer justification
Desktop grid: user sees 10+ channels' current+next in one glance, <3s. Mobile card rail: user sees the single most relevant live program in <2s (already true), trades comprehensiveness for speed — correct trade for a thumb-sized viewport.

---

## 3. Streaming / Platforms

### Source patterns
- **JustWatch**: platform badges are load-bearing UI, not decoration — every result carries an unambiguous "on Netflix / rent on Prime" badge, and filtering *by* platform is a first-class control, not buried in a filter drawer.
- **Reelgood**: groups by platform-you-already-pay-for vs. others, personalizing the rail order without hiding the rest.

### GuiaTV IA proposal
Confirmed data: `/v2/catalog/platforms` gives real platform metadata (name, color, logo). Current home already surfaces a platform grid (`home-page__platform-grid`) — keep that shape, but:
- On the Streaming/Platforms page itself, platform should be a **persistent filter chip row above the fold**, not just an entry point from home. `streaming-view.component.ts` should expose platform as a `topPillChip`-style filter (the shell already supports `topPillChips`/`filterDockSections` — reuse, don't invent a new control).
- Every card in the streaming rails must show its platform badge on the card face (not only on click-through) — this is the JustWatch/Reelgood pattern that answers "dónde puede verlo" without a second tap.

### Time-to-answer justification
Platform badge on the card face = "where to watch" answered in the same glance as "what it is," zero extra taps.

---

## 4. Sports

### Source patterns
- **Sofascore**: match status is a strict three-state semantic — **live / scheduled / finished** — each with a distinct, consistent color, never mixed into a generic "card." This is the standard sports-app grammar users already know.
- **ESPN app**: live/upcoming is the entry structure (scores + news), not competition taxonomy first.

### Constraint (important — do not over-promise)
GuiaTV's sports data is **airings, not fixtures/scores**. There is no live-score field in the confirmed `/v2/tv/read` surface. So "finished" in GuiaTV's context can only mean "this broadcast slot has ended," not "match result." **Don't design a scoreboard GuiaTV can't back with data.**

### GuiaTV IA proposal
Adopt the live/upcoming/finished-broadcast three-state as the sports vertical's primary grammar, scoped honestly to broadcast semantics:
- **En directo** (currently airing) — top of page, own visual treatment (GuiaTV's `sports-view.component.html` already has this as `heroLead()`/`timeRange === 'live'` — keep it, but make the live/tonight/week `timeRange` toggle itself read as live/upcoming semantics, not a generic filter chip).
- **Próximos** (scheduled, with kickoff time) — second block.
- Drop or clearly demote "por competición"/"por deporte" grouping below the live/upcoming split — today's `sports-view` puts "Fútbol primero," "Agenda," "Por competición," "Por deporte" as four parallel sections of similar visual weight; that dilutes the live/upcoming answer the brief's core question demands. Competition/sport should be a **filter**, not a **section**.

### Time-to-answer justification
A user asking "is there a match on now" should see it in the first live-badge card, not after scanning through competition groupings — collapsing sections into filters shortens that scan.

---

## 5. Detail Pages (movie/series/channel/program)

### Source patterns
- **Netflix/streaming detail-page convention** (extracted structurally, not visually): hero art → title/decision signals (runtime, genre, rating, year) → synopsis → cast → where-to-watch/platform links → related. The order is decision-signals-before-synopsis because synopsis is the slowest-to-read element and shouldn't gate the platform/runtime decision.
- **JustWatch detail pages**: platform availability is placed at or near the top, not after a full synopsis read.

### GuiaTV current state
`canal-completo.component.html` (channel detail) already does this reasonably well: hero → Now/Next/Tonight stat tiles → live program card → next programs → tonight → full schedule. This is a **good existing pattern worth generalizing**, not replacing.

### GuiaTV IA proposal (generalize the channel-detail hierarchy to movie/series/program details)
1. Title + key decision signals (type, genre/category, year/duration for movies-series; live/upcoming badge + time for programs) — no synopsis yet.
2. **Where to watch** (platform badges / channel + time) — before synopsis, per JustWatch convention.
3. Synopsis.
4. Cast/crew if `/v2/catalog/:id` carries it (verify field presence with backend-data-engineer before designing a cast rail — audit didn't confirm this field).
5. Related/next (same channel's next programs, or same-franchise items) — reuse the "Canales relacionados" pattern already built.

### Time-to-answer justification
Platform/channel-and-time before synopsis means "dónde puede verlo" is answered before the user commits to reading a paragraph.

---

## 6. Search

### Source patterns
- **Baymard autocomplete research**: results should group by entity type when the product spans multiple content types, and recent searches must always show in the zero-state (empty query).
- **Algolia/Smart Interface Design Patterns**: 6-8 suggestions max, first-keystroke response, scoping controls when multiple entity types exist.

### GuiaTV current state
`unified-search.component.html` returns a **flat, ungrouped suggestion list** — a movie, a channel, and a program all render identically (title + one line of meta: channel name, or platform list, or content type — whichever happens to exist). Recent-search history only shows when there are zero suggestions, and is likewise flat.

### GuiaTV IA proposal
- Group suggestions by type: **Canales**, **Programas en directo**, **Películas y series** — even 2-3 items per group beats one undifferentiated list, because it tells the user *what kind* of thing each result is before they read the title.
- Always show recent searches in the zero-query state (not only as a fallback when suggestions are empty) — current code only shows history via `!suggestions.length ? history : []`, i.e. history is suppressed the moment there's a query, which is correct, but it should also proactively show on focus-before-typing (confirm current behavior on focus with no query — worth a quick check against `onFocus()` in the `.ts`).
- Platform/channel badge already present as `suggestion.meta` text — promote to the same visual badge component used elsewhere (`app-platform-badge`) for scan-speed, not text parsing.

### Time-to-answer justification
Grouped-by-type results let a user distinguish "is this a channel or a movie" in the same glance as reading the title, instead of parsing a meta string.

---

## 7. Editorial

### Source pattern
- The failure mode named directly in this task ("feels native, not bolted-on") is best avoided by **cross-linking editorial into the exact modules it's about**, not just listing it as its own vertical. E.g., Trakt's calendar treats "what's airing" and "what to read/track about it" as the same surface, not two apps stitched together.

### GuiaTV current state
Home already has `app-unified-editorial-module` blocks for guides and rankings, positioned after the live/tonight/streaming/sports rails — reasonable placement (editorial supports discovery, doesn't replace it). Editorial SSR is now fixed per the scoreboard (Round 2a/3), so the content will actually render.

### GuiaTV IA proposal
- Keep editorial below the live/tonight fold-critical rails on Home — correct priority, don't move it up.
- On **detail pages**, surface relevant editorial (e.g. a "Top 10" post that includes this title, a channel guide post) as a related-content module, not just a generic "from editorial" home rail. This is the concrete "native, not bolted-on" mechanism — editorial becomes evidence supporting a decision on a detail page, not a separate content silo.
- Confirm with backend-data-engineer whether `/v2/blog` posts carry any tagging back to catalog items/channels before designing this cross-link — audit didn't confirm this relationship exists in the data.

### Time-to-answer justification
Not a fold-critical surface by design — editorial's job is depth after the fast answer, not competing with it.

---

## 8. Content-vs-chrome cuts — specific, file-referenced

Per the audit's own finding (design tokens all collapsed to one red, masthead copy repeated across every view) plus direct reading of templates:

1. **`apps/frontend/src/app/pages/home/home.component.html:23-51`** (`home-page__lead` block) — an eyebrow + `<h1>Empieza por lo que está vivo</h1>` + descriptive paragraph + 4 pill CTAs, **before** the live program card that's the actual answer. The copy literally claims "contenido antes que explicación" while being explanation-before-content structurally. **Cut the eyebrow/h1/paragraph or fold them into a one-line label beside the live card; keep the live card and platform badges, drop the pill-CTA row (redundant with the shell's own top nav tabs).**

2. **Every `*-view.component.html` masthead** (`live-view__masthead`, `sports-view__masthead`, and presumably `discover-view`/`streaming-view` by the same pattern) repeats an eyebrow + `<h2>` + descriptive sentence pattern **above** the actual content rails, e.g. sports: *"La vertical entra por eventos y agenda real, no por estadísticas ni módulos introductorios"* — a sentence describing the IA philosophy, shown to end users, ahead of any real event. **Cut these descriptive sentences entirely** (they're internal design-rationale copy, not user-facing information) and shrink eyebrow+title to a compact single-line label, freeing that vertical space for the feature-grid content that currently comes second.

3. **`unified-portal-shell.component.html:100-150`** (`portal-shell__hero`) — a generic hero block (eyebrow/h1/description/metrics/media) exists in the shared shell and is toggled per-page via `showHero`. Home explicitly sets it `false` and rolls its own near-duplicate hero instead (item 1 above) — meaning the product has **two parallel hero systems**. Consolidate: either use the shell's hero slot for the "lead live program" content (media slot) and kill the bespoke `home-page__lead`, or confirm with angular-ssr-engineer/repo-archaeologist which one is being deprecated. Don't let both exist post-rebuild.

4. **Sports vertical section sprawl** (`sports-view.component.html:41-177`) — five parallel sections of near-equal visual weight (`Fútbol primero`, `Agenda`, `Por competición`, `Por deporte`, quick directories) between the hero and any filter action. Per §4, competition/sport should collapse into filters, cutting real vertical scroll distance to "is anything on now."

5. **Design tokens** (already flagged in the audit, restated here as a UX-severity issue, not just a visual one): `--accent-live`/`discover`/`streaming`/`sports`/`editorial` all resolve to the same `#dc2626`. This isn't just "boring" — it removes the one at-a-glance signal that would let a user tell, from a card's accent color alone, which vertical/context a piece of content belongs to when scanning a mixed rail (e.g. Home mixes live, streaming, and sports cards in adjacent rails). Restoring distinct accents is a genuine time-to-answer fix, not decoration — flag as high priority to ui-design-director.

---

## 9. Input for ui-design-director's 3 visual directions

Structural divergence points found during this research (not visual — these are IA-level forks that should produce genuinely different component structures, not just different skins):

1. **EPG-grid-first vs. discovery-rail-first vs. hybrid** (§2) — the single largest fork. Grid-first treats live TV comprehension (Plex-style channel×time scan) as the primary job; rail-first (current shape) treats live TV as one discovery category among several; hybrid offers both with a toggle. This changes component architecture, not just styling — recommend one direction commit to grid as default-desktop, one commit to rails-only, one do the hybrid toggle, so the actual comprehension trade-off gets user-tested rather than assumed.

2. **Sports as broadcast-guide vs. sports as fixture-tracker look** (§4) — since GuiaTV's data is airings-only (no live scores), one direction could lean into that honestly (clean live/upcoming broadcast cards, channel-first), while another could test whether users expect score-app affordances (and the answer is "no, cut it" if backend confirms no score data is coming) — flag this as a data-scope question for backend-data-engineer, not purely visual.

3. **Home hero consolidation** (§8.3) — one direction could resolve the dual-hero problem by using the shared shell hero exclusively (with the live card *in* the hero media slot), another by killing the shell hero entirely and letting every page open directly on content modules (Google TV's 2025 approach — chrome shrinks to a nav pill, content starts immediately). These produce different component contracts for `unified-portal-shell`, worth deciding at the architecture stage, not late.

4. **Search: inline grouped dropdown vs. full-screen search state** — current pattern is an inline dropdown menu (`search-shell__menu`) anchored to the input. A more aggressive mobile-first direction (seen in Google TV / most modern mobile search UX) replaces this with a full-screen takeover on focus, giving each grouped result section (Canales/Programas/Películas y series) real room instead of a cramped anchored panel. Worth prototyping both for mobile specifically, since the anchored-dropdown pattern degrades fastest on narrow viewports.

---

## Summary of concrete asks by recipient

- **ui-design-director**: resolve the dual-hero system (§8.3, §9.3); pick a structural EPG direction per §2/§9.1; restore distinct per-vertical accent colors (§8.5, already an audit FAIL) as a UX-functional fix, not cosmetic polish.
- **angular-ssr-engineer / component owners**: cut masthead descriptive-sentence copy across all four unified-guide views (§8.2); cut/shrink the home lead block (§8.1); regroup sports sections into live/upcoming + filters (§4, §8.4); group search suggestions by type (§6).
- **backend-data-engineer**: confirm whether cast/crew fields exist on `/v2/catalog/:id` (§5) before a cast rail is designed; confirm whether `/v2/blog` posts carry any catalog/channel tagging (§7) before cross-link modules are designed; confirm sports data will remain airings-only vs. gaining a scores feed (§9.2) before committing to either sports visual direction.
