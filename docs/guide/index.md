# Getting started

zaly is an AI coding agent that works in your terminal. It can read and edit
files, run commands, and keep a conversation going across sessions. You choose
the model and the permissions it receives.

## Install and open a project

You need Node.js **22.18.0 or newer**, a model-provider account or API key, and a
terminal. See [installation](./installation.md) for supported platforms and terminals.

::: code-group

```sh [bun]
bun add -g @zaly/cli
```

```sh [npm]
npm install -g @zaly/cli
```

```sh [pnpm]
pnpm add -g @zaly/cli
```

:::

```sh
cd your-project
zaly
```

The working directory matters: it determines project configuration, instructions,
file paths, and the session to resume.

## Authenticate and choose a model

1. Type `/login` and choose a provider.
2. Follow the offered authentication method: enter an API key, open the browser,
   or complete a device-code flow when supported.
3. Type `/model` and select a model you have access to.

For a ChatGPT subscription, choose **OpenAI Codex**, not the OpenAI API-key
provider. See the [Codex walkthrough](../configuration/codex.md). Other options
are described in [authentication and models](../configuration/models.md).

## Ask for a concrete task

Start with something inspectable:

```text
Explain how this project is organized. Read the relevant files, but don't change anything yet.
```

Follow with an implementation request when you're happy with the direction. You
can include files with `@path/to/file.ts` or a range such as `@src/main.ts:10-30`.
Review tool previews and any permission prompts. The default preset is
`permissive`; [permissions](../configuration/permissions.md) explains what that means.

## Keep talking

You can send another message while work is active. It is picked up at the next
safe step boundary, rather than aborting the current model response or tool batch.
Use this to correct the approach, add a constraint, or ask a question.

Press **Esc** or use `/stop` to stop current work. Use `/help` for active bindings,
`/context` to inspect context, and `/config` to edit settings.

## Come back later

Starting `zaly` in the same project resumes its most recent session. Use `/new`
or `zaly --new` for a fresh session, and `/resume` to choose another one. See
[sessions and context](./sessions.md) for history, masking, and compaction.
