import { useQuery } from '@tanstack/react-query'
import { listCoaches } from '../api/coaches'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { RevealGroup, motion, staggerItem } from '../components/ui/motion'
import { Avatar } from '../components/ui/Avatar'

export function CoachesPage({ embedded = false }: { embedded?: boolean }) {
  const coachesQuery = useQuery({ queryKey: ['coaches'], queryFn: listCoaches })

  return (
    <div className={embedded ? '' : 'animate-rise'}>
      {!embedded && <h1 className="section-title mb-8 text-3xl">Nos coachs</h1>}

      {coachesQuery.isLoading && <Loading />}
      {coachesQuery.isError && <ErrorMessage message="Impossible de charger les coachs." />}

      {coachesQuery.data && (
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {coachesQuery.data.map((coach) => (
            <motion.div
              key={coach.id}
              variants={staggerItem}
              className="card card-hover flex gap-4 p-5"
            >
              <Avatar
                src={coach.photo_url}
                alt={`${coach.prenom} ${coach.nom}`}
                initials={`${coach.prenom[0] ?? ''}${coach.nom[0] ?? ''}`}
              />
              <div className="min-w-0">
                <h2 className="font-display font-bold text-white">
                  {coach.prenom} {coach.nom}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-club-accent-light">
                  {coach.role}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted)]">
                  {coach.bio}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {coach.disciplines.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-[color:var(--color-surface-2)] px-2.5 py-0.5 text-xs text-[color:var(--color-muted)] ring-1 ring-[color:var(--color-line)]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </RevealGroup>
      )}
    </div>
  )
}
