import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClassements } from '../api/athletes'
import type { Sexe } from '../api/types'
import { currentSaison } from '../utils/saison'
import { RecordsTable } from '../components/athletes/RecordsTable'
import { Loading, ErrorMessage } from '../components/ui/Status'

const SAISON_EN_COURS = currentSaison()

export function RecordsPage() {
  const [sexe, setSexe] = useState<Sexe>('homme')
  const [periode, setPeriode] = useState<'absolu' | 'saison'>('absolu')
  const [discipline, setDiscipline] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['classements', sexe, periode, discipline],
    queryFn: () =>
      getClassements({
        sexe,
        homologue: true,
        saison: periode === 'saison' ? SAISON_EN_COURS : undefined,
        discipline: discipline.trim() || undefined,
      }),
  })

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-6 text-3xl">Records du club</h1>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
          {(['homme', 'femme'] as const).map((s) => (
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
              {s === 'homme' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>

        <div className="flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPeriode('absolu')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              periode === 'absolu'
                ? 'bg-club-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Records absolus
          </button>
          <button
            type="button"
            onClick={() => setPeriode('saison')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              periode === 'saison'
                ? 'bg-club-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Meilleures perfs {SAISON_EN_COURS}
          </button>
        </div>

        <input
          type="text"
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          placeholder="Filtrer par discipline (ex: 100m)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30 dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les records." />}
      {data && <RecordsTable data={data} />}
    </div>
  )
}
