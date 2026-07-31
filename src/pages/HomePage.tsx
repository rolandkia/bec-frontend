import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react'
import { club } from '../data/club'
import { jalonsAccueil } from '../data/palmares'
import { besoinsCourts, partenaires, partenairesAccroche } from '../data/partenaires'
import { clubPhotos } from '../data/clubPhotos'
import { parseLocalDate, splitEvents } from '../utils/events'
import { Lightbox } from '../components/ui/Lightbox'
import { EventRow } from '../components/calendar/EventRow'
import { getClassements, listAthletes } from '../api/athletes'
import { listEvents } from '../api/events'
import type { ClassementParDiscipline, Sexe } from '../api/types'
import { currentSaison } from '../utils/saison'
import { DisciplinePodium } from '../components/athletes/DisciplinePodium'
import { listBlogs } from '../api/blogs'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { SectionHead } from '../components/ui/SectionHead'
import {
  motion,
  useReducedMotion,
  Chapter,
  Reveal,
  RevealGroup,
  MaskReveal,
  ScrubImage,
  SplitLines,
  MagneticButton,
  staggerContainer,
  fadeUp,
  staggerItem,
  PhotoRail,
} from '../components/ui/motion'

// Disciplines mises en avant sur l'accueil, dans l'ordre d'affichage.
const DISCIPLINES_ACCUEIL = ['100m', '200m', '400m', '400m haies']

/**
 * ACCUEIL — le scroll raconte le club en NEUF MOUVEMENTS, alternant chapitres
 * clairs (papier, respiration) et noirs (tension, émotion) :
 *
 *   1 ██ Hero — l'équipe aux interclubs        6 ██ Chapitre « Le podium »
 *   2 ░░ Ancrage chiffré                       7 ░░ La vie du club + galerie
 *   3 ██ Chapitre « Le départ » (scrub)        8 ░░ Le Mag
 *   4 ░░ Prochaine compétition                 9 ██ Rejoindre le collectif
 *   5 ░░ Le classement du club
 *
 * Chaque mouvement a SA grammaire d'animation — le brief l'exige explicitement
 * (« évite de répéter exactement le même effet partout ») : le hero est
 * énergique, le départ sec et piloté au scroll, le podium solennel, le groupe
 * doux. Les primitives vivent dans `components/ui/motion.tsx`.
 */
export function HomePage() {
  const [sexe, setSexe] = useState<Sexe>('homme')
  const [periode, setPeriode] = useState<'absolu' | 'saison'>('absolu')
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const { data: posts, isLoading, isError } = useQuery({ queryKey: ['blogs'], queryFn: listBlogs })

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
  // Même clé de requête que <AthletesListPage> : le compte est gratuit (cache).
  const athletesQuery = useQuery({ queryKey: ['athletes'], queryFn: listAthletes })

  const { upcoming } = splitEvents(eventsQuery.data ?? [])
  const featuredEvent = upcoming[0]
  const nextEvents = upcoming.slice(1, 4)

  const byDiscipline = new Map((classementsQuery.data ?? []).map((d) => [d.discipline, d]))
  const podiums = DISCIPLINES_ACCUEIL.map((disc) => byDiscipline.get(disc)).filter(
    (d): d is ClassementParDiscipline => d !== undefined && d.classement.length > 0,
  )

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════════
          1 · HERO — « on court ensemble »  [NOIR]

          La photo est celle des interclubs : le club AU COMPLET, fumigènes rouge
          et or, blason brandi. C'est la seule image de la bibliothèque qui
          transmette l'esprit d'équipe demandé — un athlète seul dans les blocs
          (l'ancien hero) ne le pouvait pas.

          Motion : ÉNERGIQUE. Le titre entre ligne par ligne sous un masque
          (`SplitLines`, 60 ms d'écart), le reste suit en cascade. Pas de
          parallaxe ici : c'est l'image du LCP, on ne la met pas sous un
          conteneur animé au premier rendu.
          ═══════════════════════════════════════════════════════════════════ */}
      <Chapter
        tone="dark"
        image="/photos/hero-interclub.webp"
        imageAlt=""
        focus="center 55%"
        veil="soft"
        grain
        priority
        className="flex min-h-[88svh] items-end"
      >
        <motion.div
          variants={staggerContainer(0.08, 0.15)}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="w-full pb-20 pt-32 sm:pb-28 sm:pt-40"
        >
          {/* Aplat rouge plein, et non un fond translucide : posé sur un ciel
              bleu clair, `bg-club-primary/15 text-club-primary-light` tombait
              sous le seuil de contraste. Blanc sur rouge = 6,5:1. */}
          <motion.span variants={fadeUp(16, 0.5)} className="badge bg-club-primary text-white">
            Club d'athlétisme · Bordeaux · Depuis 1897
          </motion.span>

          <SplitLines
            lines={['On court seul.', 'On gagne ensemble.']}
            as="h1"
            className="title-hero mt-6 max-w-4xl"
            delay={0.25}
            trigger="mount"
          />

          <motion.p
            variants={fadeUp(20, 0.55)}
            className="mt-7 max-w-xl text-lg leading-relaxed text-[color:var(--color-muted)]"
          >
            {club.accroche}
          </motion.p>

          <motion.div variants={fadeUp(16, 0.5)} className="mt-10 flex flex-wrap gap-4">
            <MagneticButton>
              <Link to="/rejoindre" className="btn-primary">
                Rejoindre le club
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link to="/athletes" className="btn-outline">
                Voir les athlètes
              </Link>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Indice de scroll — le premier mouvement de la page doit être une
            invitation à continuer. */}
        {!reduce && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-6 w-6 opacity-50" />
            </motion.div>
          </motion.div>
        )}
      </Chapter>

      {/* ═══════════════════════════════════════════════════════════════════════
          2 · ANCRAGE CHIFFRÉ  [CLAIR]

          Respiration blanche juste après le hero : le contraste de fond fait le
          travail de séparation, aucun ornement n'est nécessaire. Les trois
          jalons sont DATÉS et réels (`data/palmares.ts`), le nombre d'athlètes
          vient de l'API — pas de « chiffre clé » inventé.
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <RevealGroup className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {jalonsAccueil.map((j) => (
            <motion.div key={j.annee} variants={staggerItem}>
              <hr className="hairline mb-4" />
              <span className="stat block text-4xl sm:text-5xl">{j.annee}</span>
              <p className="mt-2 text-xs font-semibold uppercase leading-tight tracking-[0.12em] text-[color:var(--color-muted)]">
                {j.label}
              </p>
            </motion.div>
          ))}
          <motion.div variants={staggerItem}>
            <hr className="hairline mb-4" />
            <span className="stat block text-4xl text-club-primary sm:text-5xl">
              {athletesQuery.data ? athletesQuery.data.length : '—'}
            </span>
            <p className="mt-2 text-xs font-semibold uppercase leading-tight tracking-[0.12em] text-[color:var(--color-muted)]">
              Athlètes licenciés
            </p>
          </motion.div>
        </RevealGroup>

        <Reveal className="mt-14">
          <Link
            to="/club#palmares"
            className="group inline-flex items-center gap-2 font-display text-2xl font-bold uppercase transition hover:text-club-primary-light sm:text-3xl"
          >
            Un club, une histoire de champions
            <ArrowRight
              aria-hidden
              className="h-6 w-6 transition-transform group-hover:translate-x-1.5"
              strokeWidth={2}
            />
          </Link>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3 · CHAPITRE « LE DÉPART »  [NOIR]

          Le moment de tension pure. Motion SEC ET TENDU : aucun fondu — le
          cadrage est piloté par la position de scroll (`ScrubImage`), donc le
          mouvement est exactement celui du doigt. C'est la SEULE section du site
          en scrub : au-delà, on se bat contre le scroll natif.
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="chapter chapter-dark grain relative flex min-h-[70svh] items-center py-24 sm:min-h-[80svh]">
        <ScrubImage src="/photos/start-wide.webp" focus="center 40%" />
        {/* Voile latéral : le texte est à gauche, la photo garde sa lumière à
            droite. Un voile uniforme aurait éteint toute la photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-canvas)] via-[color:var(--color-canvas)]/70 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-6xl px-safe">
          <p className="eyebrow-photo">Le départ</p>
          <SplitLines
            lines={['Tout se joue', 'dans les', 'quatre premiers', 'appuis.']}
            as="h2"
            className="title-page max-w-2xl"
            stagger={0.05}
          />
          <p className="mt-6 max-w-md leading-relaxed text-[color:var(--color-muted)]">
            Le sprint ne pardonne rien. Chaque séance travaille la même chose : sortir des blocs plus
            vite que la semaine dernière.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4 · PROCHAINE COMPÉTITION  [CLAIR]
          Bloc FACTUEL : la date en pavé rouge porte l'information, l'animation
          se contente de l'amener. Pas de photo de fond — elle concurrencerait le
          chapitre qui précède.
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <SectionHead
          eyebrow="Le prochain rendez-vous"
          title="Prochaine compétition"
          to="/competitions"
          more="Tout le calendrier"
        />
        {featuredEvent ? (
          <div className="space-y-4">
            <Reveal>
              <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
                {(() => {
                  const d = parseLocalDate(featuredEvent.date)
                  return (
                    <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-md bg-club-primary text-white shadow-lg shadow-club-primary/25 sm:h-32 sm:w-32">
                      <span className="tabular font-display text-4xl font-bold leading-none sm:text-6xl">
                        {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
                      </span>
                      <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {d.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                  )
                })()}
                <div className="min-w-0">
                  <span className="badge-live">À venir</span>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-tight sm:text-4xl">
                    {featuredEvent.nom}
                  </h3>
                  <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[color:var(--color-muted)]">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>{featuredEvent.lieu}</span>
                    <span className="opacity-40">·</span>
                    <span className="uppercase tracking-wide">{featuredEvent.type}</span>
                  </p>
                </div>
              </div>
            </Reveal>
            {nextEvents.length > 0 && (
              <RevealGroup className="space-y-3">
                {nextEvents.map((event) => (
                  <motion.div key={event.id} variants={staggerItem}>
                    <EventRow event={event} />
                  </motion.div>
                ))}
              </RevealGroup>
            )}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
            Aucune compétition à venir pour le moment.
          </p>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5 · LE CLASSEMENT DU CLUB  [CLAIR]
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="pb-16 sm:pb-24">
        <SectionHead eyebrow="Les meilleurs chronos" title="Classement du club">
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
                <button key={p} type="button" aria-pressed={periode === p} onClick={() => setPeriode(p)}>
                  {p === 'absolu' ? 'All-time' : 'Saison'}
                </button>
              ))}
            </div>
            {/* L'or signale l'excellence : « Records » y a droit, pas les filtres. */}
            <Link
              to="/athletes?tab=records"
              className="group inline-flex items-center gap-1.5 self-start text-sm font-semibold uppercase tracking-[0.08em] text-club-accent-light transition hover:opacity-70 sm:self-auto"
            >
              Records
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </div>
        </SectionHead>

        {classementsQuery.isLoading && <Loading />}
        {classementsQuery.isError && <ErrorMessage message="Impossible de charger le classement." />}
        {classementsQuery.data && podiums.length === 0 && (
          <p className="rounded-md border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
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

      {/* ═══════════════════════════════════════════════════════════════════════
          6 · CHAPITRE « LE PODIUM »  [NOIR]

          Motion SOLENNEL : entrée lente (700 ms), aucun rebond, le filet or se
          trace sous le titre. C'est le seul chapitre où l'or est dominant — il
          récompense, il ne décore pas.
          ═══════════════════════════════════════════════════════════════════ */}
      <Chapter
        tone="dark"
        image="/photos/podium-01.webp"
        focus="center 5%"
        veil="strong"
        parallax
        grain
        className="py-24 sm:py-32"
      >
        <Reveal duration={0.7} distance={32} className="max-w-2xl">
          <p className="eyebrow-photo eyebrow-photo-gold">L'excellence</p>
          <h2 className="title-page">Ce qu'on vient chercher</h2>
          {/* Le filet or se TRACE (scaleX) plutôt que d'apparaître : le geste dit
              « on inscrit un résultat ». */}
          <motion.hr
            className="rule-gold mt-8 origin-left"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
          <p className="mt-8 text-lg leading-relaxed text-[color:var(--color-muted)]">
            Une championne olympique en 1968, des champions d'Europe, un finaliste olympique en 2024.
            Le club n'a jamais arrêté de monter sur les podiums, et il n'a pas l'intention de
            commencer.
          </p>
          <MagneticButton className="mt-10">
            <Link to="/club#palmares" className="btn-ffa">
              Le palmarès du club
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </Link>
          </MagneticButton>
        </Reveal>
      </Chapter>

      {/* ═══════════════════════════════════════════════════════════════════════
          7 · LA VIE DU CLUB  [CLAIR]

          Motion DOUX : fondu lent, stagger large. La photo est celle de la
          soirée du club — le groupe HORS piste. C'est ce que les photos de
          compétition ne racontent pas, et c'est la raison pour laquelle on
          reste dans un club.
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <SectionHead
          eyebrow="Ce qui nous anime"
          title="Un club, pas une salle de sport"
          subtitle="On s'entraîne en groupe, on se déplace en groupe, et on fête les résultats de la même façon."
        />

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <MaskReveal duration={1} className="overflow-hidden rounded-md">
            <img
              src="/photos/club-famille.webp"
              alt="Le club réuni lors de sa soirée annuelle"
              width={1800}
              height={1003}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          </MaskReveal>
          <MaskReveal duration={1} className="overflow-hidden rounded-md">
            <img
              src="/photos/interclub-drapeau.webp"
              alt="Un athlète du club brandissant le drapeau du BEC devant le groupe"
              width={1200}
              height={1600}
              loading="lazy"
              className="h-full min-h-[240px] w-full object-cover object-[center_30%]"
            />
          </MaskReveal>
        </div>

        {/* Les valeurs, en lignes numérotées — mêmes données que /club, format
            resserré (grille de filets, pas de cartes). */}
        <RevealGroup
          stagger={0.12}
          className="mt-4 grid gap-px overflow-hidden rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-line)] sm:grid-cols-2"
        >
          {club.valeurs.map((v, i) => (
            <motion.div
              key={v.titre}
              variants={staggerItem}
              className="flex items-start gap-5 bg-[color:var(--color-surface)] p-6 sm:p-8"
            >
              <span className="stat shrink-0 text-3xl text-club-primary/40">0{i + 1}</span>
              <div>
                <h3 className="mb-2 font-display text-lg font-bold uppercase">{v.titre}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
                  {v.description}
                </p>
              </div>
            </motion.div>
          ))}
        </RevealGroup>

        {/* Bande d'images en défilement continu, qu'on peut aussi pousser soi-
            même (glisser, molette, flèches — cf. <PhotoRail>). Chaque vignette
            ouvre la visionneuse et ne renvoie PAS vers la galerie : le visiteur
            veut voir la photo, pas changer de page. */}
        <div className="mt-16">
          <SectionHead eyebrow="En images" title="Le club en mouvement" to="/mag?tab=galerie" more="Toute la galerie" />
          <Reveal className="-mx-4 sm:mx-0">
            <PhotoRail speed={45}>
              {clubPhotos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  aria-label={`Agrandir : ${p.legende}`}
                  // Pas de `rail-item` ici : l'accrochage se bat avec le
                  // défilement piloté (cf. `.rail-free`).
                  className="group tap relative block h-44 w-64 shrink-0 cursor-pointer overflow-hidden rounded-md sm:h-64 sm:w-96"
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Légende visible d'emblée au doigt (cf. MediaTile). */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100"
                  />
                  <span className="absolute bottom-3 left-4 right-3 truncate text-left text-sm font-semibold text-white transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100">
                    {p.legende}
                  </span>
                </button>
              ))}
            </PhotoRail>
          </Reveal>
        </div>
      </section>

      {/* Visionneuse partagée pour la bande « Le club en mouvement ». */}
      {galleryIndex !== null && (
        <Lightbox
          items={clubPhotos.map((p) => ({ url: p.src, type: 'image' as const }))}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onClose={() => setGalleryIndex(null)}
          renderCaption={(_, i) => clubPhotos[i].legende}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          8 · LE MAG  [CLAIR]
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="pb-16 sm:pb-24">
        <SectionHead eyebrow="Le Mag" title="Derniers articles" to="/mag" more="Tout le Mag" />
        {isLoading && <Loading />}
        {isError && <ErrorMessage message="Impossible de charger les articles." />}
        {posts && posts.length > 0 && (
          <RevealGroup
            stagger={0.08}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3"
          >
            {posts.slice(0, 3).map((post) => (
              <motion.div key={post.id} variants={staggerItem}>
                <BlogCard post={post} />
              </motion.div>
            ))}
          </RevealGroup>
        )}
        {posts && posts.length === 0 && (
          <p className="rounded-md border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
            Aucun article publié pour le moment.
          </p>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          9 · REJOINDRE LE COLLECTIF  [NOIR] — la clôture

          La photo studio : sept athlètes du club, tous en rouge, qui pointent le
          lecteur du doigt. C'est littéralement une invitation — et c'est elle qui
          justifie le duo rouge/or de toute la charte (le blason et les maillots
          réels portent les deux).
          ═══════════════════════════════════════════════════════════════════ */}
      <Chapter
        tone="dark"
        image="/photos/hero-studio-team.webp"
        imageAlt=""
        focus="center 6%"
        veil="flat"
        parallax
        className="py-24 text-center sm:py-32"
      >
        <Reveal className="mx-auto max-w-2xl">
          <p className="eyebrow-photo">Il reste une place</p>
          <h2 className="title-page">De l'initiation à la haute performance</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-muted)]">
            Que tu débutes ou que tu vises le podium, le BEC t'accompagne à chaque foulée.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton>
              <Link to="/rejoindre" className="btn-primary">
                Nous rejoindre
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link to="/rejoindre#contact" className="btn-accent">
                Poser une question
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </Chapter>

      {/* ═══ PARTENAIRES  [CLAIR] — épilogue, hors récit ════════════════════
          Deux colonnes : à gauche QUI nous soutient (la plaque logo seule, la
          description vit sur /club), à droite l'appel à de nouveaux partenaires.
          La colonne de gauche disparaît si `partenaires` est vide ; l'appel, lui,
          reste — c'est le moment où il sert le plus. */}
      <section className="py-16 sm:py-24">
        <SectionHead eyebrow="Ils nous soutiennent" title="Partenaires" to="/club#partenaires" more="Nos partenaires" />
        <Reveal className={`grid gap-4 ${partenaires.length > 0 ? 'lg:grid-cols-[0.8fr_1.2fr]' : ''}`}>
          {partenaires.length > 0 && (
            <div className="card p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold uppercase">
                {partenaires.length > 1 ? 'Nos partenaires' : 'Notre partenaire'}
              </h3>
              {/* `space-y` et non une grille : à un partenaire la grille laissait
                  des colonnes vides, à trois elle les aurait serrés. */}
              <div className="mt-5 space-y-4">
                {partenaires.map((p) => {
                  // Plaque claire par défaut (un logo d'entreprise est dessiné
                  // pour du papier) ; `logoFond: 'sombre'` pour ceux qui sont
                  // déjà clairs et qu'une plaque blanche effacerait.
                  const plaque = (
                    <div
                      className={`flex h-24 items-center justify-center rounded-md px-6 ${
                        p.logoFond === 'sombre'
                          ? 'bg-[color:var(--color-ink)]'
                          : 'border border-[color:var(--color-line)] bg-white'
                      }`}
                    >
                      <img
                        src={p.logo}
                        alt={p.nom}
                        loading="lazy"
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                  )
                  return (
                    <div key={p.nom}>
                      {/* Sans `url`, pas de <a> : on n'affiche pas une affordance
                          de clic qui ne mène nulle part. */}
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="tap block">
                          {plaque}
                        </a>
                      ) : (
                        plaque
                      )}
                      <p className="mt-2.5 text-center text-sm font-semibold">{p.nom}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold uppercase">Devenir partenaire</h3>
            <p className="mt-3 leading-relaxed text-[color:var(--color-muted)]">
              {partenairesAccroche}
            </p>
            {/* Version COMPACTE des besoins : les quatre cartes détaillées
                (`besoinsClub`, texte officiel du club) restent sur /club. */}
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {besoinsCourts.map((besoin) => (
                <li key={besoin} className="flex items-start gap-2.5 text-sm">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-club-primary"
                  />
                  <span>{besoin}</span>
                </li>
              ))}
            </ul>
            <Link to="/rejoindre#contact" className="btn-primary mt-7">
              Devenir partenaire
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </Link>
            {/* `DemandeForm` ouvre sur le motif « Inscription » ; c'est « Autre »
                qui mentionne les partenariats. Faute de paramètre d'URL (choix
                assumé), on l'oriente en clair. */}
            <p className="mt-3 text-xs text-[color:var(--color-muted)]">
              Dans le formulaire, choisis le motif « Autre ».
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
