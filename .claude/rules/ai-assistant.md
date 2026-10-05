# AI assistant

_Applies to: `src/lib/ai/**`, `src/routes/api/chat.ts`_

- `/api/chat` (`src/routes/api/chat.ts`) streams via the AI SDK through AI Gateway. Tools are built in `src/lib/ai/tools.server.ts`, scoped to the caller's role and active club.
- Write tools (`createPlayer`, `createReservation`, `bulkLoadStockItems`) require user approval (`toolApproval`). Reads can run unattended.
- Model defaults to `openai/gpt-5-nano`; override with the `AI_MODEL` env var. The gateway key is `AI_GATEWAY_API_KEY`; bind approvals with `TOOL_APPROVAL_SECRET`.
- AI tools touch the DB, so they live in a `*.server.ts` module — never import them into client code.
