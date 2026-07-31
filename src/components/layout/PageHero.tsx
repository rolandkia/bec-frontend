import { useEffect, type ReactNode } from 'react'
import { Chapter, SplitLines, motion, useReducedMotion, useSlideshow, EASE } from '../ui/motion'

/** Une photo de bandeau et son cadrage (`object-position`). */
export type HeroPhoto = { src: string; focus?: string }

/**
 * Bandeau de titre de page — CHAPITRE NOIR d'ouverture.
 *
 * Ce bloc (photo + voile dégradé + sur-titre + h1 + accroche) était recopié à
 * l'identique en tête de six pages, chacune avec ses propres valeurs de voile et
 * d'opacité : les en-têtes ne se ressemblaient donc pas tout à fait. Source
 * unique ici.
 *
 * Pourquoi noir alors que le site est clair : l'ouverture de page est le pendant
 * du hero de l'accueil. Elle pose la photo, puis la page bascule en clair juste
 * en dessous — c'est cette respiration qui fait la continuité entre les écrans.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  photos,
  /** l'or plutôt que le rouge en sur-titre (pages palmarès / records) */
  tone = 'red',
  veil = 'strong',
  children,
}: {
  eyebrow: string
  /** une entrée par ligne : le titre entre ligne par ligne (cf. SplitLines) */
  title: string[]
  subtitle?: string
  /**
   * Jeu de photos de fond. UNE seule entrée = fond fixe, aucun minuteur : c'est
   * le cas des bandeaux dont la photo est choisie par autre chose que le temps
   * (l'onglet et le filtre sur /athletes) et de celui de /rejoindre. Plusieurs
   * entrées = elles alternent, avec le fondu enchaîné de <Chapter>.
   */
  photos: HeroPhoto[]
  tone?: 'red' | 'gold'
  /**
   * `flat` pour une photo claire de bout en bout (cf. <Chapter>).
   *
   * Le voile est une prop de la PAGE et non de chaque photo : c'est un `<div>`
   * frère qui n'est pas animé, donc le faire changer en même temps que la photo
   * ferait sauter l'aplat au milieu du fondu. Un jeu qui alterne partage donc un
   * seul voile — en pratique `strong`, le `flat` restant aux clichés studio, qui
   * n'ont jamais qu'une photo.
   */
  veil?: 'strong' | 'flat'
  /** contenu additionnel sous l'accroche (compteur, onglets, boutons…) */
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const index = useSlideshow(photos.length)
  const photo = photos[index]

  // Préchargement EN ROULEMENT : seulement la photo suivante, jamais le jeu
  // entier. Au plus une image en vol, et la première demande part après le
  // montage — donc après le LCP, qui est la photo déjà affichée.
  useEffect(() => {
    if (photos.length < 2) return
    new Image().src = photos[(index + 1) % photos.length].src
  }, [index, photos])

  // Un hero dont le texte CHANGE (onglet, filtre) doit rejouer son entrée,
  // sinon la photo se fond et le texte, lui, se téléporte. Les blocs sont keyés
  // sur leur propre texte : sur une page à titre fixe, rien ne se remonte donc
  // rien ne se rejoue. Pas d'`AnimatePresence` ici volontairement — un
  // `mode="wait"` ouvrirait un trou de mise en page le temps de la sortie, et
  // l'accroche n'a pas le même nombre de lignes d'un onglet à l'autre.
  const enter = reduce
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.45, ease: EASE } }

  return (
    // Contenu calé EN BAS : le voile est concentré dans le tiers bas (cf.
    // `Chapter`), donc c'est la seule zone où un sur-titre rouge et un texte
    // secondaire gris tiennent leur contraste. Aligné en haut, le sur-titre
    // tombait sur du ciel en pleine lumière.
    <Chapter
      tone="dark"
      image={photo.src}
      focus={photo.focus ?? 'center 30%'}
      veil={veil}
      // Un jeu de plusieurs photos = un minuteur (cf. `photos`), donc un fond
      // qui change tout seul : c'est le seul cas qui a besoin de la dérive de
      // zoom pour le dire. Sur une photo unique, il n'y a rien à annoncer.
      drift={photos.length > 1}
      grain
      // SUR TÉLÉPHONE le bandeau est plus court, et les gouttières plus
      // serrées : à 52svh + pt-32, il ne restait RIEN du contenu de la page
      // au-dessus de la ligne de flottaison (sur /athletes, la grille commençait
      // 9 px sous le bord bas de l'écran). La page ressemblait à un cul-de-sac,
      // et surtout les filtres Hommes/Femmes, derniers éléments visibles,
      // semblaient ne rien piloter. Le gabarit `sm:` est inchangé : sur un grand
      // écran l'ouverture pleine hauteur tient son rôle éditorial, et la suite
      // de la page est de toute façon déjà visible.
      className="mb-8 flex min-h-[42svh] items-end sm:mb-16 sm:min-h-[60svh]"
    >
      <div className="w-full pb-10 pt-20 sm:pb-20 sm:pt-44">
        {/* `.eyebrow-photo` : blanc + repère coloré. Cf. index.css — un sur-titre
            en texte coloré ne tient pas son contraste sur une photo claire. */}
        <motion.p
          key={eyebrow}
          {...enter}
          className={`eyebrow-photo ${tone === 'gold' ? 'eyebrow-photo-gold' : ''}`}
        >
          {eyebrow}
        </motion.p>
        <SplitLines
          key={title.join('|')}
          lines={title}
          as="h1"
          className="title-page max-w-4xl"
          trigger="mount"
        />
        {subtitle && (
          <motion.p
            key={subtitle}
            {...enter}
            className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-muted)]"
          >
            {subtitle}
          </motion.p>
        )}
        {children}
      </div>
    </Chapter>
  )
}
