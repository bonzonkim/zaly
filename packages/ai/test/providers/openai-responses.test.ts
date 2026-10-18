import type { Content } from "../../src/types.ts"

import { expect, test } from "vitest"
import { builtinOverrides } from "../../src/models/overrides.ts"
import { createOpenAIResponses } from "../../src/providers/openai-responses.ts"
import { recordFetch, sseResponse, streamReq } from "../helpers/sse.ts"

async function toolOutput(content: Content, isError = false) {
  const { fetch, recorded } = recordFetch(sseResponse([]))
  const provider = createOpenAIResponses({ apiKey: "test", fetch })
  for await (const _ of provider.stream(
    streamReq({
      model: "test",
      messages: [
        {
          role: "tool",
          content: [{ type: "tool-result", id: "read-1", name: "read", content, isError }],
        },
      ],
    })
  )) {
    // Drain the stream to capture the serialized request.
  }
  return (recorded[0].body as { input: unknown[] }).input
}

async function cachedRequest(opts: { caching?: boolean; codex?: boolean } = {}) {
  const { fetch, recorded } = recordFetch(sseResponse([]))
  const provider = createOpenAIResponses({ apiKey: "test", fetch })
  const req = streamReq({
    caching: opts.caching,
    messages: [{ content: "hello", role: "user" }],
    model: "test",
  })
  ;(req.ctx as { cacheKey?: string }).cacheKey = "session-123"
  if (opts.codex) {
    req.model.provider.id = "openai-codex"
    req.model.provider.quirks = builtinOverrides["openai-codex"]?.quirks
  }
  for await (const _ of provider.stream(req)) {
    // Drain the stream to capture the serialized request.
  }
  return recorded[0]
}

test("Responses sends a stable prompt cache key", async () => {
  const request = await cachedRequest()
  expect(request.body).toMatchObject({ prompt_cache_key: "session-123" })
  expect(request.headers["session-id"]).toBeUndefined()
})

test("Codex supports cache-key-only callers for the session header", async () => {
  const request = await cachedRequest({ codex: true })
  expect(request.body).toMatchObject({ prompt_cache_key: "session-123" })
  expect(request.headers["session-id"]).toBe("session-123")
})

test("Codex retains session routing when cache affinity is disabled", async () => {
  const request = await cachedRequest({ caching: false, codex: true })
  expect(request.body).not.toHaveProperty("prompt_cache_key")
  expect(request.headers["session-id"]).toBe("session-123")
})

test("Responses tool results retain image and PDF attachments", async () => {
  expect(
    await toolOutput([
      { type: "text", text: "Read attachments" },
      {
        type: "image",
        mime: "image/png",
        source: { type: "url", url: "https://example.com/image.png" },
      },
      { type: "pdf", mime: "application/pdf", source: { type: "base64", data: "JVBERi0=" } },
    ])
  ).toEqual([
    {
      type: "function_call_output",
      call_id: "read-1",
      output: [
        { type: "input_text", text: "Read attachments" },
        { type: "input_image", image_url: "https://example.com/image.png" },
        {
          type: "input_file",
          filename: "document.pdf",
          file_data: "data:application/pdf;base64,JVBERi0=",
        },
      ],
    },
  ])
})

test("Responses text-only tool results preserve strings and error prefixes", async () => {
  for (const content of ["failed", [{ type: "text" as const, text: "failed" }]]) {
    expect(await toolOutput(content, true)).toEqual([
      {
        type: "function_call_output",
        call_id: "read-1",
        output: "ERROR: failed",
      },
    ])
  }
})

test("Responses attachment-bearing errors keep their error label", async () => {
  expect(
    await toolOutput(
      [
        {
          type: "image",
          mime: "image/png",
          source: { type: "url", url: "https://example.com/image.png" },
        },
      ],
      true
    )
  ).toEqual([
    {
      type: "function_call_output",
      call_id: "read-1",
      output: [
        { type: "input_text", text: "ERROR:" },
        { type: "input_image", image_url: "https://example.com/image.png" },
      ],
    },
  ])
})
