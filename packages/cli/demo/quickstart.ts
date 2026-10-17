import type { Provider, StreamEvent } from "@zaly/ai"

import { rmSync } from "node:fs"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "pathe"
// oxlint-disable-next-line no-restricted-imports -- Recording-only adapter registration has no public export.
import { providerRegistry } from "../../ai/src/providers/registry.ts"

const root = await mkdtemp(join(tmpdir(), "zaly-demo-"))
process.on("exit", () => rmSync(root, { force: true, recursive: true }))
const cwd = join(root, "hello-zaly")
await mkdir(cwd)

// Isolate config, credentials, plugins, and session history from the recording host.
for (const key of ["CONFIG", "DATA", "CACHE", "STATE", "LOG", "TMP"]) {
  process.env[`ZALY_${key}`] = join(root, key.toLowerCase())
}
process.env.HOME = root
process.chdir(cwd)

await writeFile(
  join(cwd, "price.ts"),
  `export function total(price: number, quantity: number) {
  return price + quantity
}
`
)
await writeFile(
  join(cwd, "price.test.ts"),
  `import { expect, test } from "vitest"
import { total } from "./price.ts"

test("total multiplies price by quantity", () => {
  expect(total(12, 3)).toBe(36)
})

test("an empty order costs nothing", () => {
  expect(total(12, 0)).toBe(0)
})
`
)

// Script only the model's choices. The CLI, tools, edits, and tests are real.
const turns: StreamEvent[][] = [
  [
    { delta: "I'll read the implementation and its tests first.", type: "text-delta" },
    { id: "read-price", name: "read", params: { path: "price.ts" }, type: "tool-call" },
    { id: "read-tests", name: "read", params: { path: "price.test.ts" }, type: "tool-call" },
  ],
  [
    { delta: "The total adds instead of multiplying. I'll fix that one line.", type: "text-delta" },
    {
      id: "fix-price",
      name: "edit",
      params: {
        edits: [{ newText: "return price * quantity", oldText: "return price + quantity" }],
        path: "price.ts",
      },
      type: "tool-call",
    },
  ],
  [{ id: "run-tests", name: "bash", params: { command: "bun test" }, type: "tool-call" }],
  [
    {
      delta:
        "Fixed `total()` in **price.ts**: price × quantity.\n\n**Both tests pass**, including the empty-order case.",
      type: "text-delta",
    },
  ],
]

let turn = 0
const provider: Provider = {
  id: "demo",
  async *stream({ ctx, opts }) {
    for (const message of ctx.messages) {
      if (message.role !== "tool") continue
      for (const result of message.content) {
        if (result.isError) throw new Error(`Demo tool failed: ${result.name}`)
        if (result.name === "bash") {
          const meta = Array.isArray(result.content)
            ? result.content.find((part) => part.type === "meta" && part.tag === "bash")
            : undefined
          const data = meta?.type === "meta" ? (meta.data as { code?: number }) : undefined
          if (data?.code !== 0) throw new Error("The demo tests did not pass")
        }
      }
    }
    const events = turns.at(turn++)
    if (!events) throw new Error("The quickstart demo has no more scripted responses")
    await new Promise((resolve) => setTimeout(resolve, 900))
    for (const event of events) {
      opts.signal?.throwIfAborted()
      if (event.type === "text-delta") {
        for (const word of event.delta.split(/(?<=\s)/)) {
          yield { delta: word, type: "text-delta" }
          await new Promise((resolve) => setTimeout(resolve, 45))
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300))
        yield event
      }
    }
    yield {
      finishReason: events.some((event) => event.type === "tool-call") ? "tool-calls" : "stop",
      type: "finish",
      usage: { input: 0, output: 0 },
    }
  },
}
providerRegistry.register("demo", async () => provider)

await mkdir(process.env.ZALY_CONFIG!, { recursive: true })
await writeFile(
  join(process.env.ZALY_CONFIG!, "models.json"),
  JSON.stringify({
    demo: {
      api: "demo",
      models: [
        { contextSize: 128_000, id: "quickstart", maxTokens: 4096, name: "Quickstart (scripted)" },
      ],
      name: "Scripted demo",
    },
  })
)

const { main } = await import("@zaly/cli/main")
await main([
  "--new",
  "--model",
  "demo/quickstart",
  "--theme",
  "tokyonight-night",
  ...process.argv.slice(2),
])
