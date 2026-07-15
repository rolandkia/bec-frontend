import type { EvenementOut } from '../../api/types'
import { isUpcoming } from '../../utils/events'

const typeEmoji: Record<EvenementOut['type'], string> = {
  Piste: '🏟️',
  Route: '🛣️',
  Cross: '🌿',
  Meeting: '🏅',
}

export function EventRow({ event, today }: { event: EvenementOut; today?: Date }) {
  const date = new Date(event.date)
  const upcoming = isUpcoming(event, today)

  return (
    <div
      className={`card flex items-center gap-4 p-4 ${
        upcoming ? 'card-hover' : 'opacity-80'
      }`}
    >
      {/* Tuile date facon calendrier */}
      <div
        className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center shadow-sm ${
          upcoming
            ? 'bg-gradient-to-br from-club-primary-light to-club-primary text-white'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        <span className="text-lg font-bold leading-none">
          {date.toLocaleDateString('fr-FR', { day: '2-digit' })}
        </span>
        <span className="text-[10px] font-semibold uppercase leading-tight">
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-club-primary dark:text-club-primary-light">
          {event.nom}
        </p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          <span aria-hidden>{typeEmoji[event.type]}</span> {event.lieu} · {event.type}
        </p>
      </div>

      <span
        className={`badge shrink-0 ${
          upcoming
            ? 'bg-club-accent/15 text-club-accent'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {upcoming ? 'À venir' : 'Passé'}
      </span>
    </div>
  )
}
