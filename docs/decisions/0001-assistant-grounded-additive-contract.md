# ADR-001: Evolve the assistant through a grounded additive contract

## Status

Accepted

## Date

2026-08-25

## Context

The current assistant already supports authenticated SSE chat, deterministic TV and streaming retrieval, recommendations, conversations, memory, feedback, reminders, and social chat. Its public response shape and frontend consumers are in production. Replacing the stack or changing existing field meanings would create unnecessary compatibility and performance risk.

Factual schedules, channels, football data, scores, and platform availability cannot be delegated to a language model. The current response is only partially structured, intent coverage is narrow, and frontend request state collapses distinct phases into `sending`.

## Decision

1. Keep `/ai/chat` and `/ai/chat/stream` and their current fields.
2. Extend requests with an optional typed `context` object; never scrape DOM state.
3. Extend responses with optional intent, confidence, sources, sections, and typed actions while retaining `text`, recommendations, suggestions, query context, conversation ID, and memory snapshot.
4. Treat deterministic application/provider retrieval as the authority for facts and cards. Language-model output may compose prose and explanations but must not create factual entities that fail catalogue/provider resolution.
5. Model frontend request progress as a discriminated state and expose cancellation/retry without introducing a second canonical conversation store.
6. Preserve chat deferral and avoid new eager dependencies, global polling, or sockets.

## Alternatives considered

### Replace the assistant end to end

Rejected because it would discard working persistence, auth, SSE, memory, recommendation, and lazy-loading behavior without evidence that those foundations are the cause of current gaps.

### Return prose only and infer UI from Markdown

Rejected because Markdown cannot safely or predictably express programme, match, source, reminder, and navigation semantics.

### Let the model call arbitrary tools directly

Rejected because schedules and availability need deterministic authorization, validation, timeouts, and provider isolation. A model-selected hint may inform routing later, but code owns tool allowlists and arguments.

### Introduce a new API version immediately

Rejected because the required evolution is additive. A new version would duplicate behavior and violate the one-version principle before a breaking change exists.

## Consequences

- Existing clients continue to work while newer clients consume richer fields.
- Backend and frontend types must be kept in contract tests until a shared/generated schema is introduced.
- Unresolved model recommendations disappear instead of being shown as plausible facts.
- Explicit states improve recovery and accessibility but require coordinated service/composer/timeline tests.
- Football and other intent families can be added behind the same orchestration boundary without bloating the presentation components.

## Rollback

Optional response/context fields can be ignored by older clients. UI changes can be reverted independently while the server continues returning the legacy fields. Grounding enforcement may reduce result counts but does not change stored conversation schema requirements.
