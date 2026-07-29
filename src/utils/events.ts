import type { EvenementOut } from '../api/types'

const MS_PER_DAY = 86_400_000

/**
 * Parse une date ISO (AAAA-MM-JJ) comme un jour calendaire *local*,
 * pour éviter le décalage d'un jour dû à l'interprétation UTC de `new Date('AAAA-MM-JJ')`.
 *
 * Exportée : l'affichage doit l'utiliser autant que la comparaison, sinon
 * `2026-09-01` se rend « 31 août » dans un fuseau négatif.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (y && m && d) return new Date(y, m - 1, d)
  return new Date(dateStr)
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Une épreuve est « à venir » si sa date est aujourd'hui ou plus tard. */
export function isUpcoming(event: EvenementOut, today: Date = new Date()): boolean {
  return startOfDay(parseLocalDate(event.date)) >= startOfDay(today)
}

/**
 * Répartit les épreuves en `upcoming` (les plus proches d'abord) et
 * `past` (les plus récentes d'abord), en comparant à la date du jour.
 */
export function splitEvents(items: EvenementOut[], today: Date = new Date()) {
  const upcoming: EvenementOut[] = []
  const past: EvenementOut[] = []

  for (const event of items) {
    if (isUpcoming(event, today)) upcoming.push(event)
    else past.push(event)
  }

  upcoming.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
  past.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())

  return { upcoming, past }
}

/** Nombre de jours calendaires jusqu'à l'épreuve (négatif si passée). */
export function daysUntil(event: EvenementOut, today: Date = new Date()): number {
  return Math.round((startOfDay(parseLocalDate(event.date)) - startOfDay(today)) / MS_PER_DAY)
}

/** Compte à rebours lisible : « Aujourd'hui », « Demain », « J-12 ». */
export function countdownLabel(days: number): string {
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `J-${days}`
}

/** Clé de regroupement mensuel, ex. « août 2026 » (sert aussi de libellé). */
export function monthKey(event: EvenementOut): string {
  return parseLocalDate(event.date).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

/** Date en clair, ex. « samedi 15 août 2026 ». */
export function formatLongDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Regroupe des épreuves déjà triées par mois, en conservant leur ordre. */
export function groupByMonth(items: EvenementOut[]): [string, EvenementOut[]][] {
  const groups = new Map<string, EvenementOut[]>()
  for (const event of items) {
    const key = monthKey(event)
    const group = groups.get(key) ?? []
    group.push(event)
    groups.set(key, group)
  }
  return Array.from(groups.entries())
}
