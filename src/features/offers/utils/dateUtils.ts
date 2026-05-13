export function todayString(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}
