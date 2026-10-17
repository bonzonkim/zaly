import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "vitest"
import { readManifest } from "../src/manifest.ts"

test("release manifests reject invalid paths, duplicates, and empty packages", () => {
  const dir = mkdtempSync(join(tmpdir(), "zaly-manifest-test-"))
  try {
    const manifest = {
      commit: "a".repeat(40),
      packages: [{ name: "cli", version: "1.0.0", tarball: "cli.tgz" }],
    }
    const save = () => writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest))
    save()
    expect(readManifest(dir)).toEqual(manifest)
    manifest.packages[0].tarball = "../cli.tgz"
    save()
    expect(() => readManifest(dir)).toThrow("Invalid tarball path")
    manifest.packages[0].tarball = "cli.tgz"
    manifest.packages.push(manifest.packages[0])
    save()
    expect(() => readManifest(dir)).toThrow("duplicate")
    manifest.packages = []
    save()
    expect(() => readManifest(dir)).toThrow("Invalid release manifest")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
