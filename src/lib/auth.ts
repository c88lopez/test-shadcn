const AUTH_KEY = "auth_user"

export function login(username: string, password: string): boolean {
  if (username === "admin" && password === "admin123") {
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
