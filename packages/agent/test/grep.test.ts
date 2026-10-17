import type { Content } from "@zaly/ai"

import { justText } from "@zaly/ai"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "pathe"
import { afterEach, beforeEach, expect, test } from "vitest"
import { grepTool } from "../src/tools/grep.ts"

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zaly-grep-test-"))
})
afterEach(() => rmSync(dir, { force: true, recursive: true }))

async function grep(args: Record<string, unknown>) {
  const params = await grepTool.validator.validateParams({ paths: [dir], ...args })
  return justText((await grepTool.call(params, {})) as Content)
}

test("exposes only the six basic search parameters", () => {
  const schema = grepTool.params as unknown as { properties: Record<string, unknown> }
  expect(Object.keys(schema.properties)).toEqual([
    "pattern",
    "paths",
    "glob",
    "fixed_strings",
    "context",
    "limit",
  ])
})

test("uses smart case", async () => {
  writeFileSync(join(dir, "source.txt"), "KeepMe\nkeepme\n")
  const insensitive = await grep({ pattern: "keepme" })
  expect(insensitive).toContain("KeepMe")
  expect(insensitive).toContain("keepme")
  const sensitive = await grep({ pattern: "KeepMe" })
  expect(sensitive).toContain("KeepMe")
  expect(sensitive).not.toContain("keepme")
})

test("supports literal patterns", async () => {
  writeFileSync(join(dir, "source.txt"), "a.b\naXb\n")
  const text = await grep({ fixed_strings: true, pattern: "a.b" })
  expect(text).toContain("a.b")
  expect(text).not.toContain("aXb")
})

test("narrows searches with positive and negative globs", async () => {
  writeFileSync(join(dir, "keep.rs"), "needle\n")
  writeFileSync(join(dir, "skip.rs"), "needle\n")
  writeFileSync(join(dir, "other.txt"), "needle\n")
  const text = await grep({ glob: ["*.rs", "!skip.rs"], pattern: "needle" })
  expect(text).toContain("keep.rs")
  expect(text).not.toContain("skip.rs")
  expect(text).not.toContain("other.txt")
})

test("returns surrounding context", async () => {
  writeFileSync(join(dir, "source.txt"), "before\nneedle\nafter\n")
  const text = await grep({ context: 1, pattern: "needle" })
  expect(text).toContain("before")
  expect(text).toContain("after")
})

test("reports an empty search without failing", async () => {
  writeFileSync(join(dir, "source.txt"), "unrelated\n")
  expect(await grep({ pattern: "needle" })).toBe("No matches found.")
})
