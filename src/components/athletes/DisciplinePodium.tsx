import { Link } from 'react-router-dom'
import type { ClassementParDiscipline } from '../../api/types'

const medals = ['🥇', '🥈', '🥉']
const rowAccent = [
  'from-club-accent/20 to-transparent',
  'from-slate-300/30 to-transparent dark:from-slate-500/20',
  'from-amber-700/15 to-transparent',
]

export function DisciplinePodium({ group }: { group: ClassementParDiscipline }) {
  const top = group.classement.slice(0, 3)
  if (top.length === 0) return null

  return (
    <div className="card card-hover overflow-hidden">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-club-primary/10 to-transparent px-4 py-2.5 dark:border-slate-800">
        <span className="font-display font-bold tracking-tight text-club-primary dark:text-club-primary-light">
          {group.discipline}
        </span>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {top.map((entry, i) => (
          <li
            key={`${entry.athlete_id}-${entry.rang}`}
            className={`flex items-center gap-3 bg-gradient-to-r px-4 py-2.5 ${rowAccent[i]}`}
          >
            <span className="w-5 text-center text-lg" aria-hidden>
              {medals[i]}
            </span>
            <Link
              to={`/athletes/${entry.athlete_id}`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 transition hover:text-club-primary dark:text-slate-200 dark:hover:text-club-primary-light"
            >
              {entry.prenom} {entry.nom}
            </Link>
            <span className="shrink-0 text-sm font-bold text-club-primary dark:text-club-primary-light">
              {entry.raw_performance ?? entry.performance_valeur}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
