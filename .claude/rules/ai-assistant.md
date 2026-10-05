# AI assistant

_Applies to: `src/lib/ai/**`, `src/routes/api/chat.ts`, `src/routes/api/transcribe.ts`_

- `/api/chat` (`src/routes/api/chat.ts`) streams via the AI SDK through AI Gateway. Tools are built in `src/lib/ai/tools.server.ts`, scoped to the caller's role and active club.
- Write tools (`createPlayer`, `createReservation`, `bulkLoadStockItems`) require user approval (`toolApproval`). Reads can run unattended.
- Model defaults to `openai/gpt-5-nano`; override with the `AI_MODEL` env var.
- Voice input: the panel records with `MediaRecorder` (`use-voice-recorder.ts`) and posts the audio to `/api/transcribe` (`src/routes/api/transcribe.ts`), which transcribes through AI Gateway (`AI_TRANSCRIPTION_MODEL`, default `openai/gpt-4o-mini-transcribe`). The transcript only fills the composer; the user reviews and sends it. Limits live in `src/lib/voice.ts`. The gateway key is `AI_GATEWAY_API_KEY`; bind approvals with `TOOL_APPROVAL_SECRET`.
- AI tools touch the DB, so they live in a `*.server.ts` module — never import them into client code.
