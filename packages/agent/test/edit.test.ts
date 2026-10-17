import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "pathe"
import { afterEach, beforeEach, expect, test } from "vitest"
import { editTool } from "../src/tools/edit.ts"

let dir: string
let path: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zaly-edit-test-"))
  path = join(dir, "file.txt")
})
afterEach(() => rmSync(dir, { force: true, recursive: true }))

async function edit(edits: { oldText: string; newText: string }[]) {
  const params = await editTool.validator.validateParams({ edits, path })
  return await editTool.call(params, {})
}

test("requires a non-empty edits array", async () => {
  await expect(editTool.validator.validateParams({ edits: [], path })).rejects.toThrow()
  await expect(
    editTool.validator.validateParams({ newText: "after", oldText: "before", path })
  ).rejects.toThrow()
})

test("applies a single replacement from the edits array", async () => {
  writeFileSync(path, "before\n")
  const result = await edit([{ newText: "after", oldText: "before" }])
  expect(readFileSync(path, "utf8")).toBe("after\n")
  expect(result).toMatchObject({ edits: 1, ok: true, path })
})

test("resolves all replacements against the original file", async () => {
  writeFileSync(path, "one two\n")
  const result = await edit([
    { newText: "two", oldText: "one" },
    { newText: "three", oldText: "two" },
  ])
  expect(readFileSync(path, "utf8")).toBe("two three\n")
  expect(result).toMatchObject({ edits: 2 })
})

test("a failed replacement leaves the file untouched and reports its array index", async () => {
  writeFileSync(path, "one two\n")
  await expect(
    edit([
      { newText: "changed", oldText: "one" },
      { newText: "changed", oldText: "missing" },
    ])
  ).rejects.toMatchObject({ code: "NOT_FOUND", data: { editIndex: 1 } })
  expect(readFileSync(path, "utf8")).toBe("one two\n")
})

test("overlapping edits leave the file untouched", async () => {
  writeFileSync(path, "one two\n")
  await expect(
    edit([
      { newText: "changed", oldText: "one two" },
      { newText: "changed", oldText: "two" },
    ])
  ).rejects.toMatchObject({ code: "OVERLAP" })
  expect(readFileSync(path, "utf8")).toBe("one two\n")
})

test("preserves CRLF line endings", async () => {
  writeFileSync(path, "one\r\ntwo\r\n")
  await edit([{ newText: "three\nfour", oldText: "one\ntwo" }])
  expect(readFileSync(path, "utf8")).toBe("three\r\nfour\r\n")
})
