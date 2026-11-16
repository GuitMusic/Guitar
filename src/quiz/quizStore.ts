/** Note finder settings and scores, kept in localStorage. */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const v = JSON.parse(raw)
    return (Array.isArray(fallback) ? (Array.isArray(v) ? v : fallback) : { ...fallback, ...v }) as T
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be unavailable */
  }
}
