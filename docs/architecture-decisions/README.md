# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Toast Stats project.

## Format

Each ADR follows this template:

```markdown
# ADR-NNN: [Title]

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Context**: What is the issue that we're seeing that motivates this decision?
**Decision**: What is the change that we're proposing and/or doing?
**Consequences**: What becomes easier or more difficult because of this change?
**Alternatives Considered**: What other approaches were evaluated?
```

## Index

| ADR                                                   | Title                                                      | Status   | Date     |
| ----------------------------------------------------- | ---------------------------------------------------------- | -------- | -------- |
| [001](001-cdn-only-frontend.md)                       | CDN-only frontend (no API server)                          | Accepted | Jan 2026 |
| [002](002-staging-environment.md)                     | Staging environment and deployment flow                    | Accepted | Apr 2026 |
| [003](003-staging-bucket-cors-preview-channels.md)    | Staging bucket CORS for Firebase previews                  | Accepted | May 2026 |
| [004](004-release-gated-production-deploy.md)         | Release-gated production deploys                           | Accepted | May 2026 |
| [005](005-district-subpage-ia-and-secondary-nav.md)   | District subpage IA map + secondary route-nav              | Accepted | May 2026 |
| [006](006-data-table-page-layout-and-column-model.md) | Data-table page layout & column-model standard             | Accepted | May 2026 |
| [007](007-data-serving-gcs-cdn-lb-over-firebase.md)   | Serve data via GCS + Cloud CDN + LB (not Firebase Hosting) | Accepted | May 2026 |

## When to Write an ADR

- Choosing between fundamentally different approaches
- Adding a new external service or infrastructure component
- Changing the data model in a way that affects multiple modules
- Introducing a new architectural pattern
- **Not** for routine refactors or feature additions
