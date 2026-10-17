import type { ModelCatalog } from "../src/models/catalog.ts"

import { formatSize } from "@zaly/shared"
import { isDeepStrictEqual } from "node:util"

type FieldChange = { path: string; before: unknown; after: unknown }
type Change = { id: string; fields: FieldChange[] }
const MAX_ROWS = 80

function code(value: string): string {
  if (value.length > 160) value = `${value.slice(0, 157)}…`
  return `\`${value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("`", "&#96;")
    .replaceAll("|", String.raw`\|`)
    .replaceAll("\n", " ")}\``
}

function display(value: unknown): string {
  if (value === undefined) return "—"
  const text = typeof value === "string" ? value : JSON.stringify(value)
  return code(text.length > 100 ? `${text.slice(0, 97)}…` : text)
}

function fields(left: unknown, right: unknown, path = ""): FieldChange[] {
  if (isDeepStrictEqual(left, right)) return []
  if (
    left &&
    right &&
    typeof left === "object" &&
    typeof right === "object" &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    const l = left as Record<string, unknown>
    const r = right as Record<string, unknown>
    return [...new Set([...Object.keys(l), ...Object.keys(r)])]
      .toSorted()
      .flatMap((key) => fields(l[key], r[key], path ? `${path}.${key}` : key))
  }
  return [{ path, before: left, after: right }]
}

function models(catalog: ModelCatalog): Map<string, unknown> {
  const ret = new Map<string, unknown>()
  for (const [pid, provider] of Object.entries(catalog.$)) {
    if (!provider || !catalog.provider(pid)) continue
    for (const [mid, model] of Object.entries(provider.models)) ret.set(`${pid}/${mid}`, model)
  }
  return ret
}

function diff(left: Map<string, unknown>, right: Map<string, unknown>) {
  const added: string[] = []
  const removed: string[] = []
  const changed: Change[] = []
  for (const id of [...new Set([...left.keys(), ...right.keys()])].toSorted()) {
    if (!left.has(id)) added.push(id)
    else if (!right.has(id)) removed.push(id)
    else {
      const changes = fields(left.get(id), right.get(id))
      if (changes.length) changed.push({ id, fields: changes })
    }
  }
  return { added, changed, removed }
}

function details(title: string, rows: string[], expanded = false): string {
  if (!rows.length) return ""
  const shown: string[] = []
  let size = 0
  for (const row of rows) {
    size += Buffer.byteLength(row)
    if (shown.length >= MAX_ROWS || size > (expanded ? 14_000 : 3000)) break
    shown.push(row)
  }
  const extra =
    rows.length > shown.length
      ? `\n\n_${rows.length - shown.length} more entries omitted; see the catalog diff._`
      : ""
  return `\n<details>\n<summary>${title} (${rows.length})</summary>\n\n${shown.join(expanded ? "\n\n" : "\n")}${extra}\n\n</details>\n`
}

function metadata(catalog: ModelCatalog): Map<string, unknown> {
  const ret = new Map<string, unknown>()
  for (const [id, provider] of Object.entries(catalog.$)) {
    if (!provider || !catalog.provider(id)) continue
    const { models: _, ...info } = provider
    ret.set(id, info)
  }
  return ret
}

const FIELD_LABELS: Record<string, string> = {
  "cost.input": "Input cost / M tokens",
  "cost.output": "Output cost / M tokens",
  "cost.cache_read": "Cache read / M tokens",
  "cost.cache_write": "Cache write / M tokens",
  "cost.reasoning": "Reasoning cost / M tokens",
  "limit.context": "Context limit",
  "limit.input": "Input limit",
  "limit.output": "Output limit",
  "modalities.input": "Input modalities",
  "modalities.output": "Output modalities",
  reasoning: "Reasoning",
  tool_call: "Tool calling",
  structured_output: "Structured output",
  attachment: "Attachments",
  temperature: "Temperature support",
  interleaved: "Interleaved reasoning",
  open_weights: "Open weights",
  name: "Name",
  family: "Family",
  canonical_model_id: "Canonical model ID",
  knowledge: "Knowledge cutoff",
  release_date: "Release date",
  last_updated: "Last updated",
  api: "API URL",
  npm: "Adapter",
  env: "Credential environment variables",
}
const FIELD_ORDER = new Map(Object.keys(FIELD_LABELS).map((path, index) => [path, index]))
const CAPABILITIES = new Set([
  "reasoning",
  "tool_call",
  "structured_output",
  "attachment",
  "temperature",
  "interleaved",
  "open_weights",
])

function priority(path: string): number {
  if (path.startsWith("cost.")) return 0
  if (path.startsWith("limit.")) return 1
  if (path.startsWith("modalities.")) return 2
  if (CAPABILITIES.has(path)) return 3
  return 4
}

function changeRows(items: Change[]): string[] {
  return items.map(({ id, fields: changes }) => {
    const ordered = changes.toSorted(
      (a, b) =>
        priority(a.path) - priority(b.path) ||
        (FIELD_ORDER.get(a.path) ?? FIELD_ORDER.size) -
          (FIELD_ORDER.get(b.path) ?? FIELD_ORDER.size) ||
        a.path.localeCompare(b.path)
    )
    return [
      `### ${code(id)}`,
      "",
      "| Field | Before | After |",
      "|---|---|---|",
      ...ordered.map(
        ({ path, before, after }) =>
          `| ${FIELD_LABELS[path] ?? code(path)} | ${display(before)} | ${display(after)} |`
      ),
    ].join("\n")
  })
}

export function catalogReport(
  prev: ModelCatalog,
  next: ModelCatalog,
  sizes: { previous: number; current: number }
): string {
  const changes = diff(models(prev), models(next))
  const providers = diff(metadata(prev), metadata(next))
  const adapters = new Map<string, { total: number; supported: number }>()
  for (const [id, provider] of Object.entries(next.$)) {
    if (!provider) continue
    const counts = adapters.get(provider.npm) ?? { total: 0, supported: 0 }
    counts.total++
    if (next.provider(id)) counts.supported++
    adapters.set(provider.npm, counts)
  }
  const delta = sizes.current - sizes.previous
  const providerCount = Object.keys(next.$).filter((id) => next.provider(id)).length
  return `${[
    "## Catalog changes",
    "",
    `**${changes.added.length} added · ${changes.removed.length} removed · ${changes.changed.length} changed**`,
    details(
      "Added models",
      changes.added.map((id) => `- ${code(id)}`)
    ),
    details(
      "Removed models",
      changes.removed.map((id) => `- ${code(id)}`)
    ),
    details("Changed models", changeRows(changes.changed), true),
    details(
      "Added providers",
      providers.added.map((id) => `- ${code(id)}`)
    ),
    details(
      "Removed providers",
      providers.removed.map((id) => `- ${code(id)}`)
    ),
    details("Changed provider configuration", changeRows(providers.changed), true),
    "## Adapter coverage",
    "",
    "| Adapter | Providers | Supported providers |",
    "|---|---:|---:|",
    ...[...adapters]
      .toSorted(([a, left], [b, right]) => right.total - left.total || a.localeCompare(b))
      .slice(0, MAX_ROWS)
      .map(([adapter, counts]) => `| ${code(adapter)} | ${counts.total} | ${counts.supported} |`),
    "",
    `Bundled catalog: **${providerCount} providers · ${models(next).size} models · ${formatSize(sizes.current)}** (${delta >= 0 ? "+" : "−"}${formatSize(Math.abs(delta))}).`,
    "",
    "This PR is refreshed every 6 hours against main's bundled snapshot. Review and squash-merge when useful. Releases use the checked-in catalog; publishing never fetches a new one.",
    "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")}\n`
}
