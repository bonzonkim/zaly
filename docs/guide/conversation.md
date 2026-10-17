# Conversation and tasks

## Steering ongoing work

Normal submission is steering: while the agent is working, another message is
queued for the next model step. It does **not** abort the response or tool batch
already in progress. The agent sees it before continuing with another request.

For example:

```text
Keep the existing public API. Also add a regression test for Windows-style paths.
```

You can also ask a side question this way. It becomes part of the main conversation,
so the agent can remember the answer and act on any resulting instructions.

The agent library additionally has an append/follow-up queue: each submission
waits until current work and pending steering finish, then runs separately.
Messages within one submission stay together. The CLI's normal Enter submission
uses steering; there is currently no separate documented CLI follow-up shortcut.

## Stopping

Press **Esc** or run `/stop` to stop the current turn or tool batch. Stopping is
an explicit interruption; sending an ordinary message is not. Inspect any changes
already made before asking the agent to continue—stopping doesn't undo filesystem
or external side effects.

## Long-running tools

Slow tool calls can become managed background tasks instead of blocking the
conversation. You will see task progress/completion notifications. The agent can
inspect running/recent tasks, poll new output, and stop tasks using the built-in
`task_list`, `task_poll`, and `task_stop` tools.

A background task is not the same as a separate conversation. Its eventual
result can still be delivered to the agent. Stopping the agent's current turn
and stopping a background task are distinct actions; ask explicitly to stop a
particular task if that is what you need.

## Running a command yourself

Prefix composer input with `!` to execute a shell command and include its tool
exchange in the conversation:

```text
!git status --short
```

This runs locally; it is not merely a request for the model to suggest a command.
Only execute commands you trust. [Custom commands](../extend/commands.md) can also
execute shell snippets while their prompt is being prepared.

## Being explicit

Separate planning from execution when it matters: “inspect this, don't edit yet”
is clearer than relying on the agent to infer your intent. Use a restrictive
[permission preset](../configuration/permissions.md) when you need actual approval
gates; instructions alone are not a security boundary.
