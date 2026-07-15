import type { ClubEvent } from '../data/events'

/**
 * Parse une date ISO (AAAA-MM-JJ) comme un jour calendaire *local*,
 * pour éviter le décalage d'un jour dû à l'interprétation UTC de `new Date('AAAA-MM-JJ')`.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (y && m && d) return new Date(y, m - 1, d)
  return new Date(dateStr)
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Une épreuve est « à venir » si sa date est aujourd'hui ou plus tard. */
export function isUpcoming(event: ClubEvent, today: Date = new Date()): boolean {
  return startOfDay(parseLocalDate(event.date)) >= startOfDay(today)
}

/**
 * Répartit les épreuves en `upcoming` (les plus proches d'abord) et
 * `past` (les plus récentes d'abord), en comparant à la date du jour.
 */
export function splitEvents(items: ClubEvent[], today: Date = new Date()) {
  const upcoming: ClubEvent[] = []
  const past: ClubEvent[] = []

  for (const event of items) {
    if (isUpcoming(event, today)) upcoming.push(event)
    else past.push(event)
  }

  upcoming.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
  past.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())

  return { upcoming, past }
}
