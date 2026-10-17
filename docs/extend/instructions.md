# Project instructions

Use `AGENTS.md` for durable project conventions: how to build/test, important
boundaries, and non-obvious design constraints. Instructions are context for the
model, not executable policy or a replacement for permissions.

```md
# Project guidance

- Use Bun for development.
- Run the relevant tests before proposing a commit.
- Keep public APIs compatible unless explicitly asked otherwise.
- Ask before deleting data or changing deployment configuration.
```

zaly searches upward for the nearest project `AGENTS.md` or compatible `CLAUDE.md`,
from the working directory to the project boundary. User instructions are loaded
from the user configuration's `AGENTS.md`, falling back to `~/.agents/AGENTS.md`.
Use `/context` to verify which files actually entered the session.

Keep shared conventions in version control. Put personal preferences in user-level
instructions. Avoid duplicating a large README: link to detailed guides and state
only the rules the agent needs while working.

## Long-lived memory

The prompt system also supports `MEMORY.md`: user-level memory and project
`.agents/MEMORY.md`. Treat it as plain-text instructions/context. It can be useful
for concise, durable facts, but is not a guarantee that every past conversation
will be recalled automatically.

Never put secrets into instruction or memory files. Model requests can include
their contents. For approval boundaries, use [permissions](../configuration/permissions.md).
