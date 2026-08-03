import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Target } from 'lucide-react'
import { club } from '../data/club'
import { besoinsClub, partenaires, partenairesIntro } from '../data/partenaires'
import { faitsPalmares, figuresActuelles, figureHistorique, histoireIntro } from '../data/palmares'
import { listCoachs } from '../api/coachs'
import type { CoachOut } from '../api/types'
import { Chapter, MaskReveal, Reveal, RevealGroup, motion, staggerItem } from '../components/ui/motion'
import { AnchorNav, type Anchor } from '../components/layout/AnchorNav'
import { PageHero, type HeroPhoto } from '../components/layout/PageHero'
import { SectionHead } from '../components/ui/SectionHead'
import { Avatar } from '../components/ui/Avatar'
import { FigureCard } from '../components/club/FigureCard'
import { PalmaresTimeline } from '../components/club/PalmaresTimeline'
import { PartenaireCard } from '../components/club/PartenaireCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { PHONE_PHOTO_CAP, cldPortrait, sitePhotoProps } from '../lib/cloudinary'
import { getInitials } from '../utils/initials'

// `short` : version affichée sous `sm`, où les quatre items se partagent la
// largeur d'écran (cf. AnchorNav).
const ANCHORS: Anchor[] = [
  { id: 'histoire', label: 'Notre histoire', short: 'Histoire' },
  { id: 'palmares', label: 'Palmarès' },
  { id: 'equipe', label: "L'équipe", short: 'Équipe' },
  { id: 'partenaires', label: 'Partenaires' },
]

/**
 * Le bandeau alterne : « Depuis 1897 » et « un collectif qui s'entraîne toujours
 * sur la même piste », ça ne se raconte pas avec une seule photo. Les trois
 * changent d'échelle plutôt que de sujet — le club entier, puis une poignée
 * d'athlètes, puis un seul visage.
 */
const HERO_PHOTOS: HeroPhoto[] = [
  // Le club au complet à la soirée annuelle : une trentaine de personnes, tous
  // les âges, chaque visage net. C'est ce que les photos de piste ne disent pas.
  { src: '/photos/gallery/group-8.webp', focus: 'center 35%' },
  // Quatre athlètes en rouge, indoor, bras ouverts. Cadrage haut : leurs têtes
  // sont à 3,5 % du bord supérieur, au-delà de 6 % on les rogne.
  { src: '/photos/gallery/group-2.webp', focus: 'center 5%' },
  // Un seul athlète, mur bleu-vert, lumière rasante — la respiration du jeu.
  { src: '/photos/gallery/concentration-4.webp', focus: 'center 20%' },
]

function MembreCard({ m }: { m: CoachOut }) {
  return (
    <motion.div
      variants={staggerItem}
      className="group card card-hover tap flex flex-col items-center p-5 text-center sm:p-8"
    >
      {/* Anneau dégradé rouge → or : le seul endroit du site où les deux
          couleurs de marque se touchent, et c'est justifié — le blason du club
          les porte ensemble. */}
      <div className="mb-4 rounded-full bg-gradient-to-br from-club-primary via-club-primary to-club-accent p-[3px] transition duration-500 sm:mb-5">
        <div className="overflow-hidden rounded-full ring-4 ring-[color:var(--color-surface)]">
          <div className="transition-transform duration-500 ease-out group-hover:scale-110">
            <Avatar
              src={m.photo_url ? cldPortrait(m.photo_url, 300) : undefined}
              alt={`${m.prenom} ${m.nom}`}
              initials={getInitials(m.prenom, m.nom)}
              size="h-24 w-24 sm:h-32 sm:w-32"
              rounded="rounded-full"
              textSize="text-3xl sm:text-4xl"
            />
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
        {m.role}
      </p>
      <p className="mt-1.5 font-display text-lg font-bold uppercase leading-tight">
        {m.prenom} {m.nom}
      </p>
      {m.bio && <p className="mt-2 text-sm text-[color:var(--color-muted)]">{m.bio}</p>}
    </motion.div>
  )
}

/**
 * « Le Club » — page longue en quatre mouvements, ex-/club + ex-/palmares.
 *
 * Les deux pages racontaient la même chose en se coupant la parole : /club
 * ouvrait sur « Notre histoire » puis présentait l'équipe, /palmares rouvrait
 * sur « Notre histoire » avec un autre texte et la même mise en page en split.
 * Un seul récit ici, jalonné par une sous-nav à ancres (`AnchorNav`). L'ancienne
 * URL /palmares redirige vers `#palmares`.
 */
export function ClubPage() {
  const { data: coachs, isLoading, isError } = useQuery({
    queryKey: ['coachs'],
    queryFn: listCoachs,
  })

  const bureau = (coachs ?? []).filter((c) => c.categorie === 'bureau')
  const encadrement = (coachs ?? []).filter((c) => c.categorie === 'encadrement')

  return (
    <div>
      <PageHero
        eyebrow="Depuis 1897"
        title={['Le doyen', 'des clubs', 'universitaires']}
        subtitle="Une championne olympique, des champions d'Europe, un finaliste olympique en 2024. Et un collectif qui s'entraîne toujours sur la même piste."
        photos={HERO_PHOTOS}
      />

      <AnchorNav anchors={ANCHORS} />

      <div className="space-y-20 sm:space-y-28">
        {/* ═══ 1 · NOTRE HISTOIRE ═══════════════════════════════════════════ */}
        <section id="histoire" className="scroll-mt-32">
          <SectionHead eyebrow="Notre histoire" title="Un collectif, une exigence" />
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <p className="text-lg leading-relaxed text-[color:var(--color-muted)]">
                {club.histoire}
              </p>
              <p className="mt-5 leading-relaxed text-[color:var(--color-muted)]">{histoireIntro}</p>
            </Reveal>
            {/* Le volet s'ouvre depuis la gauche, du même côté que le texte : le
                regard finit sa ligne et l'image se dévoile dans son prolongement. */}
            <MaskReveal from="left" className="overflow-hidden rounded-md">
              {/* RÈGLE : ne jamais forcer une source PORTRAIT dans une boîte
                  PAYSAGE en comptant sur `object-position` seul. Ici la source
                  fait 1100×1350 (r=0,81) pour une boîte 4:3 (r=1,33) : seuls 61 %
                  de la hauteur sont visibles, et centrés (50 %) la bande allait
                  de 19 % à 81 % — soit exactement au-dessous du visage, qui vit
                  entre 2 % et 16 %. À 4 %, elle va de 1,6 % à 62,6 % : tête,
                  buste, maillot et écusson dans le cadre.
                  `width`/`height` corrigés au passage : ils annonçaient 1500×1000
                  (paysage) pour un fichier portrait, donc la boîte réservée
                  contre le CLS était fausse. */}
              <img
                {...sitePhotoProps('/photos/concentration-01.webp', {
                  sizes: `${PHONE_PHOTO_CAP}, (min-width: 1024px) 50vw, 100vw`,
                })}
                alt="Athlète du club à l'entraînement, mains sur les hanches"
                width={1100}
                height={1350}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover object-[center_4%]"
              />
            </MaskReveal>
          </div>

          {/* Les valeurs, en lignes numérotées. */}
          <RevealGroup className="mt-14 grid gap-px overflow-hidden rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-line)] sm:grid-cols-2">
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
        </section>
      </div>

      {/* ═══ 2 · PALMARÈS — chapitre NOIR ═══════════════════════════════════
          Le seul endroit du site où l'or est chez lui. Le fond bascule : on
          quitte la présentation du club pour entrer dans ses titres. */}
      <Chapter
        tone="dark"
        grain
        id="palmares"
        className="my-20 scroll-mt-32 py-20 sm:my-28 sm:py-28"
      >
        <SectionHead
          eyebrow="Aujourd'hui"
          title="Le palmarès s'écrit encore"
          subtitle="Deux athlètes du club portent ses couleurs au plus haut niveau national et international."
          tone="gold"
        />
        {/* Alternance photo gauche / droite d'un portrait au suivant : deux
            encarts identiques d'affilée aplatissent la page. `direction="left"`
            va de pair avec la photo à droite. */}
        <div className="space-y-6">
          {figuresActuelles.map((figure, i) => (
            <Reveal key={figure.nom} direction={i % 2 === 0 ? 'up' : 'left'}>
              <FigureCard figure={figure} imageSide={i % 2 === 0 ? 'left' : 'right'} />
            </Reveal>
          ))}
        </div>

        {/* La championne olympique du club — 1968. Elle n'existait jusqu'ici que
            sous forme de texte alors que c'est le plus grand titre du palmarès. */}
        <div className="mt-20">
          <SectionHead eyebrow="1968" title="La championne olympique du club" tone="gold" />
          <Reveal>
            <FigureCard figure={figureHistorique} />
          </Reveal>
        </div>

        {/* Frise des faits marquants */}
        <div className="mt-20">
          <SectionHead
            eyebrow="Les grandes dates"
            title="Faits marquants"
            subtitle="En or, les titres et médailles internationaux."
            tone="gold"
          />
          <PalmaresTimeline faits={faitsPalmares} />
        </div>

        <Reveal className="mt-16">
          <hr className="rule-gold mb-8" />
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl leading-relaxed text-[color:var(--color-muted)]">
              Les records du club continuent de tomber, saison après saison. Et la prochaine ligne de
              ce palmarès reste à écrire.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/athletes?tab=records" className="btn-ffa">
                Les records du club
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link to="/rejoindre" className="btn-primary">
                Nous rejoindre
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </Reveal>
      </Chapter>

      <div className="space-y-20 sm:space-y-28">
        {/* ═══ 3 · L'ÉQUIPE ════════════════════════════════════════════════ */}
        <section id="equipe" className="scroll-mt-32">
          <SectionHead
            eyebrow="Celles et ceux qui font tourner le club"
            title="L'équipe"
          />
          {isLoading ? (
            <Loading label="Chargement de l'équipe…" />
          ) : isError ? (
            <ErrorMessage message="Impossible de charger l'équipe du club." />
          ) : (
            <div className="space-y-14">
              {bureau.length > 0 && (
                <div>
                  <h3 className="mb-5 font-display text-xl font-bold uppercase tracking-wide">
                    Le bureau
                  </h3>
                  {/* 2 par ligne dès le mobile : la fiche est courte (photo, rôle,
                      nom), une colonne unique donnait une liste interminable. */}
                  <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                    {bureau.map((m) => (
                      <MembreCard key={m.id} m={m} />
                    ))}
                  </RevealGroup>
                </div>
              )}
              {encadrement.length > 0 && (
                <div>
                  <h3 className="mb-5 font-display text-xl font-bold uppercase tracking-wide">
                    L'encadrement
                  </h3>
                  <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                    {encadrement.map((m) => (
                      <MembreCard key={m.id} m={m} />
                    ))}
                  </RevealGroup>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═══ 4 · PARTENAIRES ═════════════════════════════════════════════ */}
        <section id="partenaires" className="scroll-mt-32 pb-8">
          <SectionHead
            eyebrow="Ils nous soutiennent"
            title="Partenaires"
            subtitle={partenairesIntro}
          />
          {partenaires.length > 0 ? (
            // Une seule colonne tant qu'il n'y a qu'un partenaire : la carte est
            // un split logo + description, elle a besoin de la pleine largeur.
            <div className={`grid gap-4 ${partenaires.length > 1 ? 'lg:grid-cols-2' : ''}`}>
              {partenaires.map((p) => (
                <PartenaireCard key={p.nom} partenaire={p} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-[color:var(--color-line)] py-8 text-center text-[color:var(--color-muted)]">
              Nos partenaires seront présentés ici prochainement. Vous souhaitez soutenir le club ?{' '}
              <Link
                to="/rejoindre#contact"
                className="font-semibold text-club-primary-light underline"
              >
                Contactez-nous
              </Link>
              .
            </p>
          )}

          {/* Ce à quoi sert concrètement un partenariat : la contrepartie du
              paragraphe d'intro, sans laquelle « devenir partenaire » reste une
              formule creuse. */}
          <h3 className="mb-4 mt-14 font-display text-xl font-bold uppercase tracking-wide">
            Nos besoins
          </h3>
          <RevealGroup className="grid gap-3 sm:grid-cols-2">
            {besoinsClub.map((besoin) => (
              <motion.div key={besoin} variants={staggerItem} className="card flex items-start gap-3 p-5">
                <Target
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light"
                  strokeWidth={2}
                />
                <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">{besoin}</p>
              </motion.div>
            ))}
          </RevealGroup>
          <div className="mt-8">
            {/* Vers le formulaire du site plutôt qu'un `mailto:` : /rejoindre porte
                déjà le motif « Autre » (partenariat, presse), et la demande passe
                par le backend au lieu du client mail du visiteur. */}
            <Link to="/rejoindre#contact" className="btn-primary">
              Devenir partenaire
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
