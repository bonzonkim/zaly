import type { Theme } from "./types.ts"

/**
 * Slot-level fallbacks. Every Theme value is shallow-merged on top of
 * this record by `resolveTheme`, so partial JSON themes only need to
 * declare slots that diverge from these defaults.
 *
 * Distinct from `defaultTheme` — that's the precomputed `tokyonight-moon`
 * Theme bundled as the default palette for `createCtx()` etc.
 */
// oxlint-disable-next-line sort-keys
export const defaults: Omit<Theme, "id"> = {
  // base colors
  primary: "blue",
  accent: "brightMagenta",

  bg: "inherit",
  fg: "inherit",

  // text
  muted: { dim: true },
  quiet: { dim: true, fg: "muted", italic: true },
  comment: { fg: "muted", italic: true },
  title: { bold: true, fg: "primary" },
  delim: "muted",

  // surface & structure
  ui: { bg: "bg+5" },
  overlay: { bg: "ui" },
  highlight: { bg: "bg+5" },

  // ui primitives
  divider: "bg-5",
  selection: { bg: "brightBlue", fg: "black" },
  gutter: "bg-5",
  prompt: "inherit",
  border: "black",
  borderTitle: "title",

  // code
  code: { bg: "bg+5" },
  codeTitle: "title",

  // log levels
  success: "green",
  info: "cyan",
  warn: "yellow",
  error: "red",

  // syntax
  syntaxNumber: "brightBlue",
  syntaxString: "green",
  syntaxBoolean: "yellow",
  syntaxFunction: "blue",
  syntaxField: "white",
  syntaxConstant: "magenta",
  syntaxSpecial: "red",
  syntaxDelimiter: "delim",
  syntaxBracket: "delim",

  // markdown
  mdBold: { bold: true },
  mdCode: { bg: "highlight", fg: "primary" },
  mdCodeBlock: "code",
  mdCodeBlockTitle: "title",
  mdHeading1: "mdHeading",
  mdHeading2: { bold: true, fg: "accent" },
  mdHeading3: "mdHeading2",
  mdHeading4: "mdHeading2",
  mdHeading5: "mdHeading2",
  mdHeading6: "mdHeading2",
  mdHeading: "title",
  mdHr: "accent",
  mdItalic: { italic: true },
  mdLink: { fg: "primary", underline: true },
  mdListBullet: "accent",
  mdListChecked: "primary",
  mdListUnchecked: "primary",
  mdQuote: "muted",
  mdStrikethrough: { strikethrough: true },
  mdTable: "accent",
  mdTableHeader: "title",

  // menu
  optionActive: "selection",
  optionDesc: "muted",
  optionName: "primary",

  // diff
  diffAdd: { bg: "success-50", fg: "success" },
  diffContext: "highlight",
  diffDel: { bg: "error-50", fg: "error" },
  diffLine: "gutter",
  diffTitle: "title",
}

// oxlint-disable-next-line sort-keys
export const ansi: Theme = {
  id: "ansi",
  name: "ANSI",
  ...defaults,
  divider: "brightBlue",
  border: "brightBlue",
  highlight: { bg: "brightBlack" },
  ui: { bg: "brightBlack" },
  selection: { inverse: true },
  diffAdd: { fg: "success" },
  diffDel: { fg: "error" },
}
