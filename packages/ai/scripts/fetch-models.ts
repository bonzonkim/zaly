import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"
import { downloadCatalog, ModelCatalog } from "../src/models/catalog.ts"
import { catalogReport } from "./models-report.ts"

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { report: { type: "string" } },
})
const dir = join(import.meta.dirname, "..", "assets")
const file = join(dir, "models.json")
const previous = readFileSync(file).byteLength
const prev = await ModelCatalog.load(file)
const catalog = await downloadCatalog(dir)
const report = catalogReport(prev, catalog, {
  previous,
  current: readFileSync(file).byteLength,
})
if (values.report) writeFileSync(values.report, report)
console.log(report)
