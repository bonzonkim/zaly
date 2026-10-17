import type { FileTool } from "@zaly/agent"
import type { ToolRenderer, ToolResultCtx } from "./registry.ts"

import { stringifyContent } from "@zaly/ai"
import { prettyPath } from "@zaly/shared"
import { memo, unwrap } from "@zaly/tui"
import { text } from "@zaly/tui/widgets/text"
import { toolPreview } from "../params.ts"

/// Show the pretty printed file path in the call preview.
export function fileCall(props: ToolResultCtx<FileTool>) {
  const path = memo(() => {
    const p = unwrap(props.result)?.meta?.path
    return { path: p ? prettyPath(p) : (props.params?.path ?? "unknown path") }
  })
  return toolPreview(props.call.name, path)
}

/** Generic fallback renderer — dim text preview of the result content,
 *  truncated to 500 chars. Used for any tool that doesn't have a
 *  specialised renderer registered. Mirrors the behaviour the inline
 *  result preview had before tool-renderer dispatch. */
export const defaultRenderer: Required<ToolRenderer> = {
  call(ctx: ToolResultCtx) {
    return toolPreview(ctx.call.name, ctx.params)
  },
  result(ctx: ToolResultCtx) {
    return text(({ style }) => {
      const r = unwrap(ctx.result)
      if (r === undefined) return ""
      const content = stringifyContent(r.content)
      const trimmed = content.length > 500 ? `${content.slice(0, 497)}...` : content
      return style.dim(trimmed.replaceAll(/^/gm, "  "))
    })
  },
}
