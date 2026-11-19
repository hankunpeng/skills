---
name: svr
description: Recommend a release version using Semantic Versioning and evidence of public compatibility. Use when asked which version to release or whether changes warrant a major, minor, or patch bump.
---

# Semantic Version Recommender

## Establish the release comparison

- Identify the artifact, release line, and requested scope. For a release, compare the candidate to the last applicable published version of that artifact. For a PR or working-tree review, use the requested base and describe the result as applying to that scope.
- Prefer a baseline the user supplies or that release records support. Match monorepo tags and manifests to the artifact. Check the manifest at the baseline revision when the working copy may already contain a planned version. If the tag, manifest, or release records disagree, explain what each represents and treat any version number as conditional until the baseline is known. For a first release, use the project's policy or discuss whether its public contract is ready for `1.0.0`.
- Inspect the net diff and relevant tests, callers, and public documentation. Review the parts of the contract consumers rely on, including public imports, CLI and config, observable behavior and defaults, data formats, and runtime support. Use commit labels and changed export lines as leads to investigate. Account for edits with unchanged interfaces, re-exports, and changes that were reverted within the range.

## Decide the increment

For a stable release at `1.0.0` or later, apply [SemVer 2.0.0](https://semver.org/) to the net change:

| Increment | Evidence |
| --- | --- |
| `MAJOR` | An existing supported consumer has to change because the public contract changed incompatibly. Reset minor and patch to zero. |
| `MINOR` | The public API gains backward-compatible functionality or marks existing functionality deprecated. Reset patch to zero. SemVer also permits a minor increment for substantial internal improvements. |
| `PATCH` | The release corrects behavior within the existing public contract. For internal, documentation, or packaging changes, apply the project's release policy if it ships those changes. |

- If the selected scope has no net releasable change, say so. If compatibility depends on missing evidence, state the uncertainty and the specific check that would resolve it.
- For `0.x`, follow the project's release policy and report compatibility impact independently. SemVer leaves the increment convention open during initial development. For a prerelease, establish the intended stable target and channel before suggesting a prerelease increment or stable promotion. Build metadata has no effect on precedence.

## Gather local evidence

Run the bundled helper with Node.js from the target Git worktree. Use its absolute path inside the installed skill. Omit the helper when the user has supplied enough evidence for the review.

```bash
node "<skill_dir>/scripts/semver-analyzer.js" --staged --json
node "<skill_dir>/scripts/semver-analyzer.js" --working --file app.html --json
node "<skill_dir>/scripts/semver-analyzer.js" --commits v1.2.3..HEAD --json
```

- The default compares the worktree to `HEAD` and lists untracked paths. `--staged` inspects the index. `--working` inspects unstaged changes and lists untracked paths. Inspect relevant untracked files separately.
- `--commits A..B` compares the trees at `A` and `B` and reads commits introduced on `B`. `A...B` uses the merge base of `A` and `B` for both. Limit the review to the relevant artifact in repositories with multiple release lines.
- Supply `--current VERSION` or `--file PATH` when useful. The file can be a JSON manifest with a `version` field or HTML with a version in its title, such as `App v1.2.3`. Automatic detection uses a SemVer tag or `package.json` at the base commit (`HEAD` for uncommitted changes). Check that it corresponds to the relevant release. `recommendedType` and `recommendedVersion` are nullable preliminary hints in JSON. Use the contract evidence for the final recommendation.

Give the baseline and scope, the proposed increment and version (or why it is pending), and the decisive compatibility evidence. If asked for a release command, verify the project's documented CLI and show the command with the proposed version. Changing versions, tags, builds, and publishing require a request for those actions.
