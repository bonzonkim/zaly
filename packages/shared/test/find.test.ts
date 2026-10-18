import type { FindOptions } from "../src/find.ts"

import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative } from "pathe"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { find } from "../src/find.ts"
import { normPath } from "../src/path.ts"
import { which } from "../src/process/system.ts"

let cwd: string
const templates = [
  "packages/config/src/schemas/tpl/config.ts",
  "packages/config/src/schemas/tpl/models.ts",
]
const tests = [
  "catalog.test.ts",
  "packages/ai/test/catalog.test.ts",
  "packages/dev/test/smoke.test.ts",
  "packages/dev/test/pack.test.ts",
]

beforeAll(() => {
  cwd = mkdtempSync(join(tmpdir(), "zaly-find-"))
  execFileSync("git", ["init", "-q", cwd])
  for (const file of [
    ...templates,
    ...tests,
    "src/catalog/decoy.txt",
    "src/main.ts",
    "README.md",
    "projects/[demo],v1/src/example.txt",
  ]) {
    mkdirSync(dirname(join(cwd, file)), { recursive: true })
    writeFileSync(join(cwd, file), "")
  }
})
afterAll(() => rmSync(cwd, { force: true, recursive: true }))

const backends = [
  { backend: "fd", available: !!(which("fd") ?? which("fdfind")) },
  { backend: "rg", available: !!which("rg") },
  { backend: "glob", available: true },
] as const

describe.each(backends)("find using $backend", ({ available, backend }) => {
  async function collect(opts: FindOptions = {}) {
    const batches = await Array.fromAsync(find({ ...opts, backend, cwd }))
    return batches
      .flat()
      .map((path) => relative(cwd, normPath(cwd, path)))
      .toSorted()
  }

  test.skipIf(!available)("supports arrays of recursive path globs", async () => {
    expect(
      await collect({
        pattern: [
          "**/schemas/tpl/**",
          "**/*catalog*.test.ts",
          "**/*smoke*.test.ts",
          "**/*pack*.test.ts",
        ],
      })
    ).toEqual([...templates, ...tests].toSorted())
  })

  test.skipIf(!available)(
    "mixes filename and path globs without matching directory names",
    async () => {
      expect(await collect({ pattern: ["**/schemas/tpl/**", "*catalog*.test.ts"] })).toEqual(
        [...templates, ...tests.filter((file) => file.includes("catalog.test"))].toSorted()
      )
    }
  )

  test.skipIf(!available)("matches filename globs and substrings at any depth", async () => {
    expect(await collect({ pattern: "catalog" })).toEqual(
      tests.filter((file) => file.includes("catalog")).toSorted()
    )
    expect(await collect({ pattern: "*.test.ts" })).toEqual(tests.toSorted())
  })

  test.skipIf(!available)("matches path globs relative to the search root", async () => {
    expect(await collect({ pattern: "src/*.ts" })).toEqual(["src/main.ts"])
    expect(await collect({ pattern: "test/*.test.ts", paths: ["packages/ai"] })).toEqual([
      "packages/ai/test/catalog.test.ts",
    ])
    expect(await collect({ pattern: "test/*.test.ts", paths: [join(cwd, "packages/ai")] })).toEqual(
      ["packages/ai/test/catalog.test.ts"]
    )
  })

  test.skipIf(!available)("supports multiple search roots", async () => {
    expect(
      await collect({ pattern: "test/*.test.ts", paths: ["packages/ai", "packages/dev"] })
    ).toEqual(tests.filter((file) => file.startsWith("packages/")).toSorted())
  })

  test.skipIf(!available)("treats glob characters in search roots literally", async () => {
    const root = "projects/[demo],v1"
    expect(await collect({ pattern: ["src/*.txt", "*.missing"], paths: [root] })).toEqual([
      `${root}/src/example.txt`,
    ])
  })

  test.skipIf(!available)("returns each file once for overlapping globs", async () => {
    expect(await collect({ pattern: ["*.test.ts", "**/*catalog*.test.ts"] })).toEqual(
      tests.toSorted()
    )
  })

  test.skipIf(!available)("a match-all alternative includes every file", async () => {
    expect(await collect({ pattern: ["*", "*.test.ts"] })).toEqual(await collect())
  })

  test.skipIf(!available)("returns no matches without throwing", async () => {
    expect(await collect({ pattern: ["missing/**/*.ts", "*.missing"] })).toEqual([])
  })
})
