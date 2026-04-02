// RFC5322-lite validation — good enough for a chip input.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}
