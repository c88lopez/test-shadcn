/**
 * DEMO AUTH ONLY — NOT SECURE.
 *
 * This is a front-end-only mock: credentials are checked in the browser and the
 * "session" is a flag in localStorage. There is no server, no password hashing,
 * and no real session. Anyone can read the credentials from the bundle and set
 * the localStorage key by hand. Do NOT use this for anything real — replace it
 * with a server-side session (e.g. a TanStack Start server function issuing an
 * httpOnly cookie) before going to production.
 *
 * The demo credentials can be overridden via VITE_DEMO_USERNAME /
 * VITE_DEMO_PASSWORD (see .env.example).
 */
const AUTH_KEY = "auth_user"

const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME ?? "admin"
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "admin123"

export function login(username: string, password: string): boolean {
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username }))
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem(AUTH_KEY)
}

export function getUser(): { username: string } | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_KEY)
  return raw ? JSON.parse(raw) : null
}
