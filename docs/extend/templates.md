# Templates

:::: v-pre

Custom command bodies use double-brace expressions. Named command options,
`args` (positional arguments), and `raw` (raw argument text) form the input values.

```handlebars
Review {{args}}. Focus: {{focus}}
```

In commands, the positional array renders as space-separated text. For a reliable
serialized representation of any value, use `json(value)`.

## Conditional text

```handlebars
{{ #if focus }}
Include a detailed explanation.
{{ else }}
Keep the explanation short.
{{ /if }}
```

Conditions can nest. `~` inside either delimiter trims neighboring whitespace:
`{{~ value }}` trims before the expression; `{{ value ~}}` trims after it.
Use this carefully when newlines are meaningful.

## Helpers

| Helper           | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `$(value)`       | Shell-quote one value or an array of values.                            |
| `json(value)`    | Pretty-print JSON.                                                      |
| `env`            | Read the process environment, such as `env.HOME`.                       |
| `error(message)` | Stop rendering with an explanatory error.                               |
| `vars`           | Access supplied values explicitly, including names shadowed by helpers. |

For example, inside a command's executable shell block:

````md
```bash !
git diff -- {{ $(args) }}
```
````

Here the quoting helper formats each argument separately; it is not a command
execution function. Shell execution belongs to the command layer.

## Expressions and safety

Expressions run in a restricted JavaScript VM context. Standard expression
facilities such as `Math` are available, but Node globals such as `process` are
not provided. This is **not a general security sandbox**: only use trusted
command templates, and remember `env` can expose secrets to the rendered prompt.

Set `commands.expr: false` to allow simple variable interpolation rather than
arbitrary expressions. That also means expression helpers such as `$(args)`
are unavailable. See [commands](./commands.md) for disabling shell snippets separately.

::::
