import { readFileSync } from "node:fs"
import { basename, join } from "pathe"

export type ReleaseManifest = {
  commit: string
  packages: { name: string; version: string; tarball: string }[]
}

export function readManifest(dir: string): ReleaseManifest {
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as ReleaseManifest
  if (
    typeof manifest.commit !== "string" ||
    !Array.isArray(manifest.packages) ||
    manifest.packages.length === 0
  )
    throw new Error("Invalid release manifest")
  const names = new Set<string>()
  for (const pkg of manifest.packages) {
    if (!pkg.name || !pkg.version || names.has(pkg.name))
      throw new Error("Invalid or duplicate release package")
    names.add(pkg.name)
    if (
      typeof pkg.tarball !== "string" ||
      basename(pkg.tarball) !== pkg.tarball ||
      !pkg.tarball.endsWith(".tgz")
    )
      throw new Error(`Invalid tarball path: ${pkg.tarball}`)
  }
  return manifest
}
