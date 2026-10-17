# Custom commands

:::: v-pre

A custom command turns a Markdown prompt into a reusable slash action. Put the
file in project `.zaly/commands/` or user `~/.config/zaly/commands/`. Its filename
without `.md` is the command name.

For `.zaly/commands/review.md`:

```md
---
description: Review selected code without editing it
args:
  focus:
    type: string
    default: correctness
---

Review {{ args }} with a focus on {{ focus }}.
Explain concrete problems and suggest fixes, but don't edit files yet.
```

After `/reload`, invoke:

```text
/review --focus security src/auth.ts
```

Use `--preview` to display the rendered command without submitting it to the
agent. Preview still prepares the template, **including enabled shell snippets**.
It is not a dry run of local template code.

## Arguments and templates

Frontmatter arguments currently support `string` and `boolean`. A string without
a default is required unless configured otherwise; booleans default to false.
Positional arguments are available as `args` (an array), and `raw` preserves the
raw argument text. Named options are available by their names.

The default action prefix is empty, so `review.md` becomes `/review`.
`commands.actionPrefix` changes that prefix. The [template guide](./templates.md)
covers conditionals, helpers, and shell quoting.

## Include shell output

A standalone line of the form `` !`command` `` executes a shell command and inserts
its output. A fenced block with language `bash !` does the same:

````md
Inspect this status before reviewing:

```bash !
git status --short
```
````

Use `{{ $(args) }}` to quote positional arguments when inserting them into shell
commands. Do not interpolate unquoted user input into executable snippets.

::: warning Local execution
Shell snippets run while formatting the command, before the rendered prompt is
sent. Only use trusted command files. Set `commands.bash: false` to disable shell
snippet execution and `commands.expr: false` to restrict template expressions.
:::

::::
