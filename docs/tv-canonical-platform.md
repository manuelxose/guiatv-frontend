# Canonical TV data path

GUIA TV uses the persisted EPG/read-model path for TV data:

`EPG sources → SyncEPGData → channels/programs → TvReadModelBuilder → tv_read_airings → TvReadQueryService → API/UI/chatbot`

Source feeds are configured with `EPG_SOURCE_URLS`; the first source is the
primary schedule source and later sources are deterministic fallbacks and
metadata confirmations. A failed sync does not remove an existing valid
slice. No consumer should call an external EPG provider.

Channel identity is resolved by source ID, canonical registry alias, then a
normalized fallback. Pay-TV and Movistar aliases live in `tvMetadata.ts` and
resolve to the same canonical IDs used by the read model and chatbot grounding.
They are not programme fixtures: a channel is shown only when the catalogue or
EPG source supplies it, and every airing retains source provenance.

The `day` read view is the complete paged guide feed (maximum 5,000 rows per
request); `now`, `next`, `night`, and `search` remain bounded hot paths. The
frontend guide defaults to `all` and offers explicit group filters, while the
backend treats an omitted/`all` group as no group predicate.
