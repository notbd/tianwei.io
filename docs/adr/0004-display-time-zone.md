# ADR-0004: A single display time zone constant

- **Status**: Accepted (2026-07)
- **Repos affected**: tianwei.io (display); pairs with tianwei-io-content ADR-0003 (parse/storage)

## Context

Dates were formatted ad hoc (`toLocaleDateString` with no zone), which
inherits the **server's** timezone: correct-looking on Vercel (UTC),
off-by-one when rendered on a machine in another zone — the OG image
showed "October 22" for a post dated October 23 during local testing.
The author wants everything presented in US Eastern time.

## Decision

- `DISPLAY_TIME_ZONE = 'America/New_York'` in
  `src/lib/constants/constants.ts` is the single source of truth for
  how dates are **presented**. Storage remains UTC instants end to end.
- All visible dates go through one helper, `formatPostDate()`
  (`src/lib/dates.ts`) — components never call `toLocaleDateString`
  directly, so the zone cannot fork.
- Machine-readable timestamps stay UTC/ISO: `<time dateTime>`, sitemap
  `lastModified`, RSS `pubDate` are instants, not presentations.
- The constant MUST match the content engine's `CONTENT_TIME_ZONE`,
  which anchors authored calendar dates to this zone's midnight —
  the pairing round-trips authored dates exactly.

## Consequences

- Rendering is identical wherever it runs (local build, CI, any Vercel
  region); tests pin EST and EDT instants.
- Turning the constant into a per-visitor preference later is a
  display-layer-only change.
- Deploy coupling: the content re-sync (ET-anchored instants) must land
  before or with this change, or legacy UTC-midnight rows display one
  day early.
