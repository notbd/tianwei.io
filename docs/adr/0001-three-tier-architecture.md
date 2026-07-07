# ADR-0001: Deliberate three-tier architecture for a personal site

- **Status**: Accepted (2024; recorded retroactively 2026-07)
- **Repos**: [tianwei.io](https://github.com/notbd/tianwei.io) · [tianwei-io-api](https://github.com/notbd/tianwei-io-api) · [tianwei-io-content](https://github.com/notbd/tianwei-io-content)

## Context

A personal portfolio/blog does not need three deployables. A single Next.js
repo with local MDX (the previous Contentlayer setup) renders the same site
with less latency, less configuration and no cross-repo coordination.

The system was split anyway, for explicitly educational reasons: to
practice the problems that only exist **between** services — contract
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

- **Contract drift** is the tax. It is paid down with contract tests in
  every repo (exact JSON fixtures) rather than a shared types package,
  which would couple releases and defeat the purpose of the split.
- **Operational invariants** (atomic sync, single cache layer, additive
  migrations) are documented as ADRs and pinned by tests, because in a
  multi-repo system nobody's compiler sees the whole picture.

## Consequences

- Every change touching the wire format follows a rollout order
  (content → api → frontend, additive first) instead of one atomic commit.
- Each repo stays independently deployable, testable, and boring.
- The architecture is over-engineered for the traffic on purpose; the
  moment that stops being educational, collapsing back into one repo is a
  legitimate future ADR.
