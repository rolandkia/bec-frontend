/** Réplique la logique backend : la saison va de septembre (année N) à août (année N+1). */
export function currentSaison(today: Date = new Date()): string {
  const year = today.getFullYear()
  const month = today.getMonth() + 1 // 1-12
  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}
