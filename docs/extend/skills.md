# Skills

Skills are reusable workflows the agent can discover and activate when relevant.
Unlike always-loaded project instructions, a skill's full body is loaded on demand.

Create `.zaly/skills/review/SKILL.md`:

```md
---
name: review
description: Review a change for correctness, security, and missing tests.
---

Read the relevant code and tests before making recommendations.
Report concrete issues with file references. Don't edit files unless asked.
Use references/checklist.md when a deeper review is needed.
```

Additional files can live beside the skill:

```text
review/
  SKILL.md
  references/
    checklist.md
```

The model receives the skill catalog first. Activation loads the instructions and
lists bundled files; it does not eagerly read every reference. The skill should
say when supporting files are useful.

## Discovery and invocation

Skills are discovered from zaly resource directories and compatible `.agents/`
skill directories. Project entries take precedence over user entries with the
same name. See [resources](../configuration/resources.md) for scope and layout.

Use `/reload` after editing. Skill actions are enabled by default with the
`skill:` prefix, so the example can be exposed as `/skill:review`. The agent can
also activate a skill based on the task and its catalog description.

`skills.enabled`, `skills.actions`, and `skills.actionPrefix` control this behavior;
`--no-skills` disables skills for an invocation. A skill is instructions, not a
permission grant: tools it requests remain subject to normal checks.
