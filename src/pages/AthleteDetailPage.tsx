import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAthlete, getNiveau, getResultats, getRP } from '../api/athletes'
import { PerformanceTable } from '../components/athletes/PerformanceTable'
import { PerformanceChart } from '../components/athletes/PerformanceChart'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

const TOUTES_SAISONS = ''

export function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const athleteId = Number(id)
  const [discipline, setDiscipline] = useState<string | null>(null)
  const [saison, setSaison] = useState<string>(TOUTES_SAISONS)

  const athleteQuery = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => getAthlete(athleteId),
    enabled: Number.isFinite(athleteId),
    retry: false,
  })

  const rpQuery = useQuery({
    queryKey: ['athlete-rp', athleteId],
    queryFn: () => getRP(athleteId),
    enabled: Number.isFinite(athleteId),
  })

  const resultatsQuery = useQuery({
    queryKey: ['athlete-resultats', athleteId],
    queryFn: () => getResultats(athleteId),
    enabled: Number.isFinite(athleteId),
  })

  const niveauQuery = useQuery({
    queryKey: ['athlete-niveau', athleteId],
    queryFn: () => getNiveau(athleteId),
    enabled: Number.isFinite(athleteId),
  })

  const disciplines = useMemo(() => {
    const set = new Set((resultatsQuery.data ?? []).map((r) => r.epreuve))
    return Array.from(set).sort()
  }, [resultatsQuery.data])

  const selectedDiscipline = discipline ?? disciplines[0] ?? null

  // Saisons disponibles pour la discipline sélectionnée (les plus récentes d'abord)
  const saisons = useMemo(() => {
    const all = resultatsQuery.data ?? []
    const relevant = selectedDiscipline
      ? all.filter((r) => r.epreuve === selectedDiscipline)
      : all
    const set = new Set(relevant.map((r) => r.saison).filter((s): s is string => Boolean(s)))
    return Array.from(set).sort().reverse()
  }, [resultatsQuery.data, selectedDiscipline])

  const filteredResultats = useMemo(() => {
    const all = resultatsQuery.data ?? []
    return all.filter((r) => {
      const matchesDiscipline = !selectedDiscipline || r.epreuve === selectedDiscipline
      const matchesSaison = saison === TOUTES_SAISONS || r.saison === saison
      return matchesDiscipline && matchesSaison
    })
  }, [resultatsQuery.data, selectedDiscipline, saison])

  if (athleteQuery.isLoading) return <Loading />

  if (athleteQuery.isError) {
    const status = (athleteQuery.error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Athlète introuvable" message="Cet athlète n'existe pas." />
    }
    return <ErrorMessage message="Impossible de charger cet athlète." />
  }

  const athlete = athleteQuery.data
  if (!athlete) return null

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div className="animate-rise">
      <Link
        to="/athletes"
        className="mb-6 inline-block text-sm text-slate-500 transition hover:text-club-primary dark:text-slate-400 dark:hover:text-club-primary-light"
      >
        ← Retour aux athlètes
      </Link>

      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-club-primary-light to-club-primary text-xl font-bold text-white shadow-md">
          {athlete.prenom[0]}
          {athlete.nom[0]}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-club-primary dark:text-club-primary-light">
            {athlete.prenom} {athlete.nom}
          </h1>
          <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{athlete.sexe}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="section-title mb-4">Records personnels</h2>
        {rpQuery.isLoading && <Loading />}
        {rpQuery.isError && <ErrorMessage message="Impossible de charger les records personnels." />}
        {rpQuery.data && rpQuery.data.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">Aucun record personnel homologué pour le moment.</p>
        )}
        {rpQuery.data && rpQuery.data.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rpQuery.data.map((rp) => (
              <div key={rp.resultat_id} className="card card-hover p-4">
                <p className="text-sm font-semibold text-club-accent">{rp.discipline}</p>
                <p className="mt-0.5 text-2xl font-bold text-club-primary dark:text-club-primary-light">
                  {rp.raw_performance ?? rp.performance_valeur}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {rp.date ? new Date(rp.date).toLocaleDateString('fr-FR') : '—'} · {rp.lieu ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {niveauQuery.data && niveauQuery.data.length > 0 && (
        <section className="mb-10">
          <h2 className="section-title mb-4">Niveau par saison</h2>
          <div className="flex flex-wrap gap-2">
            {niveauQuery.data.map((n) => (
              <span
                key={n.saison}
                className="badge border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60"
              >
                {n.saison} : <span className="font-bold text-club-primary dark:text-club-primary-light">{n.niveau ?? '—'}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Historique des performances</h2>
          <div className="flex flex-wrap gap-2">
            {disciplines.length > 0 && (
              <select
                value={selectedDiscipline ?? ''}
                onChange={(e) => {
                  setDiscipline(e.target.value)
                  setSaison(TOUTES_SAISONS)
                }}
                className={selectClass}
                aria-label="Filtrer par discipline"
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            {saisons.length > 0 && (
              <select
                value={saison}
                onChange={(e) => setSaison(e.target.value)}
                className={selectClass}
                aria-label="Filtrer par saison"
              >
                <option value={TOUTES_SAISONS}>Toutes les saisons</option>
                {saisons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {resultatsQuery.isLoading && <Loading />}
        {resultatsQuery.isError && <ErrorMessage message="Impossible de charger l'historique." />}

        {resultatsQuery.data && (
          <>
            <div className="mb-6">
              <PerformanceChart resultats={filteredResultats} />
            </div>
            <PerformanceTable resultats={filteredResultats} />
          </>
        )}
      </section>
    </div>
  )
}
