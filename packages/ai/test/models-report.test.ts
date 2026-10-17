import type { CatalogModel } from "../src/models/catalog.ts"

import { expect, test } from "vitest"
import { catalogReport } from "../scripts/models-report.ts"
import { ModelCatalog } from "../src/models/catalog.ts"

function model(id: string, context = 128_000): CatalogModel {
  return {
    id,
    name: id,
    tool_call: true,
    modalities: { input: ["text"], output: ["text"] },
    limit: { context, output: 4096 },
  }
}

async function catalog(models: CatalogModel[], opts: { url?: string; unsupported?: boolean } = {}) {
  return await ModelCatalog.load({
    example: {
      id: "example",
      name: "Example",
      npm: "@ai-sdk/openai-compatible",
      api: opts.url ?? "https://example.com",
      doc: "https://example.com/docs",
      models: Object.fromEntries(models.map((m) => [m.id, m])),
    },
    ...(opts.unsupported
      ? {
          unsupported: {
            id: "unsupported",
            name: "Unsupported",
            npm: "unsupported-adapter",
            doc: "https://example.com/docs",
            models: { ignored: model("ignored") },
          },
        }
      : {}),
  })
}

const sizes = { previous: 1000, current: 1100 }

test("adapters sort by provider count descending with alphabetical ties", async () => {
  const prev = await catalog([model("existing")], { unsupported: true })
  const next = await ModelCatalog.load({
    ...prev.$,
    second: { ...prev.$.example!, id: "second" },
    third: { ...prev.$.example!, id: "third", npm: "aaa-adapter" },
  })
  const report = catalogReport(prev, next, sizes)
  const supported = report.indexOf("| `@ai-sdk/openai-compatible` | 2 | 2 |")
  const aaa = report.indexOf("| `aaa-adapter` | 1 | 0 |")
  const unsupported = report.indexOf("| `unsupported-adapter` | 1 | 0 |")
  expect(supported).toBeGreaterThan(-1)
  expect(aaa).toBeGreaterThan(supported)
  expect(unsupported).toBeGreaterThan(aaa)
})

test("adding one model does not mark its siblings or provider as changed", async () => {
  const prev = await catalog([model("existing")])
  const next = await catalog([model("existing"), model("added")], { unsupported: true })
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**1 added · 0 removed · 0 changed**")
  expect(report).toContain("`example/added`")
  expect(report).not.toContain("Changed provider configuration")
  expect(report).not.toContain("unsupported/ignored")
  expect(report).toContain("| `unsupported-adapter` | 1 | 0 |")
})

test("model fields and provider metadata have separate readable changes", async () => {
  const prev = await catalog([model("changed"), model("removed")])
  const next = await catalog([model("changed", 256_000)], { url: "https://new.example.com" })
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**0 added · 1 removed · 1 changed**")
  expect(report).toContain("### `example/changed`")
  expect(report).toContain("| Field | Before | After |")
  expect(report).toContain("| Context limit | `128000` | `256000` |")
  expect(report).toContain("`example/removed`")
  expect(report).toContain("Changed provider configuration (1)")
  expect(report).toContain("https://new.example.com")
  expect(report).toContain("| Adapter | Providers | Supported providers |\n|---|---:|---:|")
})

test("changed tables prioritize runtime fields and show all metadata without quoted strings", async () => {
  const before = { ...model("changed"), cost: { input: 1, output: 2 } }
  const after = {
    ...model("changed", 256_000),
    cost: { input: 3, output: 4 },
    name: "New name",
    family: "new-family",
    knowledge: "2026-01-01",
    release_date: "2026-02-01",
    last_updated: "2026-03-01",
    reasoning: true,
  }
  const report = catalogReport(await catalog([before]), await catalog([after]), sizes)
  const price = report.indexOf("| Input cost / M tokens | `1` | `3` |")
  const context = report.indexOf("| Context limit | `128000` | `256000` |")
  const reasoning = report.indexOf("| Reasoning | — | `true` |")
  const name = report.indexOf("| Name | `changed` | `New name` |")
  expect(price).toBeGreaterThan(-1)
  expect(context).toBeGreaterThan(price)
  expect(reasoning).toBeGreaterThan(context)
  expect(name).toBeGreaterThan(reasoning)
  expect(report).toContain("| Last updated | — | `2026-03-01` |")
  expect(report).not.toContain("other fields")
  expect(report).not.toContain('"New name"')
})

test("large changed reports omit complete entries rather than cutting table fields", async () => {
  const before = Array.from({ length: 1000 }, (_, i) => model(`changed-${i}`))
  const after = before.map((m) => ({
    ...m,
    limit: { context: 256_000, output: 8192 },
    name: "New name",
  }))
  const report = catalogReport(await catalog(before), await catalog(after), sizes)
  const tables = report.match(/\| Field \| Before \| After \|/g)?.length ?? 0
  expect(tables).toBeGreaterThan(0)
  expect(report.match(/\| Output limit \| `4096` \| `8192` \|/g)).toHaveLength(tables)
  expect(report.match(/\| Name \|/g)).toHaveLength(tables)
  expect(report).toContain("entries omitted")
  expect(Buffer.byteLength(report)).toBeLessThan(60_000)
})

test("identical catalogs produce an explicit zero-change summary", async () => {
  const cat = await catalog([model("existing")])
  const report = catalogReport(cat, cat, sizes)
  expect(report).toContain("**0 added · 0 removed · 0 changed**")
  expect(report).toContain("1 providers · 1 models")
  expect(report).not.toContain("<details>")
})

test("large changes are truncated to keep the PR body within GitHub limits", async () => {
  const prev = await catalog([])
  const next = await catalog(Array.from({ length: 2000 }, (_, i) => model(`model-${i}`)))
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**2000 added · 0 removed · 0 changed**")
  expect(report).toContain("entries omitted")
  expect(Buffer.byteLength(report)).toBeLessThan(60_000)
})
