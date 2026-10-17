import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { installedRelease } from "./helpers/packed.ts"

const directory = process.env.RELEASE_ARTIFACTS
let app: Awaited<ReturnType<typeof installedRelease>> | undefined

beforeAll(async () => {
  if (directory) app = await installedRelease(resolve(directory))
}, 120_000)

afterAll(() => app?.dispose())

for (const runtime of ["node", "bun"]) {
  test.skipIf(!directory)(
    `installed release works under ${runtime}`,
    () => {
      if (!app) throw new Error("Packed release test setup failed")
      const output = execFileSync(runtime, ["smoke.mjs"], {
        cwd: app.cwd,
        encoding: "utf8",
        timeout: 60_000,
        env: { ...process.env, FORCE_COLOR: "1" },
      })
      expect(output).toContain(
        "packed exports, catalog, theme, Shiki worker, and CLI version passed"
      )
    },
    70_000
  )
}
