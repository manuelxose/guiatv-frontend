# GuíaTV Assistant — Enterprise Current-State Audit

Date: 2026-08-25  
Scope: frontend assistant shell and components, frontend chat service, backend AI routes/controller/orchestration/provider, conversation memory, launcher, responsive behavior, tests, security, and performance evidence.

## Executive summary

GuíaTV already has a substantial assistant. The current path is `AppComponent` deferred launcher → `UnifiedChatShellComponent` → `AIChatbotComponent` → `ChatbotService` → authenticated `/v2/ai/chat/stream` → `AIController` → `ChatbotRecommend` → deterministic catalogue queries and, when required, `AIRecommendationService`. `AssistantMemoryService` owns conversation persistence and personalization. Replacing this stack would regress working history, SSE, memory, recommendation tracking, reminders, auth, and recent lazy-loading work.

The highest-value rebuild work is not a new chatbot shell. It is: making request state and cancellation explicit; closing recommendation-grounding gaps; adding input and provider-output boundaries; defining additive structured/context contracts; reducing mobile chrome and nested mental models; and adding reproducible response-quality, accessibility, visual, and latency evidence.

## Current architecture

### Frontend

- `AppComponent` owns open, close, minimize, restore, desktop resize, and mobile swipe-dismiss. Both mobile and desktop bodies use Angular `@defer (when isChatbotOpen)`.
- `UnifiedChatShellComponent` mounts the assistant and social chat simultaneously in translated tab panels. This preserves both tabs but keeps the separate social realtime model inside the assistant chrome.
- `AIChatbotComponent` is the presentation orchestrator. It subscribes to messages, memory, auth, and request state; manages overlays, onboarding, history, prompts, feedback, reminders, suggestions, and scrolling.
- `ChatbotService` is the canonical frontend data owner through `BehaviorSubject`s. It handles auth state, hydration, non-streaming and SSE requests, persistence IDs, history CRUD, memory updates, retries, and response normalization.
- Child components already exist for header, composer, messages, recommendations, onboarding, memory, preferences, context, skeletons, and conversation history.

### Backend

- All `/ai/*` routes are authenticated and chat writes are rate limited.
- `AIController` handles quota counting, SSE framing, history/memory/conversation APIs, feedback, and reminders.
- `ChatbotRecommend` mixes intent classification, retrieval planning, catalogue access, regional preferences, ranking, caching, provider context, response finalization, and persistence in one 2,600-line use case.
- Direct TV-now and tonight responses use real catalogue/EPG data and bypass the model when possible.
- `AIRecommendationService` wraps DeepSeek/Anthropic with a fallback provider and normalizes JSON output.
- `AssistantMemoryService` scopes reads and mutations by both `userId` and `conversationId`, caps stored history, and persists memory and actions.

## Current request flow

1. Opening chat activates social realtime only on actual use and lazily instantiates the chat shell.
2. Authenticated initialization hydrates the selected conversation; unauthenticated visitors receive a login/register value screen.
3. Sending appends the user message and a thinking placeholder, then POSTs the filtered history to `/ai/chat/stream`.
4. The server emits an immediate SSE `ping`, resolves history/profile/preferences, classifies intent, and fetches only the needed TV or streaming data.
5. Deterministic schedule answers return as a `full` event. Other answers stream provider text, then resolve recommendations against the catalogue and persist the turn.
6. The client replaces the streaming placeholder with the final response, recommendations, suggestions, query context, conversation ID, and memory snapshot.

## State ownership

- Canonical messages, conversation summaries, memory, session state, and request state: `ChatbotService`.
- UI-only panel selection, scrolling, onboarding visibility, dismissed prompts, and local conversation arrays: `AIChatbotComponent`.
- Open/minimize/resize/swipe state: `AppComponent`.
- Social conversations/presence/socket state: separate `ChatService`, but mounted in the same shell.
- Backend conversation and memory persistence: `AssistantMemoryService` and Mongoose models.

## Confirmed strengths

- Chat remains deferred, and presence/socket work is gated until chat is activated.
- SSE sends immediate acknowledgement, uses `X-Accel-Buffering: no`, and has a 25-second client timeout.
- Direct schedule intents use application data, deterministic ranking, deduplication, and short per-user caches.
- Conversation ownership checks consistently include `userId`; IDs alone do not authorize access.
- Search escapes regex characters and caps the query to 100 characters.
- Conversation data has a 90-day inactivity TTL and account deletion copy explicitly covers conversations and preferences.
- Assistant prose is rendered through sanitized Markdown rather than arbitrary raw HTML.
- Existing Playwright shell tests cover document width from 320–1,920 px and chat opening.

## Duplicated logic and oversized components

- `ChatbotRecommend` duplicates the execute and executeStream retrieval/setup paths and owns classification, retrieval, ranking, composition, caching, and persistence.
- Frontend and backend duplicate response/query-context interfaces without a contract test or generated/shared schema.
- `AIChatbotComponent` keeps a local `conversations` array in addition to the service subject and refetches the entire list after update/delete.
- Suggestion cleanup and deduplication exist on both frontend and backend.
- `AIChatbotComponent` (763 lines), `ChatbotService` (1,225), `ChatbotRecommend` (2,624), and `AssistantMemoryService` (1,002) have multiple reasons to change.

## Answer-quality risks

- Intent families are limited to `tv_now`, `tv_tonight`, `streaming`, and `general`; football, channel lookup, comparison, reminder, and contextual follow-up are not first-class orchestration intents.
- Provider recommendations without a resolved catalogue match can survive finalization. This is the main confirmed hallucination path.
- A provider-supplied `catalogId` is treated as already resolved without proving the provider had authority to supply it.
- The system prompt says not to invent facts, but prompt text is not a security boundary and retrieved/user text is not explicitly delimited as untrusted data.
- The response contract has prose, recommendation lists, suggestions, and a small query context, but no stable sources, sections, typed actions, confidence, match cards, or channel cards.
- No reproducible benchmark covers the query classes in the initiative brief.

## UX and mobile findings

- Baseline mobile is full height, uses `100dvh`, and respects bottom safe-area padding in the composer region.
- The draggable sheet handle, `Asistente | Personas` tabs, and assistant header consume substantial vertical space before content. Social chat is a separate mental model and realtime system; keeping it as a primary assistant tab weakens the assistant's information architecture.
- Anonymous launch is polished but functionally gated. The backend requires authentication, so the current preview chips all redirect to login and can look interactive without answering.
- The composer auto-grows and keeps its send button stable, but has no stop-generation button, retry of the last prompt, offline state, status label, input label, or progress-specific language.
- Four permanent quick actions can overflow or become cramped at narrow widths; `/buscar` exposes an implementation command instead of intent-level navigation.
- Mobile keyboard behavior is not explicitly tested. The full-screen panel uses a gesture handle even though close/minimize exists, but the gesture has no keyboard equivalent tied to that handle.
- Desktop panel width is resizable and bounded, but the resize affordance lacks keyboard semantics.

## Reliability and latency findings

- The server emits an immediate `ping`, but the frontend does not distinguish connecting, retrieving data, and streaming.
- Client timeout aborts after 25 seconds but removes the partial response and does not expose an explicit retry action tied to the original prompt.
- Unsubscribing aborts the fetch, but there is no public `stopGeneration()` control and no explicit cancelled state.
- Server streaming continues provider iteration unless the disconnected response is checked; cancellation is not propagated to provider clients.
- Cache keys are per user, avoiding cross-user response cache contamination.
- Baseline measured on the already-running SSR service: mobile open 918 ms and desktop open 1,089 ms, including an intentional 800 ms settling wait; panel DOM becomes visible within that window. API `/health` was 16.7 ms and SSR `/` 7.4 ms from localhost.

## Accessibility findings

- Baseline shell has semantic buttons and visible text, but the composer textarea has no accessible name.
- Stream completion is not announced through a bounded `aria-live` region; announcing every token would also be incorrect.
- Focus is not explicitly moved into the chat on open or restored to the launcher on close.
- The chat overlay is not declared as a dialog and does not trap focus.
- The desktop resize strip is pointer-only.
- Several inline SVGs are decorative but lack `aria-hidden="true"`.
- Motion does not have a chat-specific `prefers-reduced-motion` override.

## Security and privacy findings

- Positive: auth guard and ownership filters protect every conversation/memory endpoint; model output is parsed and rendered through safe framework/sanitizer paths; secrets remain server-side; rate limits and daily quotas exist.
- Request messages have no boundary cap for count, role, or per-message length, leaving unbounded-consumption and prompt-cost risk.
- `conversationId` and reminder fields are weakly validated. Reminder creation accepts a title without verifying a real programme/start time.
- SSE error events can include internal exception messages in the response body.
- Logs include user IDs and conversation IDs (operational identifiers) but not raw chat text. Retention exists for conversations; memory retention/reset and full deletion behavior need an explicit privacy document and integration proof.
- Recommendation URLs/images from model/provider data must remain allowlisted or sanitized before navigation/rendering; current detail navigation is safer when a real catalogue path exists.

## Observability gaps

- Existing logs record phases and elapsed time, and prompt size is estimated.
- No consistent request/correlation ID is returned through SSE.
- Time to first SSE event, first text token, first structured data, cancellation, timeout, cache status, result count, and fallback usage are not recorded as one request trace.
- Product analytics do not emit the assistant events named in the brief.

## Dead/unused code assessment

- No assistant implementation is proven dead yet. `sendMessage()` remains a non-streaming fallback/consumer path and must not be deleted by appearance alone.
- Social chat is active product functionality and must be relocated, not deleted, if the IA changes.
- Graph/reference search is required again before any cleanup.

## Baseline evidence

- `npm run agent:verify`: completed without reported errors.
- `npm test`: backend 90/90 passed; frontend test compilation succeeded, then Karma failed because `ChromeHeadless` is not installed/configured on the host (`CHROME_BIN` absent). Classified environmental/pre-existing.
- `npx playwright test e2e/specs/shell.spec.ts --project=chromium`: 5/5 passed.
- Baseline screenshots: `docs/evidence/chatbot-baseline/mobile-light.png` (390×844) and `desktop-light.png` (1440×1000).
- Development build reported initial raw total 1.43 MB; production bundle and lazy-chat chunk must be recorded separately before/after implementation.

## Audit conclusion and migration order

Use an additive migration: first define typed context/response/state contracts; then close boundary and grounding gaps; then add cancellation/progress/recovery; then simplify the assistant-first mobile shell and validate real screenshots; finally add benchmarks, accessibility, performance, and security evidence. Preserve current deferred loading, authentication, conversation APIs, memory, social chat, and existing API fields throughout.
