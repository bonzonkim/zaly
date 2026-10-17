# Interface

## Composer

The input at the bottom is where you write messages. **Enter** submits;
**Shift+Enter** or **Alt+Enter** inserts a newline when supported by your terminal.
Type `/` for action completion and `@` to reference project files.

Use `/history` to pick an earlier input. Pasting an image can attach it when the
selected model accepts images. Attachment support is checked against the model.

## Messages and tool previews

The history shows your messages, model responses, reasoning when enabled, and
tool calls. A pending tool has not yet completed. Completed calls can show
previews such as changed lines, file excerpts, or command output.

Some tools are collapsed to reduce noise. By default, `read` is collapsed: its
call header still shows the file and returned line range. Configure
`ui.collapsedTools` to choose which tool results stay collapsed.

## Pickers and commands

Commands such as `/model`, `/theme`, `/resume`, and `/resources` open interactive
pickers. Type to filter and follow the visible controls. **Esc** closes the active
interaction where handled, or stops the agent. `/help` shows active keybindings.

[The command reference](../reference/commands.md) lists built-ins. Custom commands,
skills, and plugins can add more actions to completion.

## Scrolling and copying

Page Up/Page Down scroll history, and Home/End jump to its ends when the history
bindings handle those keys. The composer also uses cursor-motion keys, so focus
and context matter. Use `/scroll-top` and `/scroll-bottom` as explicit alternatives.

Mouse selection and clipboard behavior depend on the terminal. `ui.copyOnSelect`
is enabled by default; Ctrl+Y copies the selection or composer input. See
[keybindings](../reference/keybindings.md) for the underlying action IDs.

## Status and visibility

Model choice and reasoning effort affect future requests; changing them does not
restart an already-running model response. Reasoning display is controlled by
`ui.reasoning`, separately from the model's reasoning effort.

Use `/session` for session information and `/context` to inspect what the agent
currently has available. These are useful when understanding an unfamiliar
session or reporting an issue.
