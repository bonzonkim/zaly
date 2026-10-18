import { describe, expect, test } from "vitest"
import { signal } from "../../src/core/reactive.ts"
import { defaultTheme } from "../../src/themes/registry.ts"
import { overlay } from "../../src/widgets/overlay.ts"
import { text } from "../../src/widgets/text.ts"
import { makeHarness } from "./harness.ts"

const defaultStyle = { bg: "#f0f0f0", fg: "#101010" } as const

function colors(cell: {
  fg_r: number
  fg_g: number
  fg_b: number
  bg_r: number
  bg_g: number
  bg_b: number
}) {
  return { bg: [cell.bg_r, cell.bg_g, cell.bg_b], fg: [cell.fg_r, cell.fg_g, cell.fg_b] }
}

describe("Renderer default colors", () => {
  test("paints text and full-width blank cells without styling widget rows", async () => {
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5 })
    try {
      h.renderer.stream.append(() => text("hello"))
      await h.flush()
      expect(h.row(4)).toBe("hello")
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: [240, 240, 240], fg: [16, 16, 16] })
      expect(colors(h.term.getLine(4)![19]).bg).toEqual([240, 240, 240])
      expect(colors(h.term.getLine(0)![19]).bg).toEqual([240, 240, 240])
    } finally {
      h.dispose()
    }
  })

  test("preserves explicit child colors and restores selective and full resets", async () => {
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5 })
    try {
      h.renderer.stream.append(() =>
        text("\x1b[38;2;1;2;3mX\x1b[39mY\x1b[48;2;4;5;6mZ\x1b[49mW\x1b[0mQ")
      )
      await h.flush()
      const line = h.term.getLine(4)!
      expect(colors(line[0]).fg).toEqual([1, 2, 3])
      expect(colors(line[1]).fg).toEqual([16, 16, 16])
      expect(colors(line[2]).bg).toEqual([4, 5, 6])
      expect(colors(line[3]).bg).toEqual([240, 240, 240])
      expect(colors(line[4])).toEqual({ bg: [240, 240, 240], fg: [16, 16, 16] })
    } finally {
      h.dispose()
    }
  })

  test("colors the footer, scroll-created rows, and restored overlay content", async () => {
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5 })
    try {
      h.renderer.ui.root.add(text("footer"))
      for (let i = 0; i < 8; i++) h.renderer.stream.append(() => text(`line ${i}`))
      await h.flush()
      const modal = overlay({ x: 2, y: 2 }, text("OV", { bg: "#112233", fg: "#abcdef" }))
      h.renderer.overlay.open(() => modal)
      await h.flush()
      expect(colors(h.term.getLine(1)![1])).toEqual({ bg: [17, 34, 51], fg: [171, 205, 239] })
      h.renderer.overlay.close(modal)
      await h.flush()
      expect(h.row(4)).toBe("footer")
      for (let row = 0; row < 5; row++) {
        expect(colors(h.term.getLine(row)![19]).bg).toEqual([240, 240, 240])
      }
      expect(colors(h.term.getLine(1)![1]).bg).toEqual([240, 240, 240])
    } finally {
      h.dispose()
    }
  })

  test("repaints unchanged text and empty rows when theme defaults change", async () => {
    const h = await makeHarness({
      cols: 20,
      defaultStyle: { bg: "bg", fg: "fg" },
      rows: 5,
      theme: { ...defaultTheme, fg: "#101010", bg: "#f0f0f0" },
    })
    try {
      h.renderer.stream.append(() => text("same"))
      await h.flush()
      h.renderer.theme = { ...defaultTheme, fg: "#dddddd", bg: "#222222" }
      await h.flush()
      expect(h.row(4)).toBe("same")
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: [34, 34, 34], fg: [221, 221, 221] })
      expect(colors(h.term.getLine(0)![19]).bg).toEqual([34, 34, 34])
    } finally {
      h.dispose()
    }
  })

  test("toggles transparency without changing widget content or explicit backgrounds", async () => {
    const transparent = signal(true)
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5, transparent: transparent.get })
    try {
      h.renderer.stream.append(() => text("plain\n\x1b[48;2;17;34;51mX\x1b[49mY"))
      await h.flush()
      const terminalBg = colors(h.term.getLine(0)![19]).bg
      const content = h.viewport()

      transparent.set(false)
      await h.flush()
      expect(colors(h.term.getLine(0)![19]).bg).toEqual([240, 240, 240])
      expect(colors(h.term.getLine(3)![0])).toEqual({ bg: [240, 240, 240], fg: [16, 16, 16] })
      expect(colors(h.term.getLine(4)![0]).bg).toEqual([17, 34, 51])

      transparent.set(true)
      await h.flush()
      expect(h.viewport()).toEqual(content)
      expect(colors(h.term.getLine(0)![19]).bg).toEqual(terminalBg)
      expect(colors(h.term.getLine(3)![0])).toEqual({ bg: terminalBg, fg: [16, 16, 16] })
      expect(colors(h.term.getLine(4)![0]).bg).toEqual([17, 34, 51])
      expect(colors(h.term.getLine(4)![1]).bg).toEqual(terminalBg)
    } finally {
      h.dispose()
    }
  })

  test("applies plain config changes through the transparency setter", async () => {
    const config = { transparent: true }
    const h = await makeHarness({
      cols: 20,
      defaultStyle,
      rows: 5,
      transparent: config.transparent,
    })
    try {
      h.renderer.stream.append(() => text("same"))
      await h.flush()
      const terminalBg = colors(h.term.getLine(4)![0]).bg

      config.transparent = false
      h.renderer.transparent = config.transparent
      await h.flush()
      expect(h.renderer.transparent).toBe(false)
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: [240, 240, 240], fg: [16, 16, 16] })

      config.transparent = true
      h.renderer.transparent = config.transparent
      await h.flush()
      expect(h.renderer.transparent).toBe(true)
      expect(h.row(4)).toBe("same")
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: terminalBg, fg: [16, 16, 16] })
      expect(colors(h.term.getLine(0)![19]).bg).toEqual(terminalBg)
    } finally {
      h.dispose()
    }
  })

  test("setting transparency overrides an initial reactive source", async () => {
    const transparent = signal(false)
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5, transparent: transparent.get })
    try {
      h.renderer.stream.append(() => text("same"))
      await h.flush()
      h.renderer.transparent = true
      await h.flush()
      const terminalBg = colors(h.term.getLine(4)![0]).bg
      transparent.set(true)
      transparent.set(false)
      await h.flush()
      expect(h.renderer.transparent).toBe(true)
      expect(colors(h.term.getLine(4)![0]).bg).toEqual(terminalBg)
    } finally {
      h.dispose()
    }
  })

  test("uses the latest theme when transparency is disabled again", async () => {
    const transparent = signal(true)
    const h = await makeHarness({
      cols: 20,
      defaultStyle: { bg: "bg", fg: "fg" },
      rows: 5,
      theme: { ...defaultTheme, bg: "#f0f0f0", fg: "#101010" },
      transparent: transparent.get,
    })
    try {
      h.renderer.stream.append(() => text("same"))
      await h.flush()
      const terminalBg = colors(h.term.getLine(4)![0]).bg
      h.renderer.theme = { ...defaultTheme, bg: "#222222", fg: "#dddddd" }
      await h.flush()
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: terminalBg, fg: [221, 221, 221] })
      transparent.set(false)
      await h.flush()
      expect(h.row(4)).toBe("same")
      expect(colors(h.term.getLine(4)![0])).toEqual({ bg: [34, 34, 34], fg: [221, 221, 221] })
    } finally {
      h.dispose()
    }
  })

  test("fills the resized viewport with the defaults", async () => {
    const h = await makeHarness({ cols: 20, defaultStyle, rows: 5 })
    try {
      h.renderer.stream.append(() => text("hello"))
      await h.flush()
      await h.resize(30, 7)
      expect(h.viewport()).toContain("hello")
      expect(colors(h.term.getLine(0)![29]).bg).toEqual([240, 240, 240])
      expect(colors(h.term.getLine(6)![29]).bg).toEqual([240, 240, 240])
    } finally {
      h.dispose()
    }
  })
})
