import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAthlete, getNiveau, getResultats, getRP } from '../api/athletes'
import type { RPOut } from '../api/types'
import { PerformanceTable } from '../components/athletes/PerformanceTable'
import { PerformanceChart } from '../components/athletes/PerformanceChart'
import { LevelBadge } from '../components/athletes/LevelBadge'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

interface RPCard {
  discipline: string
  officiel: RPOut | null
  nonHomologue: RPOut | null
}

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

  const rpOfficielQuery = useQuery({
    queryKey: ['athlete-rp', athleteId, 'officiel'],
    queryFn: () => getRP(athleteId, { homologue: true }),
    enabled: Number.isFinite(athleteId),
  })

  // homologue: false pour retrouver aussi la meilleure marque réalisée avec un
  // vent favorable (donc non homologable), affichée en complément du record officiel.
  const rpToutesQuery = useQuery({
    queryKey: ['athlete-rp', athleteId, 'toutes'],
    queryFn: () => getRP(athleteId, { homologue: false }),
    enabled: Number.isFinite(athleteId),
  })

  const rpCards = useMemo((): RPCard[] => {
    const officiels = new Map((rpOfficielQuery.data ?? []).map((rp) => [rp.discipline, rp]))
    const toutes = new Map((rpToutesQuery.data ?? []).map((rp) => [rp.discipline, rp]))
    const disciplines = new Set([...officiels.keys(), ...toutes.keys()])

    return Array.from(disciplines)
      .sort()
      .map((discipline) => {
        const officiel = officiels.get(discipline) ?? null
        const meilleure = toutes.get(discipline) ?? null
        const nonHomologue =
          meilleure && meilleure.resultat_id !== officiel?.resultat_id ? meilleure : null
        return { discipline, officiel, nonHomologue }
      })
  }, [rpOfficielQuery.data, rpToutesQuery.data])

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

  const allResultats = useMemo(() => resultatsQuery.data?.items ?? [], [resultatsQuery.data])

  const disciplines = useMemo(() => {
    const set = new Set(allResultats.map((r) => r.epreuve))
    return Array.from(set).sort()
  }, [allResultats])

  const selectedDiscipline = discipline ?? disciplines[0] ?? null

  // Saisons disponibles pour la discipline sélectionnée (les plus récentes d'abord)
  const saisons = useMemo(() => {
    const relevant = selectedDiscipline
      ? allResultats.filter((r) => r.epreuve === selectedDiscipline)
      : allResultats
    const set = new Set(relevant.map((r) => r.saison).filter((s): s is string => Boolean(s)))
    return Array.from(set).sort().reverse()
  }, [allResultats, selectedDiscipline])

  const filteredResultats = useMemo(() => {
    return allResultats.filter((r) => {
      const matchesDiscipline = !selectedDiscipline || r.epreuve === selectedDiscipline
      const matchesSaison = saison === TOUTES_SAISONS || r.saison === saison
      return matchesDiscipline && matchesSaison
    })
  }, [allResultats, selectedDiscipline, saison])

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
        {(rpOfficielQuery.isLoading || rpToutesQuery.isLoading) && <Loading />}
        {(rpOfficielQuery.isError || rpToutesQuery.isError) && (
          <ErrorMessage message="Impossible de charger les records personnels." />
        )}
        {!rpOfficielQuery.isLoading && !rpToutesQuery.isLoading && rpCards.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">Aucun record personnel pour le moment.</p>
        )}
        {rpCards.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rpCards.map(({ discipline, officiel, nonHomologue }) => {
              // Marque principale à afficher en tête : le record officiel, ou à
              // défaut (aucune perf homologuée) la meilleure marque disponible.
              const principale = officiel ?? nonHomologue
              if (!principale) return null

              return (
                <div key={discipline} className="card card-hover p-4">
                  <p className="text-sm font-semibold text-club-accent">{discipline}</p>
                  <p className="mt-0.5 text-2xl font-bold text-club-primary dark:text-club-primary-light">
                    {principale.raw_performance ?? principale.performance_valeur}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {principale.date ? new Date(principale.date).toLocaleDateString('fr-FR') : '—'} ·{' '}
                    {principale.lieu ?? '—'}
                  </p>

                  {/* Marque non homologuée (vent favorable) : affichée en escalier
                      sous le record officiel lorsqu'elle est meilleure. */}
                  {officiel && nonHomologue && (
                    <div className="mt-3 ml-4 border-l-2 border-amber-300 pl-3 dark:border-amber-700/60">
                      <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        Non homologué
                      </span>
                      <p className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-200">
                        {nonHomologue.raw_performance ?? nonHomologue.performance_valeur}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {nonHomologue.date ? new Date(nonHomologue.date).toLocaleDateString('fr-FR') : '—'} ·{' '}
                        {nonHomologue.lieu ?? '—'}
                        {nonHomologue.vent != null && ` · vent ${nonHomologue.vent}`}
                      </p>
                    </div>
                  )}

                  {!officiel && nonHomologue && (
                    <span
                      className="badge mt-2 inline-flex bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      title={`Non homologué (vent ${nonHomologue.vent ?? '?'} m/s)`}
                    >
                      Non homologué
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {niveauQuery.data && niveauQuery.data.length > 0 && (
        <section className="mb-10">
          <h2 className="section-title mb-4">Niveau par saison</h2>
          <div className="flex flex-wrap gap-3">
            {niveauQuery.data.map((n) => (
              <span
                key={n.saison}
                className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
              >
                <span className="font-medium">{n.saison}</span>
                {n.niveau ? (
                  <LevelBadge niveau={n.niveau} />
                ) : (
                  <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    —
                  </span>
                )}
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
                className="select"
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
                className="select"
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
