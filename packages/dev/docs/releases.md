# Releases

Zaly uses one synchronized version for the product and all seven public npm packages. Release-please maintains one root release PR, one root `CHANGELOG.md`, and one GitHub release tagged `v<version>`. Review and merge that PR; GitHub Actions handles publication. The private dev package is not versioned with the product.

## One-time setup

Enable **Allow GitHub Actions to create and approve pull requests** in the repository's Actions settings. Models and release-please use the built-in `GITHUB_TOKEN`; no GitHub App or automation secrets are needed. Their bot-created PRs do not automatically trigger CI. Ensure branch protection permits merging them without those checks; main CI verifies the merged commit before release creation and publishing.

For each public npm package, configure a GitHub trusted publisher for owner `folke`, repository `zaly`, workflow `ci.yml`, environment `npm`. Allow your maintainer account to publish locally if you want local recovery as a fallback.

Create the GitHub `npm` environment, optionally requiring maintainer approval. No `NPM_TOKEN` is needed. Public packages published from this public repository receive provenance.

## Normal release

1. Merge tested changes, optionally squash-merging the rolling Models PR first.
2. Review release-please's shared version and aggregate changelog. The root component sees changes across the repository; JSON `extra-files` updates synchronize the seven public package versions.
3. Merge its release PR.

CI verifies, builds, packs, and smoke-tests the merge commit once. Main pushes upload these tarballs and a small manifest as `packed-release`. Release-please creates one GitHub release; CI checks its tag points to the commit it verified before publishing.

The publishing job downloads the same tarballs and runs `bun z publish --artifacts`. It installs dependencies with lifecycle scripts disabled but **never rebuilds or repacks**. Publishing jobs are serialized and never canceled mid-publication.

All public packages are considered for publication in dependency order. Versions already on npm are skipped. The publisher completes every registry lookup and prints the pending set before publishing anything; only a structured E404 means unpublished. Authentication/network failures abort. Public versions must stay equal to the root version and should be bumped through the reviewed release PR, never individually. Publishing refuses mixed-version artifacts. Workspace dependencies remain `workspace:*`; pnpm resolves them to the shared version in published manifests.

Only the root is a release-please component. `separate-pull-requests: true` uses its native strategy PR rather than the merge plugin; with one component there is still only one PR, and the branch retains the identity needed to recognize the merged Node release. Package versions are updated through explicit JSON `extra-files` entries targeting `$.version`; dependencies and the private dev package are left untouched. No `linked-versions` or `node-workspace` plugin is needed. Conventional commit scopes identify the affected areas in the aggregate changelog, without synthetic synchronization entries.

CI never commits generated files. Regeneration differences must be committed before release. Catalog fetching is separate from building and publishing.

The shared `0.0.9` release already exists under `zaly-v0.0.9`. Versions stay at `0.0.9` until the next release PR. The root changelog starts with a curated overview of that alpha release; package changelogs were archived in commit `3c7e33075c873df0986c747ee8ffa1e52e9d63d3` and removed from the working tree. The root changelog links to that historical snapshot. Existing tags are not renamed or deleted. Because the tag format is changing, `bootstrap-sha` points to the `zaly-v0.0.9` release commit so the first bare-tag release only includes subsequent changes. After the first `v<version>` release, normal tag discovery takes over and the bootstrap setting can be removed.

## Manual CI runs

Dispatch **CI** to run verification without release-please. The optional `publish` checkbox defaults to false. On `main`, enabling it publishes unpublished versions after building and smoke-testing, without creating new versions or GitHub releases. Publishing from other branches is disabled.

```sh
gh workflow run ci.yml --ref main -f publish=true
```

This builds fresh tarballs from the selected commit; use failed-job reruns to reuse original artifacts.

## Recovery

GitHub releases precede npm publication, and publishing multiple packages is not atomic. For transient failures, **rerun failed jobs** in the same Actions run. This reuses the original tarballs for up to 30 days and skips packages already published.

If artifacts have expired or CI is unavailable, check out the exact release commit locally, install its dependencies, build and test, then publish:

```sh
git switch --detach <release-commit>
bun install --frozen-lockfile
bun z build
bun z test --bun
bun z pack --out /tmp/zaly-recovery
RELEASE_ARTIFACTS=/tmp/zaly-recovery bun z test packages/dev/test/release.integration.test.ts
bun z publish --artifacts /tmp/zaly-recovery --dry-run
bun z publish --artifacts /tmp/zaly-recovery
```

Use a fresh output directory for each recovery attempt. Already-published versions are skipped. Local recovery uses your npm credentials and does not get GitHub Actions provenance; rebuilding may produce different tarball bytes. Never change code while reusing an already published version.

If the automatic release tag differs from the CI commit, publication stops. Recover locally against the actual tagged commit instead of publishing mismatched artifacts.

## Catalog updates

Models refreshes every 6 hours or on manual dispatch, updating one `automation/models-catalog` PR. Squash-merge when useful. Releases bundle the checked-in snapshot, not whatever models.dev serves at publish time.

## Local usage

Release tooling lives in `packages/dev`. To verify installed packages without publishing:

```sh
bun z build
bun z pack --out /tmp/zaly-release
RELEASE_ARTIFACTS=/tmp/zaly-release bun z test packages/dev/test/release.integration.test.ts
bun z publish --artifacts /tmp/zaly-release --dry-run
```

The integration tests install tarballs into a temporary project and check exports, CLI version, catalog/theme assets, and a real Shiki worker under Node 22.18.0 and Bun. Shared setup/teardown lives in `packages/dev/test/helpers`; tests skip ordinary runs unless `RELEASE_ARTIFACTS` is set.

`bun z publish` is the local convenience path: pack into a temporary directory, then call the same artifact publisher. Verify builds first. Local publication uses your npm authentication; prefer Actions for routine releases and provenance.

Root `bun z lint` also checks workflows with actionlint. Install it locally; CI installs a pinned version. Package-local lint remains source-only.
