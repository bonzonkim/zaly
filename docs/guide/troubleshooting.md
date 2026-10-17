# Troubleshooting

## Start with the effective configuration

```sh
zaly --print-config
zaly --debug
```

`--print-config` prints resolved settings, resource locations, and loaded dotenv
variable names. Debug logs can contain sensitive conversation/tool information.
Review and redact output before sharing it.

## Authentication or missing models

Use `/login` to authenticate and `/model --all` to inspect models beyond the
authenticated list. Stored credentials can take precedence over environment
variables. Check [authentication](../configuration/models.md) before rotating keys
or changing endpoints.

ChatGPT subscription access uses **OpenAI Codex**. It is not interchangeable with
an OpenAI API key. Authentication success does not remove account quotas, provider
limits, or model-access restrictions.

## Tool is missing or asks for approval

Check `tools`, the active permission preset/rules, and the model's capabilities.
`search` additionally needs `BRAVE_API_KEY`. A provider/tool error is different
from a denied permission. Do not solve an unexplained failure by blindly enabling
yolo; inspect the relevant request and configuration first.

## Resources didn't appear

Check the [resource layout](../configuration/resources.md), filenames, scope,
and enabled filters. `/resources` helps inspect enabled resources. Use `/reload`
after editing or installing resources; config changes may also need a reload or
restart depending on the component. `--no-plugins`, `--no-packs`, and other disable
flags can deliberately suppress discovery.

## Terminal rendering or shortcuts

Try a directly supported terminal without a multiplexer, and compare fullscreen
with `zaly --mode scrollback`. Use slash-command alternatives when a modified key
is not delivered correctly. Inline images are currently integrated with Ghostty
and Kitty; see [terminal support](./installation.md).

## Report a problem

Open a [GitHub issue](https://github.com/folke/zaly/issues) with:

- zaly version, operating system, terminal, and whether SSH/a multiplexer is involved;
- model/provider and reasoning effort, without keys or tokens;
- reproduction steps and expected versus actual behavior;
- a redacted screenshot/log or minimal session excerpt when relevant.

Session files can contain the entire conversation and tool inputs/results. Share
only what you are comfortable making public. Avoid posting credential files.
