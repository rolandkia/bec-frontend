import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, ChevronDown, ExternalLink, MapPin } from 'lucide-react'
import { club } from '../data/club'
import { partenaires, partenairesIntro } from '../data/partenaires'
import { clubPhotos } from '../data/clubPhotos'
import { ffaProfileUrl } from '../utils/ffa'
import { splitEvents } from '../utils/events'
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
  CountUp,
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
    <div className="mb-6 flex items-end justify-between gap-4">
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
    <div className="space-y-24">
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
          className="relative max-w-2xl px-6 py-28 sm:px-12 sm:py-36 lg:py-44"
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

      {/* ═══ 2 · CHIFFRES CLÉS ═══ */}
      <Reveal>
        <div className="band border border-[color:var(--color-line)]">
          <img
            src="/photos/start-wide.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/90 to-[color:var(--color-ink)]/75" />
          <div className="relative grid grid-cols-1 divide-y divide-[color:var(--color-line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {club.chiffresCles.map((c) => (
              <div key={c.label} className="px-6 py-10 text-center">
                <CountUp value={c.valeur} className="stat block text-5xl text-white sm:text-6xl" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  {c.label}
                </p>
              </div>
            ))}
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
              <div className="relative grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
                {(() => {
                  const d = new Date(featuredEvent.date)
                  return (
                    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl bg-club-primary text-white shadow-xl shadow-club-primary/30">
                      <span className="tabular font-display text-5xl font-bold leading-none">
                        {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
                      </span>
                      <span className="mt-1 text-xs font-semibold uppercase tracking-[0.15em]">
                        {d.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                  )
                })()}
                <div className="min-w-0">
                  <span className="badge-live uppercase tracking-wide">À venir</span>
                  <h3 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
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

      {/* ═══ Bande immersive — PODIUM (rythme éditorial + accent OR) ═══ */}
      <Reveal>
        <div className="band border border-[color:var(--color-line)]">
          <img
            src="/photos/podium-01.webp"
            alt="Athlètes du club sur le podium"
            className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/75 to-[color:var(--color-ink)]/20" />
          <div className="relative max-w-xl px-6 py-16 sm:px-10 sm:py-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-club-accent-light">
              L'excellence récompensée
            </p>
            <p className="stat text-3xl text-white sm:text-4xl">
              Le podium n'est pas une fin,
              <br />
              c'est une habitude.
            </p>
            <hr className="rule-gold mt-6 max-w-[180px]" />
          </div>
        </div>
      </Reveal>

      {/* ═══ 4 · DERNIERS RÉSULTATS / CLASSEMENT ═══ */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Les meilleurs chronos
            </p>
            <h2 className="section-title">Classement du club</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-0.5">
              {(['homme', 'femme'] as const).map((s) => (
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
                  {s === 'homme' ? 'Hommes' : 'Femmes'}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-0.5">
              {(['absolu', 'saison'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriode(p)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    periode === p
                      ? 'bg-club-primary text-white shadow-sm'
                      : 'text-[color:var(--color-muted)] hover:text-white'
                  }`}
                >
                  {p === 'absolu' ? 'All-time' : 'Saison'}
                </button>
              ))}
            </div>
            <Link
              to="/competitions?tab=records"
              className="group inline-flex items-center gap-1 text-sm font-semibold text-club-accent-light transition hover:text-white"
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
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {podiums.map((group) => (
              <motion.div key={group.discipline} variants={staggerItem}>
                <DisciplinePodium group={group} />
              </motion.div>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* ═══ 5 · ATHLÈTE À LA UNE ═══ */}
      {featuredEntry && (
        <section>
          <SectionHead
            eyebrow="Athlète à la une"
            title="Le visage de la performance"
            to={`/athletes/${featuredEntry.athlete_id}`}
            more="Voir le profil"
          />
          <Reveal>
            <div className="band border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
              <div className="grid md:grid-cols-[minmax(0,340px)_1fr]">
                {/* Portrait */}
                <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[380px]">
                  {featuredPhoto ? (
                    <img
                      src={featuredPhoto}
                      alt={`${featuredEntry.prenom} ${featuredEntry.nom}`}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <Monogram
                      initials={`${featuredEntry.prenom[0]}${featuredEntry.nom[0]}`}
                      className="h-full w-full text-7xl"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-surface)] via-transparent to-transparent md:bg-gradient-to-r" />
                </div>
                {/* Infos */}
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
                    {featuredDiscipline} · Meilleure performance
                  </p>
                  <h3 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                    {featuredEntry.prenom} {featuredEntry.nom}
                  </h3>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="stat text-5xl text-club-accent sm:text-6xl">
                      {featuredEntry.raw_performance ?? featuredEntry.performance_valeur}
                    </span>
                    <span className="text-sm uppercase tracking-wide text-[color:var(--color-muted)]">
                      {featuredEntry.epreuve}
                    </span>
                  </div>
                  {featuredEntry.niveau && (
                    <div>
                      <LevelBadge niveau={featuredEntry.niveau} />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link to={`/athletes/${featuredEntry.athlete_id}`} className="btn-primary">
                      Voir le profil
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    {featuredAthleteQuery.data?.ffa_id && (
                      <a
                        href={ffaProfileUrl(featuredAthleteQuery.data.ffa_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ffa"
                      >
                        Profil FFA
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
          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                className="group relative block h-56 w-72 shrink-0 cursor-pointer overflow-hidden rounded-2xl sm:h-64 sm:w-96"
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-3 left-4 text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
          <Reveal className="band relative min-h-[320px] border border-[color:var(--color-line)] lg:min-h-full">
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
          <div className="relative mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Rejoignez le collectif
            </p>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
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
                className="group card card-hover flex items-center justify-center p-6"
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
