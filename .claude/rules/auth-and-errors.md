# Auth, permissions & scoping

- Roles and the permission matrix live in `src/lib/permissions.ts` (`can(role, permission)`), shared by server enforcement and client UI gating. `Super Admin` bypasses all checks.
- Server functions enforce access via `auth.server.ts`: `requireSession`, `requirePermission`, `currentClubId` (scoping reads), `requireClubId(permission)` (scoping + authorizing writes).
- Almost all data is **club-scoped**. Every query filters by the active club id; never trust a client-supplied club id. Super admins switch clubs via the `active_club_id` cookie.
- Route guards (`route-guards.ts` `ensurePermission`) are UX-only redirects; server functions are the real authority.
- REST routes under `src/routes/api/*` use `api-auth.ts` (`requireApiAccess`): accepts either a `Bearer ADMIN_API_KEY` token or a permitted session, plus `apiErrorResponse` for consistent JSON errors. Use constant-time comparison for secrets; never log or expose them.

# Error handling

- Server functions throw `AppError(code, params)` from `src/lib/errors.ts`. The `code` maps to an `errors.*` i18n key, is serialized across the server→client boundary, and is localized on the client with `translateError(err, t)`.
- REST API routes keep their own English JSON contract via `ApiError` — do not mix the two models.
