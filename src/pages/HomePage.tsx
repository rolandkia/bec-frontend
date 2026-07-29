import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, ChevronDown, ExternalLink, MapPin } from 'lucide-react'
import { club } from '../data/club'
import { jalonsAccueil } from '../data/palmares'
import { partenaires, partenairesIntro } from '../data/partenaires'
import { clubPhotos } from '../data/clubPhotos'
import { ffaProfileUrl } from '../utils/ffa'
import { parseLocalDate, splitEvents } from '../utils/events'
import { Lightbox } from '../components/ui/Lightbox'
import { EventRow } from '../components/calendar/EventRow'
import { getClassements, getAthlete } from '../api/athletes'
import { listEvents } from '../api/events'
import type { ClassementParDiscipline, Sexe } from '../api/types'
import { currentSaison } from '../utils/saison'
import { DisciplinePodium } from '../components/athletes/DisciplinePodium'
import { LevelBadge } from '../components/athletes/LevelBadge'
import { listBlogs } from '../api/blogs'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import {
  motion,
  useReducedMotion,
  Reveal,
  RevealGroup,
  staggerContainer,
  fadeUp,
  staggerItem,
  ParallaxImage,
  Marquee,
} from '../components/ui/motion'

// Disciplines mises en avant sur l'accueil, dans l'ordre d'affichage.
const DISCIPLINES_ACCUEIL = ['100m', '200m', '400m', '400m haies']

/** Petit en-tête de section : sur-titre + titre + lien « voir tout » optionnel. */
function SectionHead({
  eyebrow,
  title,
  to,
  more,
}: {
  eyebrow?: string
  title: string
  to?: string
  more?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mb-6">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            {eyebrow}
          </p>
        )}
        <h2 className="section-title">{title}</h2>
      </div>
      {to && (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-club-primary-light transition hover:text-white"
        >
          {more ?? 'Voir tout'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

/** Pastille monogramme (repli quand aucune photo n'est disponible). */
function Monogram({ initials, className = '' }: { initials: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary font-display font-bold uppercase text-white ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function HomePage() {
  const [sexe, setSexe] = useState<Sexe>('homme')
  const [periode, setPeriode] = useState<'absolu' | 'saison'>('absolu')
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blogs'],
    queryFn: listBlogs,
  })

  const classementsQuery = useQuery({
    queryKey: ['classements', 'home', sexe, periode],
    queryFn: () =>
      getClassements({
        sexe,
        homologue: true,
        saison: periode === 'saison' ? currentSaison() : undefined,
      }),
  })

  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: listEvents })
  const { upcoming } = splitEvents(eventsQuery.data ?? [])
  const featuredEvent = upcoming[0]
  const nextEvents = upcoming.slice(1, 4)

  const byDiscipline = new Map(
    (classementsQuery.data ?? []).map((d) => [d.discipline, d]),
  )
  const podiums = DISCIPLINES_ACCUEIL.map((disc) => byDiscipline.get(disc)).filter(
    (d): d is ClassementParDiscipline => d !== undefined && d.classement.length > 0,
  )

  // Athlète à la une : n°1 de la discipline phare affichée (dépend du toggle H/F).
  const featuredEntry = podiums[0]?.classement[0]
  const featuredDiscipline = podiums[0]?.discipline
  const featuredAthleteQuery = useQuery({
    queryKey: ['athlete', featuredEntry?.athlete_id],
    queryFn: () => getAthlete(featuredEntry!.athlete_id),
    enabled: featuredEntry != null,
  })
  const featuredPhoto = featuredAthleteQuery.data?.photo_url

  return (
    // 96 px entre chaque section coûtaient ~250 px de vide sur un téléphone.
    <div className="space-y-14 sm:space-y-24">
      {/* ═══ 1 · HERO ═══ */}
      <section className="band">
        <ParallaxImage
          src="/photos/hero-sprint.webp"
          alt="Athlète du club en position dans les starting-blocks"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          fetchPriority="high"
        />
        {/* Voiles dégradés — lisibilité + masque du filigrane en bas de photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/60 to-[color:var(--color-ink)]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)]/90 via-[color:var(--color-ink)]/35 to-transparent" />

        <motion.div
          variants={staggerContainer(0.1, 0.1)}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="relative max-w-2xl px-6 py-20 sm:px-12 sm:py-36 lg:py-44"
        >
          <motion.span
            variants={fadeUp(20, 0.5)}
            className="badge border border-club-primary/40 bg-club-primary/15 uppercase tracking-[0.16em] text-club-primary-light"
          >
            Club d'athlétisme · Bordeaux
          </motion.span>
          <motion.h1
            variants={fadeUp(28, 0.6)}
            className="mt-5 font-display font-bold uppercase leading-[0.92] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.75rem, 8vw, 5.5rem)' }}
          >
            {club.nom}
          </motion.h1>
          <motion.p
            variants={fadeUp(24, 0.55)}
            className="mt-5 max-w-xl text-lg leading-relaxed text-white/85"
          >
            {club.accroche}
          </motion.p>
          <motion.div variants={fadeUp(20, 0.5)} className="mt-8 flex flex-wrap gap-3">
            <Link to="/athletes" className="btn-primary">
              Découvrir les athlètes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/competitions" className="btn-outline">
              Voir le calendrier
            </Link>
          </motion.div>
        </motion.div>

        {/* Indice de scroll */}
        {!reduce && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-6 w-6 text-white/50" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ═══ 2 · HISTOIRE & PALMARÈS (teaser — accent OR) ═══ */}
      {/* Cette bande occupait auparavant la place n°4 (simple citation sur photo
          de podium) et l'accueil ouvrait sur trois « chiffres clés » inventés.
          Elle remonte ici avec des faits datés : l'ancienneté du club est
          l'argument le plus fort de la page, autant l'annoncer sous le hero. */}
      <Reveal>
        <div className="band border border-[color:var(--color-line)]">
          <img
            src="/photos/podium-01.webp"
            alt="Athlètes du club sur le podium"
            className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/80 to-[color:var(--color-ink)]/35" />
          <div className="relative px-6 py-10 sm:px-10 sm:py-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-club-accent-light">
              Depuis 1903
            </p>
            <p className="stat max-w-xl text-3xl text-white sm:text-4xl">
              Un club, une histoire
              <br />
              de champions.
            </p>
            <hr className="rule-gold mt-6 max-w-[180px]" />
            {/* 3 colonnes DÈS le mobile (même gabarit que l'ancien tableau de
                scores) : empilés, ces jalons ajoutaient ~200 px de hauteur.
                Panneau sombre propre plutôt que le seul voile dégradé : la
                colonne de droite tombe sur la partie la plus claire de la photo
                (banderole du podium), où « Finaliste olympique » devenait
                illisible — surtout sur mobile, où la bande est plus étroite. */}
            <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-[color:var(--color-ink)]/70 backdrop-blur-[3px]">
              {jalonsAccueil.map((j) => (
                <div key={j.annee} className="px-2 py-5 text-center sm:px-6 sm:py-6">
                  <span className="stat block text-2xl text-club-accent-light sm:text-3xl">
                    {j.annee}
                  </span>
                  <p className="mt-1.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-[color:var(--color-muted)] sm:mt-2 sm:text-xs sm:tracking-[0.14em]">
                    {j.label}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/palmares" className="btn-accent group mt-8">
              Notre histoire &amp; palmarès
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ═══ 3 · PROCHAINE COMPÉTITION ═══ */}
      <section>
        <SectionHead
          eyebrow="Le prochain rendez-vous"
          title="Prochaine compétition"
          to="/competitions"
          more="Tout le calendrier"
        />
        {featuredEvent ? (
          <Reveal className="space-y-4">
            <div className="band border border-[color:var(--color-line)]">
              <img
                src="/photos/race-wide.webp"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-center opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/55" />
              {/* Tuile date et libellé côte à côte dès le mobile : empilés, ils
                  faisaient de cette bande le bloc le plus haut de la page. */}
              <div className="relative grid grid-cols-[auto_1fr] items-center gap-4 p-5 sm:gap-6 sm:p-10">
                {(() => {
                  const d = parseLocalDate(featuredEvent.date)
                  return (
                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-club-primary text-white shadow-xl shadow-club-primary/30 sm:h-28 sm:w-28">
                      <span className="tabular font-display text-3xl font-bold leading-none sm:text-5xl">
                        {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] sm:text-xs">
                        {d.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                  )
                })()}
                <div className="min-w-0">
                  <span className="badge-live uppercase tracking-wide">À venir</span>
                  <h3 className="mt-2 font-display text-xl font-bold leading-tight text-white sm:mt-3 sm:text-4xl">
                    {featuredEvent.nom}
                  </h3>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[color:var(--color-muted)]">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{featuredEvent.lieu}</span>
                    <span className="opacity-40">·</span>
                    <span className="uppercase tracking-wide">{featuredEvent.type}</span>
                  </p>
                </div>
              </div>
            </div>
            {nextEvents.length > 0 && (
              <div className="space-y-3">
                {nextEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </Reveal>
        ) : (
          <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
            Aucune compétition à venir pour le moment.
          </p>
        )}
      </section>

      {/* ═══ 4 · DERNIERS RÉSULTATS / CLASSEMENT ═══ */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Les meilleurs chronos
            </p>
            <h2 className="section-title">Classement du club</h2>
          </div>
          {/* Filtres empilés pleine largeur sur mobile (cf. `.segmented`). */}
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <div className="segmented">
              {(['homme', 'femme'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={sexe === s} onClick={() => setSexe(s)}>
                  {s === 'homme' ? 'Hommes' : 'Femmes'}
                </button>
              ))}
            </div>
            <div className="segmented">
              {(['absolu', 'saison'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={periode === p}
                  onClick={() => setPeriode(p)}
                >
                  {p === 'absolu' ? 'All-time' : 'Saison'}
                </button>
              ))}
            </div>
            <Link
              to="/athletes?tab=records"
              className="group inline-flex items-center gap-1 self-start text-sm font-semibold text-club-accent-light transition hover:text-white sm:self-auto"
            >
              Records
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {classementsQuery.isLoading && <Loading />}
        {classementsQuery.isError && (
          <ErrorMessage message="Impossible de charger le classement." />
        )}
        {classementsQuery.data && podiums.length === 0 && (
          <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
            Aucun classement disponible pour le moment.
          </p>
        )}
        {podiums.length > 0 && (
          // Rail glissable sur mobile : 4 podiums empilés faisaient ~700 px, et
          // la carte suivante qui dépasse est l'affordance la plus lisible qui
          // existe au doigt. Grille classique dès sm.
          <RevealGroup className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0">
            {podiums.map((group) => (
              <motion.div
                key={group.discipline}
                variants={staggerItem}
                className="rail-item w-[78%] shrink-0 sm:w-auto"
              >
                <DisciplinePodium group={group} />
              </motion.div>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* ═══ 5 · ATHLÈTE À LA UNE ═══ */}
      {featuredEntry && (
        <section>
          {/* Pas de lien « Voir le profil » ici : la carte porte déjà le CTA. */}
          <SectionHead eyebrow="Athlète à la une" title="Le visage de la performance" />
          <Reveal>
            <div className="band border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
              {/* Sous md, le panneau d'identité est en SURIMPRESSION dans le bas
                  du portrait : il sort du flux, donc la hauteur de la bande est
                  celle de la photo (~490 px au lieu de ~830 px empilés) et la
                  fiche tient sur un écran. À partir de md, `md:static` rend le
                  panneau au flux et le split 2 colonnes reprend à l'identique
                  (les `inset-*` sont ignorés en position statique). */}
              <div className="relative grid md:grid-cols-[minmax(0,340px)_1fr]">
                {/* Portrait. Le cadrage 4/5 (format affiche) ne se justifie que
                    s'il y a une vraie photo ; sans elle, le monogramme n'a pas
                    besoin de 490 px de haut sur mobile. */}
                <div
                  className={`relative overflow-hidden md:aspect-auto md:min-h-[380px] ${
                    featuredPhoto ? 'aspect-[4/5]' : 'aspect-[16/10]'
                  }`}
                >
                  {featuredPhoto ? (
                    <img
                      src={featuredPhoto}
                      alt={`${featuredEntry.prenom} ${featuredEntry.nom}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <Monogram
                      initials={`${featuredEntry.prenom[0]}${featuredEntry.nom[0]}`}
                      className="h-full w-full items-start pt-6 text-5xl sm:text-7xl md:items-center md:pt-0"
                    />
                  )}
                  {/* Voile : sur mobile il porte la lisibilité du bloc en
                      surimpression (opaque en bas) ; dès md il redevient un
                      simple raccord horizontal vers le panneau. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-surface)] via-[color:var(--color-surface)]/70 to-transparent md:bg-gradient-to-r md:via-transparent" />
                </div>
                {/* Identité */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 md:static md:justify-center md:gap-4 md:p-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-club-primary-light sm:text-xs">
                    {featuredDiscipline} · Meilleure performance
                  </p>
                  {/* Écriture magazine sportif : prénom en appui, NOM en
                      capitales — raccord avec le H1 du hero. */}
                  <h3
                    className="font-display font-bold leading-[1.02] text-white"
                    style={{ fontSize: 'clamp(1.75rem, 7.5vw, 3rem)' }}
                  >
                    <span className="block text-[0.58em] font-semibold text-white/70">
                      {featuredEntry.prenom}
                    </span>
                    <span className="block uppercase">{featuredEntry.nom}</span>
                  </h3>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    {/* OR = excellence méritée (politique d'usage de l'or) */}
                    <span className="stat stat-hero text-club-accent">
                      {featuredEntry.raw_performance ?? featuredEntry.performance_valeur}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-[color:var(--color-muted)] sm:text-sm">
                      {featuredEntry.epreuve}
                    </span>
                    {featuredEntry.niveau && <LevelBadge niveau={featuredEntry.niveau} />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 md:mt-2 md:gap-3">
                    <Link
                      to={`/athletes/${featuredEntry.athlete_id}`}
                      className="btn-primary tap min-w-0 flex-1 sm:flex-none"
                    >
                      Voir le profil
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                    {featuredAthleteQuery.data?.ffa_id && (
                      <a
                        href={ffaProfileUrl(featuredAthleteQuery.data.ffa_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ffa tap shrink-0"
                        aria-label="Profil FFA"
                      >
                        {/* Libellé masqué sur mobile : deux CTA en toutes lettres
                            ne tiennent pas sur une ligne dans 350 px. */}
                        <span className="hidden sm:inline">Profil FFA</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ═══ 6 · DERNIERS ARTICLES ═══ */}
      <section>
        <SectionHead
          eyebrow="Actualité"
          title="Derniers articles"
          to="/actualite"
          more="Toute l'actualité"
        />
        {isLoading && <Loading />}
        {isError && <ErrorMessage message="Impossible de charger les articles." />}
        {posts && (
          <RevealGroup className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <motion.div key={post.id} variants={staggerItem}>
                <BlogCard post={post} />
              </motion.div>
            ))}
            {posts.length === 0 && (
              <p className="text-[color:var(--color-muted)]">
                Aucun article publié pour le moment.
              </p>
            )}
          </RevealGroup>
        )}
      </section>

      {/* ═══ 7 · EN IMAGES (galerie immersive) ═══ */}
      <section>
        <SectionHead
          eyebrow="En images"
          title="Le club en mouvement"
          to="/galerie"
          more="Toute la galerie"
        />
        <Reveal className="-mx-4 sm:mx-0">
          <Marquee duration={50}>
            {clubPhotos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setGalleryIndex(i)}
                aria-label={`Agrandir : ${p.legende}`}
                className="group tap rail-item relative block h-44 w-64 shrink-0 cursor-pointer overflow-hidden rounded-2xl sm:h-64 sm:w-96"
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Légende visible d'emblée au doigt (cf. MediaTile). */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100" />
                <span className="absolute bottom-3 left-4 right-3 truncate text-left text-sm font-semibold text-white transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100">
                  {p.legende}
                </span>
              </button>
            ))}
          </Marquee>
        </Reveal>
      </section>

      {/* Visionneuse partagée pour la bande « Le club en mouvement » */}
      {galleryIndex !== null && (
        <Lightbox
          items={clubPhotos.map((p) => ({ url: p.src, type: 'image' as const }))}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onClose={() => setGalleryIndex(null)}
          renderCaption={(_, i) => clubPhotos[i].legende}
        />
      )}

      {/* ═══ 8a · NOS VALEURS (split éditorial + photo concentration) ═══ */}
      <section>
        <SectionHead eyebrow="Ce qui nous anime" title="Nos valeurs" />
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Panneau photo */}
          <Reveal className="band relative min-h-[220px] border border-[color:var(--color-line)] sm:min-h-[320px] lg:min-h-full">
            <img
              src="/photos/concentration-02.webp"
              alt="Athlète concentré avant l'effort"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/25 to-transparent" />
            <div className="relative flex h-full items-end p-6 sm:p-8">
              <p className="font-display text-2xl font-bold leading-tight text-white">
                L'exigence,
                <br />
                à chaque foulée.
              </p>
            </div>
          </Reveal>
          {/* Valeurs en lignes */}
          <RevealGroup className="grid grid-cols-1 gap-4">
            {club.valeurs.map((v, i) => (
              <motion.div
                key={v.titre}
                variants={staggerItem}
                className="card card-hover flex items-start gap-5 p-6"
              >
                <span className="stat shrink-0 text-4xl text-club-primary/70">0{i + 1}</span>
                <div>
                  <h3 className="mb-1.5 font-display text-lg font-bold text-white">{v.titre}</h3>
                  <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
                    {v.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ═══ 8b · REJOINDRE LE CLUB (CTA) ═══ */}
      <Reveal>
        <div className="band border border-[color:var(--color-line)]">
          <img
            src="/photos/group.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/80 to-[color:var(--color-ink)]/60" />
          <div className="relative mx-auto max-w-2xl px-6 py-12 text-center sm:py-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Rejoignez le collectif
            </p>
            <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
              De l'initiation à la haute performance
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[color:var(--color-muted)]">
              Que vous débutiez ou visiez le podium, le BEC vous accompagne à chaque foulée.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/infos-pratiques" className="btn-primary">
                Les entraînements
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="btn-accent">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ═══ 9 · PARTENAIRES ═══ */}
      <section>
        <SectionHead eyebrow="Ils nous soutiennent" title="Partenaires" />
        {partenaires.length > 0 ? (
          <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partenaires.map((p) => (
              <motion.a
                key={p.nom}
                variants={staggerItem}
                href={p.url ?? '#'}
                target={p.url ? '_blank' : undefined}
                rel={p.url ? 'noreferrer' : undefined}
                className="group card card-hover tap flex items-center justify-center p-6"
                title={p.nom}
              >
                <img src={p.logo} alt={p.nom} className="max-h-12 w-auto opacity-80 transition group-hover:opacity-100" />
              </motion.a>
            ))}
          </RevealGroup>
        ) : (
          <Reveal className="card flex flex-col items-center gap-4 p-8 text-center sm:p-12">
            <p className="max-w-2xl text-[color:var(--color-muted)]">{partenairesIntro}</p>
            <a href={`mailto:${club.contact.email}`} className="btn-outline">
              Devenir partenaire
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
        )}
      </section>
    </div>
  )
}
