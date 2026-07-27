import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClassements } from '../api/athletes'
import type { Sexe } from '../api/types'
import { currentSaison } from '../utils/saison'
import { RecordsTable } from '../components/athletes/RecordsTable'
import { Loading, ErrorMessage } from '../components/ui/Status'

const SAISON_EN_COURS = currentSaison()

export function RecordsPage({ embedded = false }: { embedded?: boolean }) {
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
    <div className={embedded ? '' : 'animate-rise'}>
      {!embedded && <h1 className="section-title mb-6">Records du club</h1>}

      {/* Filtres : empilés pleine largeur sur mobile. Les deux groupes de
          pilules côte à côte réclamaient ~365 px dans une colonne de 343 px —
          c'était le débordement horizontal de /competitions?tab=records. */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="segmented">
          {(['homme', 'femme'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={sexe === s} onClick={() => setSexe(s)}>
              {s === 'homme' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>

        <div className="segmented">
          <button
            type="button"
            aria-pressed={periode === 'absolu'}
            onClick={() => setPeriode('absolu')}
          >
            {/* Libellés courts sous sm : « Records absolus » + « Meilleures
                perfs 2025-2026 » ne tiennent pas côte à côte sur un téléphone. */}
            <span className="sm:hidden">Absolus</span>
            <span className="hidden sm:inline">Records absolus</span>
          </button>
          <button
            type="button"
            aria-pressed={periode === 'saison'}
            onClick={() => setPeriode('saison')}
          >
            <span className="sm:hidden">{SAISON_EN_COURS}</span>
            <span className="hidden sm:inline">Meilleures perfs {SAISON_EN_COURS}</span>
          </button>
        </div>

        <select
          value={effectiveDiscipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="select w-full sm:w-auto"
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
