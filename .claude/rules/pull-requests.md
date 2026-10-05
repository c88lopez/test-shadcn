# Pull requests

- Assign new PRs to the repo owner: `gh pr create --assignee @me`.
- Auto-merge is enabled automatically for non-draft PRs and squash-merges once required checks pass, then deletes the branch.
- PRs touching `.github/**` are excluded from auto-merge and require a manual human merge.
- Before opening a PR, make sure `bun run typecheck`, `bun run lint`, and `bun run test` pass.
