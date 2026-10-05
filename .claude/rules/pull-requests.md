# Pull requests

- Assign new PRs to the repo owner: `gh pr create --assignee @me`.
- PRs are merged manually (squash), after required checks pass and the Vercel preview has been reviewed. Nothing auto-merges; the head branch is deleted on merge.
- Before opening a PR, make sure `bun run typecheck`, `bun run lint`, and `bun run test` pass.
