# Plugins and resource packs

## Local plugins

Place a plugin in `.zaly/plugins/hello.ts` (project) or the user configuration's
`plugins/` directory. A minimal plugin exports a function:

```ts
import type { PluginApi } from "@zaly/plugin"

export default function plugin(zaly: PluginApi) {
  zaly.events.on("agent:start", () => {
    // React to the agent starting a run.
  })
}
```

Use `/reload` after changes. Plugins can provide behavior through the public plugin
API. They execute locally with the application's privileges: keep them small,
review their source/dependencies, and avoid logging secrets or entire contexts.

For API details, follow the package links on the [Developer page](../developer.md)
rather than treating this user guide as the full embedding reference.

## Installed plugins

`/install`, `/plugins`, and `/update` manage plugins. `/install --project` and
`/install --user` choose the scope. Plugin references are recorded in configuration;
resources can be enabled or filtered separately with `/resources`.

Supported reference forms include local paths, npm packages, and Git-based
references. Review a source before installing it; installation and plugin loading
can execute third-party code. Use `--no-plugins` or `--no-packs` for diagnosis
when you need to separate behavior plugins from resource-pack loading.

## Resource packs

A resource pack groups the standard `commands/`, `skills/`, `themes/`, and/or
`plugins/` directories for reuse. It can distribute prompts and themes without
requiring every user to copy files manually.

Use the same [resource layout](../configuration/resources.md) as project/user
resources. A pack's enabled state and include/exclude filters are configured under
`resources`. A source being installed does not mean every one of its resources
must be enabled.

Start with a project-local resource directory. Package and distribute it only
once its behavior and scope are clear.
