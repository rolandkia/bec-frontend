import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../api/athletes'
import { AthleteCard } from '../components/athletes/AthleteCard'
import { Loading, ErrorMessage } from '../components/ui/Status'

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
        !query ||
        `${a.prenom} ${a.nom}`.toLowerCase().includes(query)
      const matchesSexe = sexe === 'tous' || a.sexe === sexe
      return matchesSearch && matchesSexe
    })
  }, [athletes, search, sexe])

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-6 text-3xl">Athlètes</h1>

      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un athlète…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30 dark:border-slate-800 dark:bg-slate-900"
        />
        <div className="flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
          {(['tous', 'homme', 'femme'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSexe(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                sexe === s
                  ? 'bg-club-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
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
        <p className="text-slate-500 dark:text-slate-400">Aucun athlète ne correspond à ces critères.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((athlete) => (
          <AthleteCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </div>
  )
}
