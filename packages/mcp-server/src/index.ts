// @toastmasters/mcp-server — public barrel.
//
// ADR-008 Sprint 1 (#1043): the typed, read-only CDN client is implemented in
// the GREEN step. This placeholder keeps the package type-checkable while the
// CdnClient read tests are RED (they import `CdnClient` from here, which does
// not exist yet).
export {}
