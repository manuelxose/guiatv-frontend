# GuíaTV

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People in Spain deciding what to watch now or later across linear television, streaming catalogues, and football broadcasts. The primary mobile use case is a quick, low-friction answer while the person is away from a desktop.

## Product Purpose

GuíaTV turns trusted schedule, catalogue, availability, and sports data into a conversational discovery layer. Success means a person can move from a natural-language question to a grounded viewing option, detail page, or reminder without learning the site's information architecture.

## Positioning

The assistant combines GuíaTV's current TV schedule, streaming catalogue, football data, and a user's explicit preferences. The language model may explain and rank retrieved facts, but it is not the source of schedules, channels, scores, times, or availability.

## Operating Context

- Global discovery questions such as what is on now, tonight, or on a named platform.
- Contextual questions opened from a programme, movie, series, channel, or football match.
- Short mobile sessions with touch and an on-screen keyboard, plus longer desktop sessions.
- Anonymous visitors evaluating public discovery value and authenticated visitors using saved conversations, memory, feedback, watch actions, and reminders.

## Capabilities and Constraints

- Existing Angular SSR frontend and Node/TypeScript backend must remain compatible.
- SSE streaming, conversation history, memory, onboarding, recommendations, social chat, authentication, reminders, and lazy loading already exist and must be evolved additively.
- Initial-route bundle cleanliness is a product constraint; chat stays deferred and does not start presence, sockets, polling, or history fetches until needed.
- Factual TV, streaming, and football claims require application/provider data. Unknown data must remain unknown.
- Light and dark themes use the semantic tokens in `src/styles/design-tokens.scss` and `ThemeService`.
- Authentication remains a deliberate boundary unless public ephemeral chat is separately designed and secured.

## Brand Commitments

- Product name: GuíaTV.
- Spanish, direct, useful language.
- Restrained, modern, premium presentation that remains recognizably GuíaTV.
- Interaction quality may learn from leading consumer AI products, but visual branding must not clone them.

## Evidence on Hand

- Production application code under `apps/frontend` and `apps/backend`.
- Real TV/EPG, catalogue, streaming-provider, football, profile, memory, and conversation integrations in the repository.
- Semantic design tokens at `src/styles/design-tokens.scss`.
- Baseline assistant screenshots at `../../docs/evidence/chatbot-baseline/`.
- No testimonials, commercial performance claims, or fabricated personalization are approved.

## Product Principles

1. Give the direct answer before configuration or explanation.
2. Ground facts in trusted data and make uncertainty visible.
3. Ask for one preference only when it materially improves the result.
4. Treat mobile as the primary conversational surface, not a compressed desktop modal.
5. Preserve user control over conversations, memory, generation, and recovery.

## Accessibility & Inclusion

Target WCAG 2.2 AA, including keyboard operation, visible focus, screen-reader semantics, 44 px touch targets where practical, zoom, reduced motion, safe areas, and meaningful announcements that do not speak every streamed token.
