import type { ProviderRequest } from "../provider.ts"

export const zalyUserAgent = `zaly (${process.platform} ${process.release.name}; ${process.arch})`

/** Build headers in precedence order, treating names case-insensitively. */
export function requestHeaders(
  req: ProviderRequest,
  ...overrides: RequestInit["headers"][]
): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    "User-Agent": zalyUserAgent,
  })
  const sessionHeader = req.model.provider.quirks?.sessionHeader
  // Keep existing cache-key-only callers working, independently of cache hints.
  const sessionId = req.ctx.sessionId ?? req.ctx.cacheKey
  if (sessionHeader && sessionId) headers.set(sessionHeader, sessionId)
  for (const override of overrides) {
    if (!override) continue
    for (const [name, value] of new Headers(override)) headers.set(name, value)
  }
  return headers
}
