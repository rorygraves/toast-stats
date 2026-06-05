# Extract QueryClient config into QUERY_CLIENT_CONFIG

> Feature **queryclient-config** — base branch `main`,
> branch prefix `forge`.

## Pieces

<!-- forge:order-start -->

1. <!-- forge:piece p1 -->**p1: Extract QUERY_CLIENT_CONFIG and build the client from it**<!-- /forge:piece -->
   <!-- forge:editable-summary p1 -->
   In queryClient.ts add an exported typed QUERY_CLIENT_CONFIG const and build the existing queryClient from it with no inline literals; add a vitest test asserting the values and default options.
   <!-- /forge:editable-summary -->
   <!-- forge:status p1 -->`pending`<!-- /forge:status -->

<!-- forge:order-end -->

---

_Rendered by [Forge](https://github.com/anthropics/forge) from
`manifest.json`. Edit a piece summary or reorder the list between the
`forge:order-start` / `forge:order-end` markers above, then run
`forge reconcile queryclient-config` to import the change._
