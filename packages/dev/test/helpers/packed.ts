import { execFile } from "node:child_process"
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { readManifest } from "../../src/manifest.ts"

const exec = promisify(execFile)

export async function installedRelease(dir: string): Promise<{ cwd: string; dispose: () => void }> {
  const manifest = readManifest(dir)
  const cwd = mkdtempSync(join(tmpdir(), "zaly-installed-test-"))
  const dispose = () => rmSync(cwd, { recursive: true, force: true })
  try {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "zaly-packed-test", private: true, type: "module" })
    )
    await exec(
      "npm",
      [
        "install",
        "--no-audit",
        "--no-fund",
        ...manifest.packages.map((pkg) => join(dir, pkg.tarball)),
      ],
      { cwd }
    )
    copyFileSync(
      fileURLToPath(new URL("../fixtures/packed-smoke.mjs", import.meta.url)),
      join(cwd, "smoke.mjs")
    )
    return { cwd, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
