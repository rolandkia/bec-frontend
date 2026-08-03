import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getAthlete, getNiveau, getRP } from '../api/athletes'
import type { AthleteListItem, AthleteOut, RPOut } from '../api/types'
import { PerformanceTable } from '../components/athletes/PerformanceTable'
import { LevelBadge } from '../components/athletes/LevelBadge'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'
import { computeNiveauSaison } from '../utils/niveau'
import { currentSaison } from '../utils/saison'
import { ffaProfileUrl } from '../utils/ffa'
import { getInitials } from '../utils/initials'
import { cldPortrait } from '../lib/cloudinary'
import { prefetchChunk } from '../lib/prefetch'
import { performanceChart } from '../lib/routeChunks'
import { Reveal } from '../components/ui/motion'

/* Le GRAPHIQUE part dans son propre morceau : Recharts pèse à lui seul plus que
   tout le reste de cette page (elle passait de ~30 ko à 390 ko), pour un bloc
   qui est presque toujours sous la ligne de flottaison. Tant qu'il n'est pas
   arrivé, sa place est tenue par un cadre de même hauteur — donc aucun saut de
   mise en page quand il se substitue. Le morceau est demandé dès que la fiche
   est montée (cf. `useEffect` plus bas), pas au moment où le bloc devient
   visible : le lecteur qui défile ne doit pas attendre à son tour. */
const PerformanceChart = lazy(() =>
  performanceChart().then((m) => ({ default: m.PerformanceChart })),
)

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
  // Repli si l'URL Cloudinary est morte (le glyphe « image cassée » sinon).
  const [photoFailed, setPhotoFailed] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => prefetchChunk(performanceChart), [])

  /* ─── L'identité s'affiche AVANT le premier aller-retour ────────────────────
     Le visiteur arrive presque toujours de l'effectif ou d'un classement, où la
     liste `['athletes']` est déjà en cache : nom, prénom, sexe, portrait et
     niveau de la saison y sont DÉJÀ, exactement ce que porte l'en-tête de cette
     fiche. La page les attendait quand même du serveur, et rendait un écran vide
     avec « Chargement… » pendant ce temps — c'est l'écran blanc constaté au clic
     sur un athlète, d'autant plus long que la requête part depuis un téléphone
     vers une VM américaine.

     `placeholderData` sert donc l'en-tête immédiatement à partir du cache de la
     liste, et la requête réelle continue en arrière-plan pour apporter ce qui
     manque (l'historique des résultats). `resultats: []` n'est pas une valeur
     inventée : c'est « pas encore connu », et les blocs qui en dépendent le
     lisent via `isPlaceholderData` pour afficher leur propre attente au lieu
     d'un « aucun résultat » faux.

     Renvoyer `undefined` (accès direct à l'URL, rechargement, lien partagé)
     laisse le comportement d'origine : squelette puis contenu. */
  const listItem = queryClient
    .getQueryData<AthleteListItem[]>(['athletes'])
    ?.find((a) => a.id === athleteId)

  // Mémoïsé : `placeholderData` reçu comme VALEUR devient le `data` de la
  // requête tant que la vraie réponse manque. Un objet recréé à chaque rendu
  // ferait donc changer l'identité de `data` à chaque rendu, et tout `useMemo`
  // qui en dépend (l'historique, les disciplines, les saisons) se recalculerait
  // en boucle.
  const placeholder = useMemo<AthleteOut | undefined>(
    () =>
      listItem
        ? {
            id: listItem.id,
            nom: listItem.nom,
            prenom: listItem.prenom,
            ffa_id: listItem.ffa_id,
            sexe: listItem.sexe,
            photo_url: listItem.photo_url,
            resultats: [],
          }
        : undefined,
    [listItem],
  )

  const athleteQuery = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => getAthlete(athleteId),
    enabled: Number.isFinite(athleteId),
    retry: false,
    placeholderData: placeholder,
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

  const niveauQuery = useQuery({
    queryKey: ['athlete-niveau', athleteId],
    queryFn: () => getNiveau(athleteId),
    enabled: Number.isFinite(athleteId),
  })

  /* L'historique vient de `GET /athletes/{id}`, qui le PORTE DÉJÀ (le calcul du
     niveau de la saison en dépend). Il était en plus demandé à
     `GET /athletes/{id}/resultats` : les deux réponses contiennent les mêmes
     lignes, aux mêmes valeurs, dans un ordre différent — soit un aller-retour
     transatlantique et un second JSON de ~21 ko à analyser sur le thread
     principal, pour rien.
     Le tri par date décroissante était celui du point de terminaison supprimé
     (`order_by(Resultat.date.desc())`) : il est refait ici pour que le tableau
     garde exactement l'ordre d'avant. Les dates manquantes vont en fin de liste,
     comme les met SQLite avec `DESC`. */
  const allResultats = useMemo(() => {
    const items = athleteQuery.data?.resultats ?? []
    return [...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [athleteQuery.data])

  // Vrai tant que la fiche n'affiche que l'identité tirée du cache de la liste :
  // l'historique n'est pas « vide », il n'est pas encore arrivé.
  const historiqueEnAttente = athleteQuery.isPlaceholderData

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

  if (athleteQuery.isLoading) return <AthleteSkeleton />

  if (athleteQuery.isError) {
    const status = (athleteQuery.error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Athlète introuvable" message="Cet athlète n'existe pas." />
    }
    return <ErrorMessage message="Impossible de charger cet athlète." />
  }

  const athlete = athleteQuery.data
  if (!athlete) return null

  // Sur l'identité provisoire (`resultats: []`) le calcul local ne peut rien
  // dire : on reprend alors le niveau que le serveur a déjà calculé pour la
  // liste, qui est la MÊME grandeur obtenue par le même algorithme (cf.
  // AthleteListItem.niveau). La pastille ne clignote donc pas à l'arrivée des
  // résultats.
  const currentNiveau =
    computeNiveauSaison(athlete.resultats, currentSaison()) ?? listItem?.niveau ?? null
  const initials = getInitials(athlete.prenom, athlete.nom)
  const showPhoto = Boolean(athlete.photo_url) && !photoFailed

  return (
    <div className="animate-rise">
      <Link
        to="/athletes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux athlètes
      </Link>

      {/* Hero athlète — portrait + identité */}
      <div className="band mb-8 border border-[color:var(--color-line)] bg-[color:var(--color-surface)] sm:mb-10">
        {/* Même composition que « Athlète à la une » sur l'accueil : sous md,
            l'identité passe en surimpression au bas du portrait (donc hors flux)
            et la fiche tient sur un écran au lieu de ~800 px empilés. */}
        <div className="relative grid md:grid-cols-[minmax(0,300px)_1fr]">
          {/* Cadrage affiche 4/5 seulement s'il y a une photo (cf. accueil). Le
              ratio suit `showPhoto` et non `photo_url` : une URL morte doit aussi
              basculer en 16/10, sinon le monogramme est cadré de travers. */}
          <div
            className={`relative overflow-hidden md:aspect-auto md:min-h-[320px] ${
              showPhoto ? 'aspect-[4/5]' : 'aspect-[16/10]'
            }`}
          >
            {showPhoto ? (
              <img
                src={cldPortrait(athlete.photo_url, 600)}
                alt={`${athlete.prenom} ${athlete.nom}`}
                decoding="async"
                onError={() => setPhotoFailed(true)}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary">
                <span className="mt-[-8%] font-display text-5xl font-bold uppercase text-white/90 sm:text-7xl md:mt-0">
                  {initials}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-surface)] via-[color:var(--color-surface)]/70 to-transparent md:bg-gradient-to-r md:via-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 md:static md:justify-center md:gap-4 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-club-primary-light sm:text-xs">
              Athlète du club
            </p>
            <h1
              className="font-display font-bold leading-[1.02] tracking-tight"
              style={{ fontSize: 'clamp(1.75rem, 7.5vw, 3rem)' }}
            >
              <span className="block text-[0.58em] font-semibold text-[color:var(--color-muted)]">
                {athlete.prenom}
              </span>
              <span className="block uppercase">{athlete.nom}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm capitalize text-[color:var(--color-muted)]">
                {athlete.sexe}
              </span>
              {currentNiveau && <LevelBadge niveau={currentNiveau} />}
            </div>
            <div className="mt-1 md:mt-2">
              <a
                href={ffaProfileUrl(athlete.ffa_id)}
                target="_blank"
                rel="noreferrer"
                className="btn-ffa tap"
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
                  <p className="stat mt-1 text-3xl text-club-accent-light">
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
                      <span className="badge bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)] ring-1 ring-[color:var(--color-line)]">
                        Non homologué
                      </span>
                      <p className="tabular mt-1 font-display text-lg font-bold">
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
                      className="badge mt-2 inline-flex bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)] ring-1 ring-[color:var(--color-line)]"
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
          <div className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {niveauQuery.data.map((n) => (
              <div
                key={n.saison}
                className="card rail-item flex min-w-[120px] shrink-0 flex-col items-center gap-2 px-4 py-3 text-center"
              >
                <span className="tabular text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                  {n.saison}
                </span>
                {n.niveau ? (
                  <LevelBadge niveau={n.niveau} />
                ) : (
                  <span className="badge bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)] ring-1 ring-[color:var(--color-line)]">
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

        {historiqueEnAttente && <Loading />}

        {!historiqueEnAttente && (
          <>
            <div className="mb-6">
              {/* Le cadre d'attente reprend la STRUCTURE du graphique — même
                  carte, même ligne de légende, même `h-64 sm:h-72` — et non une
                  hauteur approchée : c'est ce qui garantit que le tableau en
                  dessous ne bouge pas d'un pixel quand Recharts se substitue. */}
              <Suspense
                fallback={
                  <div className="card p-4" aria-hidden>
                    <div className="mb-3 h-4 w-48 rounded bg-[color:var(--color-surface-2)]" />
                    <div className="h-64 w-full rounded bg-[color:var(--color-surface-2)]/60 sm:h-72" />
                  </div>
                }
              >
                <PerformanceChart resultats={filteredResultats} />
              </Suspense>
            </div>
            <PerformanceTable resultats={filteredResultats} />
          </>
        )}
      </section>
    </div>
  )
}

/**
 * Attente de la fiche quand elle n'a AUCUNE identité à afficher (URL ouverte
 * directement, rechargement, lien partagé — donc pas de cache de l'effectif).
 *
 * Un simple « Chargement… » centré laissait un écran vide de la hauteur du pied
 * de page, ce qui se lit comme une page cassée plutôt que comme une attente. Le
 * squelette reprend la géométrie exacte de l'en-tête réel : le contenu se
 * substitue sans que rien ne se déplace.
 */
function AthleteSkeleton() {
  return (
    <div className="animate-rise" aria-busy="true" aria-label="Chargement de la fiche">
      <div className="mb-6 h-5 w-36 rounded bg-[color:var(--color-surface-2)]" />
      <div className="band mb-8 border border-[color:var(--color-line)] bg-[color:var(--color-surface)] sm:mb-10">
        <div className="relative grid md:grid-cols-[minmax(0,300px)_1fr]">
          <div className="aspect-[4/5] animate-pulse bg-[color:var(--color-surface-2)] md:aspect-auto md:min-h-[320px]" />
          <div className="flex flex-col gap-3 p-5 md:justify-center md:p-10">
            <div className="h-3 w-28 rounded bg-[color:var(--color-surface-2)]" />
            <div className="h-6 w-40 rounded bg-[color:var(--color-surface-2)]" />
            <div className="h-9 w-56 rounded bg-[color:var(--color-surface-2)]" />
            <div className="h-8 w-32 rounded-full bg-[color:var(--color-surface-2)]" />
          </div>
        </div>
      </div>
      <div className="h-5 w-48 rounded bg-[color:var(--color-surface-2)]" />
    </div>
  )
}
