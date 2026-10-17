import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "pathe"
import { afterEach, expect, test } from "vitest"
import { isMissingVersion } from "../src/publish.ts"
import { workspace } from "../src/utils.ts"

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true })
})

function fixture(fail = false, dryRun = false, relativeDirectory = false, mixedVersions = false) {
  const dir = mkdtempSync(join(tmpdir(), "zaly-publish-test-"))
  dirs.push(dir)
  const log = join(dir, "commands")
  writeFileSync(log, "")
  writeFileSync(
    join(dir, "npm"),
    `#!/bin/sh
printf '%s\\n' "$*" >> "$COMMAND_LOG"
if [ "$1" = view ]; then
  case "$2" in
    '@test/published@1.0.0') printf '"1.0.0"'; exit 0 ;;
    '@test/second@1.0.0')
      if [ "$FAIL_LOOKUP" = true ]; then
        printf '{"error":{"code":"E401"}}'; exit 1
      fi ;;
  esac
  printf '{"error":{"code":"E404"}}'; exit 1
fi
`,
    { mode: 0o755 }
  )
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({
      commit: "a".repeat(40),
      packages: ["published", "first", "second"].map((name) => ({
        name: `@test/${name}`,
        version: mixedVersions && name === "second" ? "2.0.0" : "1.0.0",
        tarball: `${name}.tgz`,
      })),
    })
  )
  const result = spawnSync(
    "bun",
    [
      "-e",
      `import { publishArtifacts } from ${JSON.stringify(join(workspace, "packages/dev/src/publish.ts"))}; await publishArtifacts(${JSON.stringify(relativeDirectory ? relative(tmpdir(), dir) : dir)}, { root: ${JSON.stringify(dir)}, dryRun: ${dryRun} });`,
    ],
    {
      cwd: tmpdir(),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        COMMAND_LOG: log,
        FAIL_LOOKUP: String(fail),
      },
      timeout: 15_000,
    }
  )
  return { ...result, dir, commands: readFileSync(log, "utf8").trim().split("\n").filter(Boolean) }
}

test("publication preflights every package and skips published versions", () => {
  const result = fixture()
  expect(result.status).toBe(0)
  expect(result.commands.slice(0, 3).every((command) => command.startsWith("view "))).toBe(true)
  expect(result.commands.slice(3)).toHaveLength(2)
  expect(result.commands[3]).toContain("first.tgz --access public")
  expect(result.commands[4]).toContain("second.tgz --access public")
})

test("unsynchronized artifacts fail before registry lookups or publication", () => {
  const result = fixture(false, false, false, true)
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain("Public package versions must be synchronized")
  expect(result.commands).toEqual([])
})

test("relative artifact directories produce absolute npm file arguments", () => {
  const result = fixture(false, false, true)
  expect(result.status).toBe(0)
  expect(result.commands[3]).toBe(`publish ${join(result.dir, "first.tgz")} --access public`)
  expect(result.commands[4]).toBe(`publish ${join(result.dir, "second.tgz")} --access public`)
})

test("registry failures stop publication before any package is published", () => {
  const result = fixture(true)
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain("Cannot check whether @test/second@1.0.0 is published")
  expect(result.commands.every((command) => command.startsWith("view "))).toBe(true)
})

test("dry-run uses the same unpublished-package set", () => {
  const result = fixture(false, true)
  expect(result.status).toBe(0)
  expect(result.commands.slice(3)).toHaveLength(2)
  expect(result.commands.slice(3).every((command) => command.endsWith("--dry-run"))).toBe(true)
})

test("only structured E404 means a version is unpublished", () => {
  expect(isMissingVersion('{"error":{"code":"E404"}}')).toBe(true)
  expect(isMissingVersion('{"error":{"code":"E401"}}')).toBe(false)
  expect(isMissingVersion('{"error":{"code":"ECONNRESET"}}')).toBe(false)
  expect(isMissingVersion("network failure mentioning E404")).toBe(false)
})
