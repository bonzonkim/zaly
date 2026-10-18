import type { Provider, ProviderRequest } from "../../src/provider.ts"
import type { ProviderOptions } from "../../src/types.ts"

import { describe, expect, test } from "vitest"
import { getModel } from "../../src/models/catalog.ts"
import { builtinOverrides } from "../../src/models/overrides.ts"
import { createAnthropic } from "../../src/providers/anthropic.ts"
import { createOpenAIResponses } from "../../src/providers/openai-responses.ts"
import { createOpenAI } from "../../src/providers/openai.ts"
import { requestHeaders } from "../../src/utils/headers.ts"
import { recordFetch, sseResponse, streamReq } from "../helpers/sse.ts"

const adapters: [string, (opts: ProviderOptions) => Provider][] = [
  ["OpenAI", createOpenAI],
  ["Responses", createOpenAIResponses],
  ["Anthropic", createAnthropic],
]

function request(): ProviderRequest {
  const req = streamReq({ model: "test", messages: [{ content: "hello", role: "user" }] })
  req.ctx.sessionId = "session-123"
  return req
}

async function drain(provider: Provider, req: ProviderRequest) {
  for await (const _ of provider.stream(req)) {
    // Consume the stream so the adapter sends its request.
  }
}

describe.each(adapters)("%s request headers", (_, create) => {
  test("sends the client user agent without leaking provider session headers", async () => {
    const { fetch, recorded } = recordFetch(() => sseResponse([]))
    await drain(create({ apiKey: "test", fetch }), request())
    expect(recorded[0].headers["user-agent"]).toMatch(/^zaly\b/)
    expect(recorded[0].headers["x-opencode-session"]).toBeUndefined()
    expect(recorded[0].headers["session-id"]).toBeUndefined()
    expect(recorded[0].headers["content-type"]).toBe("application/json")
    if (create === createAnthropic) {
      expect(recorded[0].headers["x-api-key"]).toBe("test")
      expect(recorded[0].headers["anthropic-version"]).toBe("2023-06-01")
    } else {
      expect(recorded[0].headers.authorization).toBe("Bearer test")
    }
  })

  test("keeps OpenCode Go session identity across turns with caching disabled", async () => {
    const { fetch, recorded } = recordFetch(() => sseResponse([]))
    const provider = create({ apiKey: "test", fetch })
    const req = request()
    req.ctx.cacheKey = "different-cache-key"
    req.model.provider.quirks = builtinOverrides["opencode-go"]?.quirks
    await drain(provider, req)
    req.ctx.messages.push({ content: "next turn", role: "user" })
    await drain(provider, req)
    expect(recorded.map((r) => r.headers["x-opencode-session"])).toEqual([
      "session-123",
      "session-123",
    ])
    const body = recorded[0].body as Record<string, unknown>
    expect(body).not.toHaveProperty("prompt_cache_key")
    expect(JSON.stringify(body)).not.toContain("cache_control")
  })

  test("omits session headers when conversation identity is unavailable", async () => {
    const { fetch, recorded } = recordFetch(() => sseResponse([]))
    const req = request()
    delete req.ctx.sessionId
    req.model.provider.quirks = builtinOverrides["opencode-go"]?.quirks
    await drain(create({ apiKey: "test", fetch }), req)
    expect(recorded[0].headers["x-opencode-session"]).toBeUndefined()
  })

  test("preserves explicit auth and config header overrides case-insensitively", async () => {
    const { fetch, recorded } = recordFetch(() => sseResponse([]))
    const req = request()
    req.model.provider.quirks = builtinOverrides["opencode-go"]?.quirks
    await drain(
      create({
        apiKey: {
          headers: { "USER-AGENT": "auth-client", "X-OpenCode-Session": "auth-session" },
          key: "test",
          source: "model",
        },
        fetch,
        headers: { "user-agent": "custom-client", "x-opencode-session": "custom-session" },
      }),
      req
    )
    expect(recorded[0].headers["user-agent"]).toBe("custom-client")
    expect(recorded[0].headers["x-opencode-session"]).toBe("custom-session")
    expect(recorded[0].headers["content-type"]).toBe("application/json")
  })
})

test("session headers fall back to cache identity for existing callers", () => {
  const req = request()
  delete req.ctx.sessionId
  req.ctx.cacheKey = "legacy-session"
  req.model.provider.quirks = { sessionHeader: "session-id" }
  expect(requestHeaders(req).get("session-id")).toBe("legacy-session")
})

test("the catalog enables session headers only for the appropriate providers", async () => {
  const go = await getModel("opencode-go/muse-spark-1.3-contributor")
  expect(go?.provider.quirks?.sessionHeader).toBe("x-opencode-session")
  expect(builtinOverrides["openai-codex"]?.quirks?.sessionHeader).toBe("session-id")
  expect(builtinOverrides.openai?.quirks?.sessionHeader).toBeUndefined()
})
