# Contributing

zaly is a Bun workspace monorepo. Use Node.js 22.18.0 or newer and Bun.

## Development

Run from the repository root:

```sh
bun install --frozen-lockfile
bun z build
bun test                # Fast development loop
bun z test --bun        # Verify under both Node and Bun
bun z lint
bun z fmt
```

Use `bun z ...` for project tooling; running it inside a package limits supported
commands to that package. Root lint also requires `actionlint` on your PATH.

Keep changes focused and add tests for behavior changes. Import test APIs from
`vitest`, not `bun:test`, so tests work in both runtimes. Commit generated changes
when a build updates them. Use conventional commit messages such as `fix(tui): ...`
or `feat(agent): ...` for release notes.

## Documentation

Root `docs/` is for the user-facing documentation website. Package-specific
contributor and embedding guides live in `packages/<name>/docs/` where needed.

```sh
bun docs:dev       # Generate references and start VitePress
bun docs:build     # Regenerate references and check the production build/links
bun docs:preview   # Preview the production build
```

The five generated sections in `docs/reference/` come from `packages/dev/src/docs.ts`.
Handwritten introductions/examples outside `<!-- name:start -->` / `<!-- name:end -->`
markers are preserved exactly. Edit source definitions for generated content; never
remove, duplicate, or nest the markers. The generator validates every page before
writing and leaves unchanged files untouched.

Run `bun docs:generate` after changing settings, tools, CLI arguments, or actions.
You can commit the resulting changes with your code, but CI also regenerates them:
differences do not block PR builds or deployment. Main builds deploy the fresh site
and maintain one `chore(docs): sync generated references` PR to record the changes.
Enable GitHub Actions PR creation in repository settings. As with Models, bot PRs
use `GITHUB_TOKEN` and don't automatically trigger another CI run; the source run
already built the regenerated site.

Restart `docs:dev` or regenerate manually after source-definition changes;
VitePress watches Markdown, not generator inputs. `docs/nav.md` is a planning
document excluded from the website. Styling extends the default theme in
`docs/.vitepress/theme/`.

CLI demo tapes live in `packages/cli/demo/`; recordings and posters are versioned
in `docs/public/demos/`. Regenerate them manually with VHS when the demonstrated
UI changes. See the [recording guide](./packages/cli/demo/README.md).

For versioning, CI publication, and recovery, see the
[release guide](./packages/dev/docs/releases.md). Versions and changelogs are managed
through release-please; don't bump package versions individually.
