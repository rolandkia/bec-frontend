import { useMemo, useState } from 'react'
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
    queryKey: ['classements', sexe, periode],
    queryFn: () =>
      getClassements({
        sexe,
        homologue: true,
        saison: periode === 'saison' ? SAISON_EN_COURS : undefined,
      }),
  })

  // Options du filtre : toutes les disciplines ayant au moins un résultat, triées.
  const disciplines = useMemo(
    () =>
      (data ?? [])
        .filter((d) => d.classement.length > 0)
        .map((d) => d.discipline)
        .sort(),
    [data],
  )

  // Si la discipline sélectionnée n'existe plus (changement de sexe/période),
  // on retombe proprement sur « Toutes les disciplines ».
  const effectiveDiscipline = disciplines.includes(discipline) ? discipline : ''

  const filteredData = useMemo(
    () =>
      (data ?? []).filter(
        (d) => !effectiveDiscipline || d.discipline === effectiveDiscipline,
      ),
    [data, effectiveDiscipline],
  )

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

        <select
          value={effectiveDiscipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="select"
          aria-label="Filtrer par discipline"
        >
          <option value="">Toutes les disciplines</option>
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les records." />}
      {data && <RecordsTable data={filteredData} />}
    </div>
  )
}
