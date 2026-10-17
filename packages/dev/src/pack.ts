import type { ReleaseManifest } from "./manifest.ts"
import type { Pkg } from "./utils.ts"

import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { basename, resolve } from "pathe"
import { run } from "./utils.ts"

export const PACKER = "pnpm@12.3.4"

type PackedPackage = { name: string; version: string; filename: string }

export async function packRelease(pkgs: Pkg[], opts: { dir: string; root: string }): Promise<void> {
  const packages = pkgs.filter((pkg) => !pkg.json.private)
  if (packages.length === 0) throw new Error("No publishable packages matched")
  for (const pkg of packages) {
    if (!pkg.json.version) throw new Error(`Missing version for ${pkg.name}`)
  }
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: opts.root,
    encoding: "utf8",
  }).trim()
  const dir = resolve(opts.dir)
  mkdirSync(dir, { recursive: true })
  // pnpm's native launcher installation requires lifecycle scripts that bunx skips.
  const { code, stdout, stderr } = await run(
    [
      "npx",
      "--yes",
      PACKER,
      "--recursive",
      ...packages.flatMap((pkg) => ["--filter", pkg.name]),
      "pack",
      "--pack-destination",
      dir,
      "--json",
    ],
    opts.root
  )
  if (code !== 0) throw new Error(`pnpm pack failed: ${stderr || stdout}`)
  const packed = JSON.parse(stdout) as PackedPackage[]
  if (packed.length !== packages.length) throw new Error("Unexpected number of packed packages")
  const manifest: ReleaseManifest = {
    commit,
    packages: packages.map((pkg) => {
      const result = packed.find(
        (item) => item.name === pkg.name && item.version === pkg.json.version
      )
      if (!result) throw new Error(`Missing packed package: ${pkg.name}@${pkg.json.version}`)
      return { name: pkg.name, tarball: basename(result.filename), version: result.version }
    }),
  }
  writeFileSync(resolve(dir, "manifest.json"), `${JSON.stringify(manifest, undefined, 2)}\n`)
}
