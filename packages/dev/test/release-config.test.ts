import { readFileSync } from "node:fs"
import { join, relative } from "pathe"
import { expect, test } from "vitest"
import { allPkgs, workspace } from "../src/utils.ts"

type ReleaseConfig = {
  "include-component-in-tag": boolean
  "include-v-in-tag": boolean
  "separate-pull-requests": boolean
  "bootstrap-sha"?: string
  packages: Record<
    string,
    {
      "skip-changelog"?: boolean
      "skip-github-release"?: boolean
      "extra-files": { type: string; path: string; jsonpath: string }[]
    }
  >
  plugins?: unknown[]
}

const config = JSON.parse(
  readFileSync(join(workspace, ".github/release-please-config.json"), "utf8")
) as ReleaseConfig
const manifest = JSON.parse(
  readFileSync(join(workspace, ".github/release-please-manifest.json"), "utf8")
) as Record<string, string>
const root = JSON.parse(readFileSync(join(workspace, "package.json"), "utf8")) as {
  version: string
}

async function publicPackages() {
  const packages = await allPkgs()
  return packages.filter((pkg) => !pkg.json.private)
}

test("all public package versions match the root release manifest", async () => {
  const packages = await publicPackages()
  expect(packages).toHaveLength(7)
  expect(root.version).toBe(manifest["."])
  for (const pkg of packages) expect(pkg.json.version).toBe(root.version)
})

test("one root component creates the release and changelog with bare version tags", () => {
  expect(Object.keys(config.packages)).toEqual(["."])
  expect(Object.keys(manifest)).toEqual(["."])
  expect(config["include-component-in-tag"]).toBe(false)
  expect(config["include-v-in-tag"]).toBe(true)
  // The merge plugin drops the branch component needed to recognize a bare-tag Node release PR.
  expect(config["separate-pull-requests"]).toBe(true)
  expect(config.plugins ?? []).toEqual([])
  expect(config.packages["."]["skip-changelog"]).not.toBe(true)
  expect(config.packages["."]["skip-github-release"]).not.toBe(true)
})

test("root extra-files updates only the version of every public package", async () => {
  const packages = await publicPackages()
  expect(
    config.packages["."]["extra-files"].toSorted((a, b) => a.path.localeCompare(b.path))
  ).toEqual(
    packages
      .map((pkg) => ({
        type: "json",
        path: relative(workspace, join(pkg.dir, "package.json")),
        jsonpath: "$.version",
      }))
      .toSorted((a, b) => a.path.localeCompare(b.path))
  )
})

test("optional bootstrap starts after the final component-prefixed release", () => {
  if (config["bootstrap-sha"]) {
    expect(config["bootstrap-sha"]).toBe("297a711069ff4afecc7783ae4cd463391effa806")
  }
})
