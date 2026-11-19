---
name: ccp
description: Commit and push a scoped Git change when the user invokes `ccp`, `/ccp`, `$ccp`, or `ccp @file`. Use the named paths or the current task’s changes, include verified companion assets, and preserve unrelated edits and staged work.
---

# Conventional Commit and Push

## Identify the change

- From the repository root, inspect `git status --untracked-files=all` and recent commit subjects. Use the paths named in the invocation, or the changes attributable to the current task for a bare `ccp`. Ask for paths if that scope is unclear. If the selected paths have no changes, report that and stop.
- Follow local references in target files to changed companion files, such as front matter image paths and Markdown links. Use a matching asset directory to locate candidates and include individual files with a verified connection to the target. Honor explicit limits such as “only this file.” Expand selected directories to exact changed paths and account for both sides of a rename when both are in scope.
- Use the supplied commit message or draft a Conventional Commit subject describing the net change. Follow the repository’s conventions and use its message validator if available. Otherwise, run `bash "<skill_dir>/scripts/commit-lint.sh" < "$message_file"` on the exact message to commit. The bundled validator checks the subject and accepts `init` for initial setup.

## Check what the push would publish

- Resolve one remote and destination branch from the user's instruction or the current branch's Git push configuration. If the destination is ambiguous, get it from the user before committing. Use `git remote get-url --push --all "$remote"` to find the endpoint for remote reads. If it lists several URLs, clarify which endpoint to use.
- Fetch the destination branch and compare its tip with the current `HEAD`. If the destination is ahead or histories diverge, report the discrepancy before staging. If local commits are already ahead, inspect the outgoing commit list and proceed only when publishing those commits is also in scope. When creating a remote branch, verify it is absent and account for the local history that creating it would publish. Treat a failed remote query separately from an absent branch.
- If Git is resolving a merge, rebase, cherry-pick, revert, or conflicts, report the active operation before changing the index.

## Commit the selected paths

Use a nonempty array `paths` of approved repository-relative file paths and a file `message_file` containing the validated message. If a selected file has both staged and unstaged changes, resolve which version is intended before replacing its staged content. For a whole-file commit, set `stage_paths` to the approved paths that need staging. A deletion already staged and still absent on disk only needs to appear in `paths`. Skip `git add` when `stage_paths` is empty.

```bash
git --literal-pathspecs add -- "${stage_paths[@]}"
git --literal-pathspecs diff --cached --check -- "${paths[@]}"
git --literal-pathspecs diff --cached --no-renames --name-status -- "${paths[@]}"
```

Compare the staged paths with the approved scope and record the staged diff. Before committing, verify with `git --literal-pathspecs diff --quiet -- "${paths[@]}"` that the working copies still match the staged versions. Commit by path so Git preserves unrelated staging:

```bash
git --literal-pathspecs commit --only -F "$message_file" -- "${paths[@]}"
```

Keep Git hooks enabled. Record the new commit hash and check its parent, final message, and diff against the approved result before pushing. Use `git diff-tree --root --no-commit-id -r --no-renames --name-status "$commit"` to list the actual paths, including in an initial commit. If a hook or concurrent edit changed the expected result, report the discrepancy before publishing.

## Push and verify

Push the verified hash to the chosen branch. Use the remote's name when it has one effective push URL, or the individually selected endpoint when it has several:

```bash
git push --no-follow-tags --recurse-submodules=no -- "$remote" "${commit}:refs/heads/$branch"
```

Use a normal fast-forward push. If the named remote is configured as a mirror, disable mirror mode for this invocation with `git -c "remote.$remote.mirror=false" push …`. Check the endpoint with `git ls-remote --exit-code --refs "$push_url" "refs/heads/$branch"`. If the remote advanced beyond the pushed hash, fetch and verify the commit is an ancestor of its tip. Report the commit hash and subject, actual changed paths, and verified remote branch or specific push failure. Retry a failed push with the existing commit hash after rechecking scope and destination.
