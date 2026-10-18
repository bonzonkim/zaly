import type { Content } from "@zaly/ai"

import { justText } from "@zaly/ai"
import { find as findFiles } from "@zaly/shared/find"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "pathe"
import { afterEach, beforeEach, expect, test } from "vitest"
import { findTool } from "../src/tools/find.ts"

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zaly-find-test-"))
  execFileSync("git", ["init", "-q", dir])
  mkdirSync(join(dir, ".github"))
  mkdirSync(join(dir, "src"))
  mkdirSync(join(dir, "node_modules"))
  writeFileSync(join(dir, ".gitignore"), "ignored.txt\n")
  writeFileSync(join(dir, ".github", "config.yml"), "")
  writeFileSync(join(dir, "src", "main.ts"), "")
  writeFileSync(join(dir, "ignored.txt"), "")
  writeFileSync(join(dir, "node_modules", "dependency.js"), "")
  for (const file of [
    "packages/config/src/schemas/tpl/models.ts",
    "packages/ai/test/catalog.test.ts",
    "packages/dev/test/smoke.test.ts",
    "packages/dev/test/pack.test.ts",
  ]) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), "")
  }
})
afterEach(() => rmSync(dir, { force: true, recursive: true }))

async function find(args: Record<string, unknown> = {}) {
  const params = await findTool.validator.validateParams(args)
  const text = justText((await findTool.call(params, { cwd: dir })) as Content)
  return text.trim().split("\n")
}

test("exposes only the five file-discovery parameters", () => {
  const schema = findTool.params as unknown as { properties: Record<string, unknown> }
  expect(Object.keys(schema.properties)).toEqual(["glob", "paths", "hidden", "ignore", "limit"])
})

test("includes hidden files while respecting ignore files and default exclusions", async () => {
  const files = await find()
  expect(files).toContain(".github/config.yml")
  expect(files).toContain(".gitignore")
  expect(files).toContain("src/main.ts")
  expect(files).not.toContain("ignored.txt")
  expect(files.some((file) => file.startsWith(".git/"))).toBe(false)
  expect(files.some((file) => file.startsWith("node_modules/"))).toBe(false)
})

test("glob fallback returns ignore files while respecting their rules", async () => {
  const batches = await Array.fromAsync(findFiles({ backend: "glob", cwd: dir, hidden: true }))
  const files = batches.flat()
  expect(files).toContain(".gitignore")
  expect(files).toContain(".github/config.yml")
  expect(files).not.toContain("ignored.txt")
  expect(files.some((file) => file.startsWith(".git/"))).toBe(false)
})

test("can hide dotfiles explicitly", async () => {
  const files = await find({ hidden: false })
  expect(files).toContain("src/main.ts")
  expect(files.some((file) => file.startsWith("."))).toBe(false)
})

test("can include ignored files without dropping default exclusions", async () => {
  const files = await find({ ignore: false })
  expect(files).toContain("ignored.txt")
  expect(files.some((file) => file.startsWith(".git/"))).toBe(false)
  expect(files.some((file) => file.startsWith("node_modules/"))).toBe(false)
})

test("supports absolute search paths and filename globs", async () => {
  const files = await find({ glob: "*.ts", paths: [join(dir, "src")] })
  expect(files).toHaveLength(1)
  expect(files[0]).toMatch(/(?:^|\/)main\.ts$/)
})

test("supports arrays mixing recursive path and filename globs", async () => {
  const files = await find({
    glob: ["**/schemas/tpl/**", "*catalog*.test.ts", "**/*smoke*.test.ts", "**/*pack*.test.ts"],
  })
  expect(files.toSorted()).toEqual([
    "packages/ai/test/catalog.test.ts",
    "packages/config/src/schemas/tpl/models.ts",
    "packages/dev/test/pack.test.ts",
    "packages/dev/test/smoke.test.ts",
  ])
})

test("allows explicitly targeting an otherwise excluded directory", async () => {
  const files = await find({ paths: ["node_modules"] })
  expect(files).toContain("node_modules/dependency.js")
})
