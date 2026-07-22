import { Link } from 'react-router-dom'
import type { ClassementParDiscipline } from '../../api/types'

// Pastilles de rang façon médailles (or / argent / bronze).
const rankStyles = [
  'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40',
  'bg-slate-300/15 text-slate-200 ring-1 ring-slate-300/30',
  'bg-orange-700/20 text-orange-300 ring-1 ring-orange-600/40',
]

export function DisciplinePodium({ group }: { group: ClassementParDiscipline }) {
  const top = group.classement.slice(0, 3)
  if (top.length === 0) return null

  return (
    <div className="card card-hover overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[color:var(--color-line)] px-4 py-3">
        <span className="h-4 w-1 rounded-full bg-club-primary" aria-hidden />
        <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          {group.discipline}
        </span>
      </div>
      <ul>
        {top.map((entry, i) => (
          <li
            key={`${entry.athlete_id}-${entry.rang}`}
            className={`flex items-center gap-3 px-4 py-3 ${
              i === 0 ? 'bg-club-primary/[0.06]' : 'border-t border-[color:var(--color-line)]/60'
            }`}
          >
            <span
              className={`tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankStyles[i]}`}
              aria-hidden
            >
              {entry.rang}
            </span>
            <Link
              to={`/athletes/${entry.athlete_id}`}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100 transition hover:text-club-primary-light"
            >
              {entry.prenom} {entry.nom}
            </Link>
            <span className="tabular shrink-0 font-display text-base font-bold text-white">
              {entry.raw_performance ?? entry.performance_valeur}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
