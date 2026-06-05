import { describe, expect, it } from "vitest"
import { QUERY_CLIENT_CONFIG, queryClient } from "./queryClient"

describe("QUERY_CLIENT_CONFIG", () => {
  it("has the expected field values", () => {
    expect(QUERY_CLIENT_CONFIG.queryRetry).toBe(1)
    expect(QUERY_CLIENT_CONFIG.refetchOnWindowFocus).toBe(false)
    expect(QUERY_CLIENT_CONFIG.staleTimeMs).toBe(5 * 60 * 1000)
    expect(QUERY_CLIENT_CONFIG.gcTimeMs).toBe(10 * 60 * 1000)
    expect(QUERY_CLIENT_CONFIG.mutationRetry).toBe(0)
  })
})

describe("queryClient default options", () => {
  it("reflects QUERY_CLIENT_CONFIG", () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(QUERY_CLIENT_CONFIG.queryRetry)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(
      QUERY_CLIENT_CONFIG.refetchOnWindowFocus,
    )
    expect(defaults.queries?.staleTime).toBe(QUERY_CLIENT_CONFIG.staleTimeMs)
    expect(defaults.queries?.gcTime).toBe(QUERY_CLIENT_CONFIG.gcTimeMs)
    expect(defaults.mutations?.retry).toBe(QUERY_CLIENT_CONFIG.mutationRetry)
  })
})
