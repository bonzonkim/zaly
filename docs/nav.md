# Documentation outline — working draft

Temporary planning document, not a page to include in the published navigation.
Paths below are relative to `docs/`; they are proposals, not files to create all
at once. Document current behavior, not planned features.

## Goals

- Get someone from installation to a useful first session quickly.
- Make everyday usage discoverable without requiring knowledge of the internals.
- Separate using zaly from configuring it and extending it.
- Keep package internals and release workflows outside the public website source.
- Start small; split pages only when the content justifies it.

## Suggested top navigation

- **Guide** — getting started and everyday usage.
- **Configuration** — providers, permissions, settings, and resources.
- **Extend** — commands, skills, templates, packs, and plugins.
- **Reference** — precise flags, settings, tools, and keybindings.
- **GitHub** — repository link.

Links to release notes, contributing, and package documentation can live in the
footer or relevant sidebars rather than becoming more top-level sections.

## Homepage

- `index.md` — “Hackable terminal coding agent,” install command, short demo,
  key capabilities, alpha notice, and a clear Get started link.

## Guide

### Getting started

- `guide/index.md` — what zaly is, requirements, and the shortest path to trying it.
- `guide/installation.md` — npm/Bun installation, updating, and uninstalling.
- `guide/first-session.md` — authenticate, choose a model, open a project, send a
  task, approve tool use, and resume the session later.

### Everyday usage

- `guide/interface.md` — composer, messages, tool previews, status, overlays,
  scrolling, selection, and copying. Include a small annotated screenshot.
- `guide/conversation.md` — sending messages while work is active, steering versus
  queued follow-ups, stopping/resuming, and attaching files or images. Describe
  only queue controls actually exposed by the CLI.
- `guide/sessions.md` — persistence, project association, resuming, starting fresh,
  and available history/branch operations.
- `guide/context.md` — project instructions, file context, viewing model context,
  masking, compaction, and what each does to conversation history.
- `guide/tasks.md` — foreground/background tools, task notifications, inspecting
  progress, and stopping work.
- `guide/troubleshooting.md` — authentication, provider errors, terminal behavior,
  permissions, diagnostics, and reporting a useful issue.

## Configuration

- `configuration/index.md` — configuration files, scopes, precedence, editing,
  reload behavior, and a minimal example. Establish the mental model here.
- `configuration/models.md` — providers, authentication, model selection,
  reasoning settings, and supported overrides. Split provider-specific setup into
  individual pages only when necessary.
- `configuration/permissions.md` — presets, allow/ask/deny rules, workspace
  boundaries, sensitive files, and concrete examples. Explain the consequences
  of `yolo` clearly.
- `configuration/resources.md` — where instructions, skills, commands, themes,
  packs, and plugins are discovered; user versus project scope; enabling and
  disabling resources. Keep trust behavior aligned with what is implemented.
- `configuration/appearance.md` — themes and terminal/display options, with links
  to relevant settings rather than duplicating the full settings reference.

## Extend

- `extend/index.md` — which extension mechanism to choose, with links to examples.
- `extend/instructions.md` — writing project instructions and how they are loaded.
- `extend/commands.md` — custom command files, arguments, shell execution, and
  practical examples. Distinguish these from built-in slash commands.
- `extend/templates.md` — interpolation, conditions, trimming, available values,
  helpers, environment access, and shell quoting. Link from command documentation.
- `extend/skills.md` — skill layout, metadata, activation, and bundled files.
- `extend/packs.md` — bundling/distributing reusable resources and controlling
  which ones are enabled.
- `extend/plugins.md` — a minimal plugin, installation/loading, events, and links
  to the public plugin API. Start with a usable example, not an API dump.
- `extend/themes.md` — creating a theme, semantic styles, and testing it.

## Reference

- `reference/cli.md` — CLI arguments, environment variables, and executable examples.
- `reference/commands.md` — built-in slash commands and their behavior.
- `reference/keybindings.md` — default shortcuts grouped by context; note terminal
  limitations and any supported customization.
- `reference/settings.md` — complete settings reference, defaults, allowed values,
  and scopes. Prefer schema-derived content where practical.
- `reference/tools.md` — built-in tools, parameters, result behavior, and limits.
  Split into per-tool pages if this becomes unwieldy.
- `reference/paths.md` — configuration, resources, credentials, sessions, cache,
  and logs; platform differences and what is safe to remove.

Reference pages should describe exact behavior. Guide pages should explain how
and why to use it; link between them rather than maintaining duplicate tables.

## Package and contributor documentation

Not a second public guide to maintain under `docs/`:

- Root `CONTRIBUTING.md` remains the contributor entry point.
- `packages/dev/docs/releases.md` remains the release/recovery guide.
- Package READMEs introduce the individual libraries and link to deeper guides
  under `packages/<name>/docs/` only where needed.
- Later, expose selected embedding guides and generated API docs on the website
  without copying their source. Decide the integration when we have that content.

## Suggested first pass

Write these before expanding the whole tree:

1. Homepage and installation.
2. First session and a short interface tour.
3. Model/provider setup.
4. Configuration locations, precedence, and permissions.
5. Conversation controls, sessions, and context management.
6. Custom commands, templates, and skills — distinctive zaly capabilities.
7. CLI, slash-command, keybinding, and settings references as they become useful.

Initially, related topics can share pages: `guide/index.md` can contain the first
session walkthrough; provider setup can stay on one page; tasks can be a section
of the conversation guide. Avoid empty navigation groups or placeholder pages.

## Open decisions

- How much of the reference can be generated reliably from code/schemas?
  - we should aim to generate most of it
- Which provider setups need individual walkthroughs?
  - We should mainly mention the different ways to authenticate
  - OpenAI Codex with ChatGPT subscription deserves a special mention
- Which terminal/platform combinations do we actively document and test?
  - for now, I'd limit to Linux / MacOS. Haven't tested Windows yet.
  - Ghostty & Kitty have full support for the inline KGP.
  - other terminals that are good, but without images: Alacritty, WezTerm, iTerm2
- Should package/API documentation eventually get its own top-level section?
  - Wouldn't add this to the user facing docs. Can have a separate dev.zaly.dev site for that, or have separate, like tui.zaly.dev, ...
  - Can have a generic "Developer" section with links to the package docs, but not include the package docs themselves in the user facing docs.
- Which screenshots or short recordings best explain the interaction model?
  - tbd

Revisit the exact labels and sidebar grouping after drafting the first few pages.
