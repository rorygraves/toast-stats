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

| ADR                                                | Title                                     | Status   | Date     |
| -------------------------------------------------- | ----------------------------------------- | -------- | -------- |
| [001](001-cdn-only-frontend.md)                    | CDN-only frontend (no API server)         | Accepted | Jan 2026 |
| [002](002-staging-environment.md)                  | Staging environment and deployment flow   | Accepted | Apr 2026 |
| [003](003-staging-bucket-cors-preview-channels.md) | Staging bucket CORS for Firebase previews | Accepted | May 2026 |
| [004](004-release-gated-production-deploy.md)      | Release-gated production deploys          | Accepted | May 2026 |

## When to Write an ADR

- Choosing between fundamentally different approaches
- Adding a new external service or infrastructure component
- Changing the data model in a way that affects multiple modules
- Introducing a new architectural pattern
- **Not** for routine refactors or feature additions
