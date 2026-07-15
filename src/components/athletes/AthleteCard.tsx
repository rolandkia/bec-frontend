import { Link } from 'react-router-dom'
import type { AthleteOut } from '../../api/types'

export function AthleteCard({ athlete }: { athlete: AthleteOut }) {
  return (
    <Link
      to={`/athletes/${athlete.id}`}
      className="card card-hover flex items-center gap-4 p-4"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-club-primary-light to-club-primary font-bold text-white shadow-sm">
        {athlete.prenom[0]}
        {athlete.nom[0]}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-club-primary dark:text-club-primary-light">
          {athlete.prenom} {athlete.nom}
        </p>
        <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{athlete.sexe}</p>
      </div>
    </Link>
  )
}
