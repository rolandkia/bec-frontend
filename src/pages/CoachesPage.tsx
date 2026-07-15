import { useQuery } from '@tanstack/react-query'
import { listCoaches } from '../api/coaches'
import { Loading, ErrorMessage } from '../components/ui/Status'

export function CoachesPage() {
  const coachesQuery = useQuery({ queryKey: ['coaches'], queryFn: listCoaches })

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8 text-3xl">Nos coachs</h1>

      {coachesQuery.isLoading && <Loading />}
      {coachesQuery.isError && (
        <ErrorMessage message="Impossible de charger les coachs." />
      )}

      {coachesQuery.data && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {coachesQuery.data.map((coach) => (
            <div key={coach.id} className="card card-hover flex gap-4 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-club-primary-light to-club-primary text-lg font-bold text-white shadow-sm">
                {coach.prenom[0]}
                {coach.nom[0]}
              </div>
              <div>
                <h2 className="font-semibold text-club-primary dark:text-club-primary-light">
                  {coach.prenom} {coach.nom}
                </h2>
                <p className="text-sm font-medium text-club-accent">{coach.role}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{coach.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {coach.disciplines.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
