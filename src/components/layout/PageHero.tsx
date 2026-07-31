import type { ReactNode } from 'react'
import { Chapter, SplitLines, motion, useReducedMotion, EASE } from '../ui/motion'

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
  image,
  focus = 'center 30%',
  /** l'or plutôt que le rouge en sur-titre (pages palmarès / records) */
  tone = 'red',
  veil = 'strong',
  children,
}: {
  eyebrow: string
  /** une entrée par ligne : le titre entre ligne par ligne (cf. SplitLines) */
  title: string[]
  subtitle?: string
  image: string
  focus?: string
  tone?: 'red' | 'gold'
  /** `flat` pour une photo claire de bout en bout (cf. <Chapter>). */
  veil?: 'strong' | 'flat'
  /** contenu additionnel sous l'accroche (compteur, onglets, boutons…) */
  children?: ReactNode
}) {
  const reduce = useReducedMotion()

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
      image={image}
      focus={focus}
      veil={veil}
      grain
      className="mb-10 flex min-h-[52svh] items-end sm:mb-16 sm:min-h-[60svh]"
    >
      <div className="w-full pb-14 pt-32 sm:pb-20 sm:pt-44">
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
