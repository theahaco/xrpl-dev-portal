# DevX before and after preview

A standalone GitHub Pages comparison for the aha audit. It displays the actual before/after TypeScript example files with guided excerpts, source links, copy buttons, downloads and changed-line highlighting enabled by default. The highlight button can turn it off. It does not execute transaction code or reproduce the full Realm portal.

## Build locally

Node.js 22, with no package installation required:

```sh
node scripts/devx-preview/build.mjs
node scripts/devx-preview/check.mjs
python3 -m http.server 4401 --directory out/devx-preview
```

Open `http://localhost:4401/pr-1/`. Choose a journey and step. Links such as `pr-1/index.html#payment` and `pr-1/issue-mpt.html#inspect` open a specific comparison. With JavaScript disabled, all steps remain readable.

The before side uses the audit's corrected examples compatible with published xrpl 5.3.0. It is not presented as the untouched legacy portal. The after side uses the unreleased SDK fork. Excerpts are extracted from source markers; the build fails if a marker is missing. The full downloads are byte-for-byte source copies, and `manifest.json` records commit and file hashes. Changed-line highlighting compares trimmed lines, not syntax or moved-block semantics.

## Publishing

`.github/workflows/devx-preview.yml` builds and deploys to GitHub Pages on relevant pushes to `aha/devx-audit-2026-09`. The workflow is restricted to `theahaco/xrpl-dev-portal`; it has no upstream deployment target. Set this fork's Pages source to **GitHub Actions**, with its `github-pages` environment permitting this audit branch. No hosting secrets or custom domain are needed.

Preview: https://theahaco.github.io/xrpl-dev-portal/pr-1/

The deployment shows a preview link on the associated GitHub environment and Actions run. Both audit PR descriptions also link here. The URL serves the latest deployed audit branch; provenance identifies the exact commit. Future unrelated PRs need their own output path and deployment strategy.
