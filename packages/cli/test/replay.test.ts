import type { Session } from "@zaly/agent/session"
import type { Message } from "@zaly/ai"
import type { Node } from "@zaly/tui"
import type { App } from "../src/app/app.ts"

import { stripAnsi } from "@zaly/shared/ansi"
import { createCtx } from "@zaly/tui"
import { expect, test } from "vitest"
import { replay } from "../src/app/replay.ts"

test.each([18, 19, 20])("replay preserves edit results with %i later messages", async (later) => {
  const messages: Message[] = [
    {
      id: "edit-call",
      role: "assistant",
      content: [
        { type: "tool-call", id: "edit", name: "edit", params: { path: "file.txt", edits: [] } },
      ],
    },
    {
      id: "edit-result",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "edit",
          name: "edit",
          content: [{ type: "text", text: "ok" }],
          isError: false,
          meta: { path: "file.txt", original: "before edit\n", content: "after edit\n" },
        },
      ],
    },
    ...Array.from({ length: later }, (_, i): Message => ({
      id: `user-${i}`,
      role: "user",
      content: i === 0 ? "and comments if needed" : `Later message ${i}`,
    })),
  ]
  const nodes: Node[] = []
  const app = {
    $: { ui: { reasoning: false, collapsedTools: [] } },
    renderer: {
      render: async () => {},
      stream: {
        append: (create: () => Node) => {
          const node = create()
          nodes.push(node)
          return node
        },
        waitIdle: async () => {},
      },
    },
  } as unknown as App

  await replay({ messages } as unknown as Session, app)
  const ctx = await createCtx({ width: 100 })
  const rows = await Promise.all(
    nodes.map(async (node) => {
      const rendered = await node.render(ctx)
      return rendered.join("\n")
    })
  )
  const output = stripAnsi(rows.join("\n"))
  expect(output).toContain("before edit")
  expect(output).toContain("after edit")
  expect(nodes.every((node) => !node.state.sticky)).toBe(true)
})
