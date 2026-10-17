import { readFile, writeFile } from "node:fs/promises"

/** Keep the final TUI frame instead of the shell restored on exit. */
export function trimCast(content: string): string {
  const [first, ...lines] = content.trim().split("\n")
  const header = JSON.parse(first) as { version: number; width: number; height: number }
  if (header.version !== 2 || !(header.width > 0) || !(header.height > 0)) {
    throw new Error("Expected an asciicast v2 recording with terminal dimensions")
  }
  const output = [
    JSON.stringify({
      height: header.height,
      title: "Zaly quickstart",
      version: 2,
      width: header.width,
    }),
  ]
  let screen = ""
  let previous = 0
  for (const line of lines) {
    const event = JSON.parse(line) as [number, string, string]
    const [time, type, data] = event
    if (!Number.isFinite(time) || time < previous || typeof data !== "string") {
      throw new Error("Invalid asciicast event")
    }
    previous = time
    if (type !== "o") continue
    const exit = data.indexOf("\x1b[?1049l")
    const text = exit === -1 ? data : data.slice(0, exit)
    output.push(JSON.stringify([time, type, text]))
    screen += text
    if (exit !== -1) break
  }
  if (!screen.includes("Both tests pass"))
    throw new Error("The quickstart did not finish successfully")
  return `${output.join("\n")}\n`
}

if (import.meta.main) {
  const [input, output] = process.argv.slice(2)
  if (!input || !output) throw new Error("Usage: bun cast.ts <input.cast> <output.cast>")
  await writeFile(output, trimCast(await readFile(input, "utf8")))
}
