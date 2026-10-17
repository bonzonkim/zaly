import { describe, expect, test } from "vitest"
import { trimCast } from "../demo/cast.ts"

const header = {
  env: { SHELL: "/private/shell" },
  height: 24,
  timestamp: 123,
  version: 2,
  width: 80,
}
const cast = (...events: [number, string, string][]) =>
  [header, ...events].map((line) => JSON.stringify(line)).join("\n")

describe("quickstart recording", () => {
  test("preserves the last TUI frame and drops shell teardown", () => {
    const result = trimCast(
      cast(
        [0, "o", "\x1b[?1049h"],
        [1, "o", "Both tests pass"],
        [5, "o", "\x1b[0m\x1b[?1049lrestored shell"],
        [6, "o", "private shell prompt"]
      )
    )
    expect(result).toContain("Both tests pass")
    expect(result).not.toContain("restored shell")
    expect(result).not.toContain("private shell prompt")
    expect(result).not.toContain("1049l")
    expect(JSON.parse(result.trim().split("\n").at(-1)!)).toEqual([5, "o", "\x1b[0m"])
  })

  test("strips host metadata and keyboard input", () => {
    const result = trimCast(cast([0, "i", "private input"], [1, "o", "Both tests pass"]))
    expect(JSON.parse(result.split("\n")[0])).toEqual({
      height: 24,
      title: "Zaly quickstart",
      version: 2,
      width: 80,
    })
    expect(result).not.toContain("private")
    expect(result).not.toContain("timestamp")
  })

  test("refuses incomplete recordings", () => {
    expect(() => trimCast(cast([1, "o", "still running"]))).toThrow("did not finish")
  })

  test("validates dimensions and event timing", () => {
    expect(() => trimCast('{"version":3,"width":80,"height":24}')).toThrow("asciicast v2")
    expect(() => trimCast(cast([2, "o", "Both tests pass"], [1, "o", "late"]))).toThrow("Invalid")
  })
})
