import type { LucideIcon } from 'lucide-react'
import { LandPlot, Route, Trees, Medal, MapPin } from 'lucide-react'
import type { EvenementOut } from '../../api/types'
import { isUpcoming } from '../../utils/events'

const typeIcon: Record<EvenementOut['type'], LucideIcon> = {
  Piste: LandPlot,
  Route: Route,
  Cross: Trees,
  Meeting: Medal,
}

export function EventRow({ event, today }: { event: EvenementOut; today?: Date }) {
  const date = new Date(event.date)
  const upcoming = isUpcoming(event, today)

  return (
    <div className={`card flex items-center gap-4 p-4 ${upcoming ? 'card-hover' : 'opacity-60'}`}>
      {/* Tuile date façon scoreboard */}
      <div
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${
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
        <p className="truncate font-display font-bold text-white">{event.nom}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--color-muted)]">
          <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{event.lieu}</span>
          <span className="opacity-40">·</span>
          {(() => {
            const Icon = typeIcon[event.type]
            return <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          })()}
          <span className="uppercase tracking-wide">{event.type}</span>
        </p>
      </div>

      <span
        className={`badge shrink-0 uppercase tracking-wide ${
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
