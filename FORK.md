# sterlingwes/decap-cms fork

This fork carries fixes on top of [decaporg/decap-cms](https://github.com/decaporg/decap-cms)
(mobile editor layout, mobile toasts, batched GitHub reads for large
collections, GitHub Actions publish status). It isn't published to npm.
Instead, each release attaches a prebuilt `decap-cms.js` bundle that sites
vendor directly.

Consumers:

- [palestine-datasets](https://github.com/TechForPalestine/palestine-datasets)
  (checked out locally as `palestine-numbers`) serves the bundle from
  `/admin/decap-cms.js` (see its `docs/decap-cms-setup.md`).

## Working on the fork

Upstream uses pnpm 11 (`packageManager` in `package.json`), which needs Node 22
or newer.

```bash
nvm use 24
corepack enable   # or: npx pnpm@11.12.0 ...
pnpm install
pnpm run test:unit
```

Make changes on a branch and open a PR against this fork's `main`.

## Pulling in upstream

```bash
git remote add upstream https://github.com/decaporg/decap-cms  # once
git fetch upstream main
git switch -c chore/sync-upstream origin/main
git merge upstream/main
# resolve conflicts, then: pnpm install && pnpm run test:ci
git push origin chore/sync-upstream   # and open a PR into main
```

Merge instead of rebasing, so the fork's `main` never needs a force push.

## Releasing a bundle

1. In this repo, go to Actions → **Fork release** → **Run workflow** on `main`
   (or `gh workflow run fork-release.yml -R sterlingwes/decap-cms`).
2. The workflow builds `packages/decap-cms/dist/decap-cms.js` and creates a
   release tagged `fork-v<decap-cms version>-<short sha>`, for example
   `fork-v3.16.3-3c7ff8c`. The release has two assets: `decap-cms.js` and its
   `decap-cms.js.sha256`.

To choose the tag name yourself, push a tag that starts with `fork-v`
instead. Those tags never match upstream's `decap-*@*` npm publish workflow.

To build the same bundle locally:

```bash
pnpm run build:esm                 # required: see the note below
pnpm exec nx run decap-cms:build   # writes packages/decap-cms/dist/decap-cms.js
```

Run `build:esm` first. Without it, webpack bundles the other packages' UMD
builds, and the resulting `decap-cms.js` crashes on load with
`Cannot read properties of undefined (reading 'registerBackend')`.

## Updating palestine-numbers to a new release

palestine-numbers pins the release in `scripts/build/decap-cms.json` (repo,
tag and sha256), and its build downloads and verifies that exact file. To bump
the pin, use either option:

- **GitHub:** in palestine-numbers, go to Actions → **Update Decap CMS** →
  **Run workflow**. Leave the tag empty to use the latest fork release. The
  workflow pushes a `chore/decap-cms-<tag>` branch. Use the **Open the pull
  request** link in the run summary to open the PR, because Actions in that
  repo can't open PRs.
- **Locally:** run `bun run update-decap` (latest release) or
  `bun run update-decap fork-v3.16.3-3c7ff8c`. Then commit
  `scripts/build/decap-cms.json`.

Before merging, check `/admin` locally: run `bun run vendor-decap`, then
`bun run docs-start`.
