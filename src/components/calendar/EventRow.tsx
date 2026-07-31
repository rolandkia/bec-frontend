import { MapPin } from 'lucide-react'
import type { EvenementOut } from '../../api/types'
import { isUpcoming, parseLocalDate } from '../../utils/events'
import { typeIcon } from './eventType'

export function EventRow({ event, today }: { event: EvenementOut; today?: Date }) {
  // parseLocalDate (et non `new Date`) : `new Date('2026-09-01')` est minuit UTC,
  // soit le 31 août dans un fuseau négatif.
  const date = parseLocalDate(event.date)
  const upcoming = isUpcoming(event, today)
  const Icon = typeIcon[event.type]

  return (
    <div
      className={`card tap flex items-center gap-3 p-3 sm:gap-4 sm:p-4 ${upcoming ? 'card-hover' : 'opacity-60'}`}
    >
      {/* Tuile date façon scoreboard */}
      <div
        className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl sm:h-16 sm:w-16 ${
          upcoming
            ? 'bg-club-primary text-white shadow-lg shadow-club-primary/25'
            : 'bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]'
        }`}
      >
        <span className="tabular font-display text-2xl font-bold leading-none">
          {date.toLocaleDateString('fr-FR', { day: '2-digit' })}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide">
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        {/* line-clamp plutôt que truncate : plus de coupe à mi-mot sur mobile. */}
        <p className="line-clamp-2 font-display font-bold leading-snug">{event.nom}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--color-muted)]">
          <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{event.lieu}</span>
          <span className="opacity-40">·</span>
          <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="uppercase tracking-wide">{event.type}</span>
        </p>
      </div>

      {/* Masqué sous sm : redondant avec la couleur de la tuile de date (et
          l'opacity-60 de la carte pour un événement passé), il ne laissait que
          ~110 px au nom ET au lieu. */}
      <span
        className={`badge hidden shrink-0 uppercase tracking-wide sm:inline-flex ${
          upcoming
            ? 'border border-club-primary/40 bg-club-primary/15 text-club-primary-light'
            : 'bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]'
        }`}
      >
        {upcoming ? 'À venir' : 'Passé'}
      </span>
    </div>
  )
}
