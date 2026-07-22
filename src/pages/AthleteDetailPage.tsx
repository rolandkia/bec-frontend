import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getAthlete, getNiveau, getResultats, getRP } from '../api/athletes'
import type { RPOut } from '../api/types'
import { PerformanceTable } from '../components/athletes/PerformanceTable'
import { PerformanceChart } from '../components/athletes/PerformanceChart'
import { LevelBadge } from '../components/athletes/LevelBadge'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'
import { computeNiveauSaison } from '../utils/niveau'
import { currentSaison } from '../utils/saison'
import { ffaProfileUrl } from '../utils/ffa'
import { Reveal } from '../components/ui/motion'

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

  const currentNiveau = computeNiveauSaison(athlete.resultats, currentSaison())
  const initials = `${athlete.prenom[0] ?? ''}${athlete.nom[0] ?? ''}`

  return (
    <div className="animate-rise">
      <Link
        to="/athletes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux athlètes
      </Link>

      {/* Hero athlète — portrait + identité */}
      <div className="band mb-10 border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
        <div className="grid md:grid-cols-[minmax(0,300px)_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[320px]">
            {athlete.photo_url ? (
              <img
                src={athlete.photo_url}
                alt={`${athlete.prenom} ${athlete.nom}`}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary">
                <img
                  src="/photos/logo.webp"
                  alt=""
                  aria-hidden
                  className="absolute inset-0 m-auto h-2/3 w-2/3 object-contain opacity-[0.10]"
                />
                <span className="font-display text-7xl font-bold uppercase text-white/90">
                  {initials}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-surface)] via-transparent to-transparent md:bg-gradient-to-r" />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Athlète du club
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {athlete.prenom} {athlete.nom}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm capitalize text-[color:var(--color-muted)]">
                {athlete.sexe}
              </span>
              {currentNiveau && <LevelBadge niveau={currentNiveau} />}
            </div>
            <div className="mt-2">
              <a
                href={ffaProfileUrl(athlete.ffa_id)}
                target="_blank"
                rel="noreferrer"
                className="btn-ffa"
              >
                Profil FFA
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <Reveal className="mb-10">
        <h2 className="section-title mb-4">Records personnels</h2>
        {(rpOfficielQuery.isLoading || rpToutesQuery.isLoading) && <Loading />}
        {(rpOfficielQuery.isError || rpToutesQuery.isError) && (
          <ErrorMessage message="Impossible de charger les records personnels." />
        )}
        {!rpOfficielQuery.isLoading && !rpToutesQuery.isLoading && rpCards.length === 0 && (
          <p className="text-[color:var(--color-muted)]">Aucun record personnel pour le moment.</p>
        )}
        {rpCards.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rpCards.map(({ discipline, officiel, nonHomologue }) => {
              // Marque principale à afficher en tête : le record officiel, ou à
              // défaut (aucune perf homologuée) la meilleure marque disponible.
              const principale = officiel ?? nonHomologue
              if (!principale) return null

              return (
                <div key={discipline} className="card card-hover p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    {discipline}
                  </p>
                  {/* Record officiel = distinction → OR (politique d'usage de l'or) */}
                  <p className="stat mt-1 text-3xl text-club-accent">
                    {principale.raw_performance ?? principale.performance_valeur}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                    {principale.date ? new Date(principale.date).toLocaleDateString('fr-FR') : '—'} ·{' '}
                    {principale.lieu ?? '—'}
                  </p>

                  {/* Marque non homologuée (vent favorable) : affichée en escalier
                      sous le record officiel lorsqu'elle est meilleure. Style
                      neutre — l'or reste réservé au record OFFICIEL. */}
                  {officiel && nonHomologue && (
                    <div className="mt-3 ml-1 border-l-2 border-[color:var(--color-line)] pl-3">
                      <span className="badge bg-white/5 text-[color:var(--color-muted)] ring-1 ring-white/10">
                        Non homologué
                      </span>
                      <p className="tabular mt-1 font-display text-lg font-bold text-white">
                        {nonHomologue.raw_performance ?? nonHomologue.performance_valeur}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                        {nonHomologue.date ? new Date(nonHomologue.date).toLocaleDateString('fr-FR') : '—'} ·{' '}
                        {nonHomologue.lieu ?? '—'}
                        {nonHomologue.vent != null && ` · vent ${nonHomologue.vent}`}
                      </p>
                    </div>
                  )}

                  {!officiel && nonHomologue && (
                    <span
                      className="badge mt-2 inline-flex bg-white/5 text-[color:var(--color-muted)] ring-1 ring-white/10"
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
      </Reveal>

      {niveauQuery.data && niveauQuery.data.length > 0 && (
        <Reveal className="mb-10">
          <h2 className="section-title mb-4">Progression par saison</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {niveauQuery.data.map((n) => (
              <div
                key={n.saison}
                className="card flex min-w-[120px] shrink-0 flex-col items-center gap-2 px-4 py-3 text-center"
              >
                <span className="tabular text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                  {n.saison}
                </span>
                {n.niveau ? (
                  <LevelBadge niveau={n.niveau} />
                ) : (
                  <span className="badge bg-white/5 text-[color:var(--color-muted)] ring-1 ring-white/10">
                    —
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>
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
