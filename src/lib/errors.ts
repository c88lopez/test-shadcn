import type { TFunction } from "i18next"

// Shared, dependency-free error model. Server functions throw `AppError` with a
// stable `code` (mapping to an `errors.*` i18n key) plus optional interpolation
// `params`. The code + params are serialized into the Error `message` so they
// survive the server→client boundary, then `translateError` localizes them in
// the user's language on the client. API routes keep their own English JSON
// contract (see api-auth.ts) and don't use this.

export type ErrorParams = Record<string, string | number>

interface SerializedAppError {
  __appError: true
  code: string
  params?: ErrorParams
}

export class AppError extends Error {
  code: string
  params?: ErrorParams

  constructor(code: string, params?: ErrorParams) {
    super(JSON.stringify({ __appError: true, code, params }))
    this.name = "AppError"
    this.code = code
    this.params = params
  }
}

function parsePayload(message: string): SerializedAppError | null {
  try {
    const parsed: unknown = JSON.parse(message)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "__appError" in parsed &&
      parsed.__appError === true
    ) {
      return parsed as SerializedAppError
    }
  } catch {
    // Not an AppError payload (a plain Error or sanitized message).
  }
  return null
}

/**
 * Localizes a thrown error for display. Errors thrown as `AppError` carry a code
 * (+ params) that maps to an `errors.*` i18n key; anything else falls back to
 * the provided `fallback`, then the raw message, then a generic message.
 */
export function translateError(
  error: unknown,
  t: TFunction,
  fallback?: string
): string {
  const message = error instanceof Error ? error.message : ""
  const payload = parsePayload(message)
  // Codes/params are dynamic at runtime, so bypass the per-key typed-params
  // overload of `t` with a loose signature.
  const translate = t as unknown as (
    key: string,
    params?: ErrorParams
  ) => string
  if (payload) {
    return translate(payload.code, payload.params)
  }
  return fallback ?? (message || translate("common.genericError"))
}
