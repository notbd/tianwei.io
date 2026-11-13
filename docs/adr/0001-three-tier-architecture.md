# ADR-0001: Deliberate three-tier architecture for a personal site

- **Status**: Accepted (2024; recorded retroactively 2026-07)
- **Repos**: [tianwei.io](https://github.com/notbd/tianwei.io) · [tianwei-io-api](https://github.com/notbd/tianwei-io-api) · [tianwei-io-content](https://github.com/notbd/tianwei-io-content)

## Context

A personal portfolio/blog does not need three deployables. A single Next.js
repo with local MDX (the previous Contentlayer setup) renders the same site
with less latency, less configuration and no cross-repo coordination.

The system was split anyway, for explicitly educational reasons: to
practice the problems that only exist **between** services: contract
management, independent deployment, cache invalidation across ownership
boundaries, schema evolution with live readers.

## Decision

Three repos with strict ownership:

| Tier | Owns | Must never |
| --- | --- | --- |
| Content engine | MDX source of truth, DB schema + migrations, write path | Serve reads |
| API | Read path, wire contract, visibility rules (published-only) | Write to the DB, own caching |
| Frontend | Rendering, the ONLY cache layer, revalidation endpoint | Reach the DB directly |

The costs are accepted and managed, not denied:

- **Contract drift** is the tax, paid down with tests rather than a
  shared types package, which would couple releases and defeat the
  purpose of the split. Contract tests pin the API's JSON in the API and
  in the frontend. Post bodies are held to the frontend's published
  component contract, which the content engine checks before it syncs,
  and both repos test the same list of inputs against it (ADR-0006). The
  table schema is copied verbatim from the content engine into the API (a
  header comment marks the copy); keeping the two identical is a manual
  step.
- **Operational invariants** (atomic sync, a single cache layer, the
  deploy handshake) are documented as ADRs and pinned by tests, because
  in a multi-repo system nobody's compiler sees the whole picture. A
  schema or wire change that renames or retypes something ships in two
  releases (add the new, then remove the old), in the order ADR-0006
  sets.

## Consequences

- Every change that crosses a repo boundary ships in an order instead of
  one atomic commit; ADR-0006 gives the rule for choosing it.
- Each repo stays independently deployable, testable, and boring.
- The architecture is over-engineered for the traffic on purpose; the
  moment that stops being educational, collapsing back into one repo is a
  legitimate future ADR.
