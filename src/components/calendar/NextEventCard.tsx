import { MapPin } from 'lucide-react'
import type { EvenementOut } from '../../api/types'
import { countdownLabel, daysUntil, formatLongDate, parseLocalDate } from '../../utils/events'
import { typeIcon } from './eventType'

/**
 * Ancre visuelle de la frise : LA prochaine épreuve, avec compte à rebours.
 * Volontairement sans fond photo — la bande immersive « prochaine compétition »
 * de l'accueil garde ce rôle, ici on veut l'information dense et lisible.
 */
export function NextEventCard({ event, today }: { event: EvenementOut; today?: Date }) {
  const date = parseLocalDate(event.date)
  const days = daysUntil(event, today)
  const Icon = typeIcon[event.type]

  return (
    <div className="card border-l-2 border-l-club-primary p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge-live uppercase tracking-wide">Prochaine épreuve</span>
        <span className="stat tabular text-2xl text-club-primary-light sm:text-3xl">
          {countdownLabel(days)}
        </span>
      </div>

      {/* Tuile date et libellé côte à côte dès le mobile (même parti que l'accueil). */}
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4 sm:gap-6">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-club-primary text-white shadow-xl shadow-club-primary/30 sm:h-24 sm:w-24">
          <span className="tabular font-display text-3xl font-bold leading-none sm:text-4xl">
            {date.toLocaleDateString('fr-FR', { day: '2-digit' })}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] sm:text-xs">
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold leading-tight text-white sm:text-3xl">
            {event.nom}
          </h2>
          {/* first-letter et non capitalize : en français seul le jour prend la
              majuscule (« samedi 15 août 2026 » → « Samedi 15 août 2026 »). */}
          <p className="mt-1.5 text-sm text-[color:var(--color-muted)] first-letter:uppercase">
            {formatLongDate(event.date)}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-muted)]">
            <MapPin aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{event.lieu}</span>
            <span className="opacity-40">·</span>
            <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="uppercase tracking-wide">{event.type}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
