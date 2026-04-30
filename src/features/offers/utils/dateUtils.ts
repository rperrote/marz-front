export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}
