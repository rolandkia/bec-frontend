import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../api/athletes'
import { AthleteCard } from '../components/athletes/AthleteCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { RevealGroup, motion, staggerItem } from '../components/ui/motion'

export function AthletesListPage() {
  const [search, setSearch] = useState('')
  const [sexe, setSexe] = useState<'tous' | 'homme' | 'femme'>('tous')

  const { data: athletes, isLoading, isError } = useQuery({
    queryKey: ['athletes'],
    queryFn: listAthletes,
  })

  const filtered = useMemo(() => {
    if (!athletes) return []
    const query = search.trim().toLowerCase()
    return athletes.filter((a) => {
      const matchesSearch =
        !query || `${a.prenom} ${a.nom}`.toLowerCase().includes(query)
      const matchesSexe = sexe === 'tous' || a.sexe === sexe
      return matchesSearch && matchesSexe
    })
  }, [athletes, search, sexe])

  return (
    <div className="animate-rise">
      {/* En-tête éditorial — photo du groupe */}
      <div className="band mb-8 border border-[color:var(--color-line)]">
        <img
          src="/photos/group.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/40" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            L'effectif
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Athlètes
          </h1>
          {athletes && (
            <p className="mt-2 text-[color:var(--color-muted)]">
              {athletes.length} athlètes licenciés
            </p>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un athlète…"
          className="w-full min-w-0 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-2 text-sm text-[color:var(--color-fg)] shadow-sm transition placeholder:text-[color:var(--color-muted)] focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30 sm:w-72"
        />
        <div className="flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-0.5">
          {(['tous', 'homme', 'femme'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSexe(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                sexe === s
                  ? 'bg-club-primary text-white shadow-sm'
                  : 'text-[color:var(--color-muted)] hover:text-white'
              }`}
            >
              {s === 'tous' ? 'Tous' : s === 'homme' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les athlètes." />}
      {filtered.length === 0 && !isLoading && !isError && (
        <p className="text-[color:var(--color-muted)]">
          Aucun athlète ne correspond à ces critères.
        </p>
      )}
      <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((athlete) => (
          <motion.div key={athlete.id} variants={staggerItem}>
            <AthleteCard athlete={athlete} />
          </motion.div>
        ))}
      </RevealGroup>
    </div>
  )
}
