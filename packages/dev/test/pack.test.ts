import type { Pkg } from "../src/utils.ts"

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "pathe"
import { afterEach, expect, test } from "vitest"
import { readManifest } from "../src/manifest.ts"
import { PACKER } from "../src/pack.ts"
import { workspace } from "../src/utils.ts"

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true })
})

function fixture(
  opts: {
    fail?: boolean
    relativeDir?: boolean
    missing?: boolean
    wrongVersion?: boolean
    extra?: boolean
    privateOnly?: boolean
    noVersion?: boolean
  } = {}
) {
  const dir = mkdtempSync(join(tmpdir(), "zaly-pack-test-"))
  dirs.push(dir)
  const out = join(dir, "artifacts")
  const log = join(dir, "commands")
  mkdirSync(out)
  writeFileSync(log, "")
  writeFileSync(
    join(dir, "npx"),
    `#!/bin/sh
printf '%s\\n' "$@" >> "$COMMAND_LOG"
if [ "$FAIL_PACK" = true ]; then
  echo 'packing failed' >&2
  exit 1
fi
printf '%s\\n' "$PACK_SUMMARY"
`,
    { mode: 0o755 }
  )
  const packages = [
    { name: "@test/a", json: { version: opts.noVersion ? undefined : "1.0.0" } },
    { name: "@test/b", json: { version: "1.0.0" } },
    { name: "@test/private", json: { private: true, version: "0.0.0" } },
  ] as Pkg[]
  const summary = ["b", "a"].map((name) => ({
    name: `@test/${name}`,
    version: opts.wrongVersion ? "2.0.0" : "1.0.0",
    filename: join(out, `${name}.tgz`),
  }))
  if (opts.missing) summary.pop()
  if (opts.extra)
    summary.push({ name: "@test/extra", version: "1.0.0", filename: join(out, "extra.tgz") })
  const result = spawnSync(
    "bun",
    [
      "-e",
      `import { packRelease } from ${JSON.stringify(join(workspace, "packages/dev/src/pack.ts"))}; await packRelease(${JSON.stringify(opts.privateOnly ? packages.slice(2) : packages)}, { dir: ${JSON.stringify(opts.relativeDir ? relative(tmpdir(), out) : out)}, root: ${JSON.stringify(workspace)} });`,
    ],
    {
      cwd: tmpdir(),
      encoding: "utf8",
      timeout: 15_000,
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        COMMAND_LOG: log,
        FAIL_PACK: String(opts.fail),
        PACK_SUMMARY: JSON.stringify(summary),
      },
    }
  )
  return { ...result, out, args: readFileSync(log, "utf8").trim().split("\n").filter(Boolean) }
}

test("one recursive invocation selects only public packages and preserves manifest dependency order", () => {
  const result = fixture()
  expect(result.status).toBe(0)
  expect(result.args).toEqual([
    "--yes",
    PACKER,
    "--recursive",
    "--filter",
    "@test/a",
    "--filter",
    "@test/b",
    "pack",
    "--pack-destination",
    result.out,
    "--json",
  ])
  const manifest = readManifest(result.out)
  expect(manifest.commit).toMatch(/^[\da-f]{40}$/)
  expect(manifest.packages).toEqual([
    { name: "@test/a", version: "1.0.0", tarball: "a.tgz" },
    { name: "@test/b", version: "1.0.0", tarball: "b.tgz" },
  ])
})

test("relative artifact directories are resolved before invoking pnpm from the workspace", () => {
  const result = fixture({ relativeDir: true })
  expect(result.status).toBe(0)
  expect(result.args).toContain(result.out)
  expect(readManifest(result.out).packages).toHaveLength(2)
})

test.each([
  [{ fail: true }, "packing failed"],
  [{ missing: true }, "Unexpected number"],
  [{ extra: true }, "Unexpected number"],
  [{ wrongVersion: true }, "Missing packed package"],
  [{ privateOnly: true }, "No publishable packages"],
  [{ noVersion: true }, "Missing version"],
] as const)("failed or mismatched packing does not write a manifest (%j)", (opts, error) => {
  const result = fixture(opts)
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain(error)
  expect(existsSync(join(result.out, "manifest.json"))).toBe(false)
})
