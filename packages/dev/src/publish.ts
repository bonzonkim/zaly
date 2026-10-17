// oxlint-disable no-await-in-loop
import type { Pkg } from "./utils.ts"

import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "pathe"
import { readManifest } from "./manifest.ts"
import { packRelease } from "./pack.ts"
import { exec, run } from "./utils.ts"

export type PublishOptions = {
  dryRun?: boolean
  otp?: string
  provenance?: boolean
  root: string
  tag?: string
}

export function isMissingVersion(output: string): boolean {
  try {
    return (JSON.parse(output) as { error?: { code?: string } }).error?.code === "E404"
  } catch {
    return false
  }
}

export async function isPublished(name: string, version: string, cwd: string): Promise<boolean> {
  const spec = `${name}@${version}`
  const { code, stdout, stderr } = await run(["npm", "view", spec, "version", "--json"], cwd)
  if (code === 0) {
    if (JSON.parse(stdout) !== version) throw new Error(`Unexpected registry version for ${spec}`)
    return true
  }
  if (isMissingVersion(stdout)) return false
  throw new Error(`Cannot check whether ${spec} is published: ${stderr || stdout}`)
}

export function publishArgs(opts: PublishOptions, tarball: string): string[] {
  const args = ["npm", "publish", tarball, "--access", "public"]
  if (opts.dryRun) args.push("--dry-run")
  if (opts.provenance) args.push("--provenance")
  if (opts.tag) args.push("--tag", opts.tag)
  if (opts.otp) args.push("--otp", opts.otp)
  return args
}

export async function publishArtifacts(dir: string, opts: PublishOptions): Promise<void> {
  dir = resolve(dir)
  const manifest = readManifest(dir)
  if (new Set(manifest.packages.map((pkg) => pkg.version)).size > 1) {
    throw new Error("Public package versions must be synchronized; merge the release PR first")
  }
  const pending = []
  // Resolve every registry lookup before publishing any package.
  for (const pkg of manifest.packages) {
    if (await isPublished(pkg.name, pkg.version, opts.root)) {
      console.log(`✓ ${pkg.name}@${pkg.version} already published, skipping`)
    } else pending.push(pkg)
  }
  console.log(
    `Pending publication (${manifest.commit}): ${pending.map((pkg) => `${pkg.name}@${pkg.version}`).join(", ") || "none"}`
  )
  for (const pkg of pending) {
    await exec(publishArgs(opts, join(dir, pkg.tarball)), opts.root)
  }
}

export async function publish(pkgs: Pkg[], opts: PublishOptions): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "zaly-publish-"))
  try {
    await packRelease(pkgs, { dir, root: opts.root })
    await publishArtifacts(dir, opts)
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}
