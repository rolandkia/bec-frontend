/**
 * Primitives d'animation réutilisables (Framer Motion) — direction du brief :
 *  - mouvement DIRECTIONNEL uniquement (bas→haut, gauche→droite)
 *  - durée 200–700 ms, stagger 80–120 ms
 *  - GPU-accelerated (transform / opacity seulement)
 *  - respect de `prefers-reduced-motion`
 *
 * Tous les composants du site consomment ces helpers plutôt que d'écrire des
 * animations ad hoc → cohérence du motion design sur tout le site.
 */
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
  animate,
  type Variants,
  type Transition,
} from 'framer-motion'
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

// Courbe « premium » douce (ease-out) partagée.
const EASE: Transition['ease'] = [0.22, 1, 0.36, 1]

/** Apparition bas→haut. `d` = distance de translation initiale (px). */
export const fadeUp = (d = 24, duration = 0.5): Variants => ({
  hidden: { opacity: 0, y: d },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
})

/** Apparition gauche→droite. */
export const fadeInLeft = (d = 32, duration = 0.5): Variants => ({
  hidden: { opacity: 0, x: -d },
  show: { opacity: 1, x: 0, transition: { duration, ease: EASE } },
})

/** Conteneur qui décale l'entrée de ses enfants (stagger 80–120 ms). */
export const staggerContainer = (stagger = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

type RevealProps = ComponentPropsWithoutRef<typeof motion.div> & {
  children: ReactNode
  /** direction d'entrée */
  direction?: 'up' | 'left'
  /** distance de translation initiale (px) */
  distance?: number
  /** durée (s), bornée 0.2–0.7 par le brief */
  duration?: number
  /** délai avant l'entrée (s) */
  delay?: number
  /** rejoue à chaque passage dans le viewport (défaut : une seule fois) */
  once?: boolean
}

/**
 * Wrapper « au scroll » : anime son contenu quand il entre dans le viewport.
 * Neutralise tout mouvement si l'utilisateur préfère les animations réduites.
 */
export function Reveal({
  children,
  direction = 'up',
  distance = 24,
  duration = 0.5,
  delay = 0,
  once = true,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion()
  const variants = direction === 'left' ? fadeInLeft(distance, duration) : fadeUp(distance, duration)

  if (reduce) {
    // Pas de mouvement : on rend le contenu tel quel (opacité pleine).
    return <div {...(rest as ComponentPropsWithoutRef<'div'>)}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      // `amount` est une FRACTION de l'élément : un bloc plus haut que quelques
      // fois le viewport (une `band` mobile, une longue liste) ne peut jamais
      // atteindre un seuil de 0.2 et resterait à opacité 0 tout en étant
      // cliquable. `'some'` + marge basse négative déclenche quand le haut du
      // bloc franchit 85 % du viewport : même ressenti, sans dépendre de la
      // hauteur.
      viewport={{ once, amount: 'some', margin: '0px 0px -15% 0px' }}
      variants={variants}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * Conteneur staggeré « au scroll ». Les enfants directs doivent utiliser
 * `variants={fadeUp()}` (ou `staggerItem`) pour hériter de la cascade.
 */
export function RevealGroup({
  children,
  stagger = 0.1,
  once = true,
  ...rest
}: ComponentPropsWithoutRef<typeof motion.div> & {
  children: ReactNode
  stagger?: number
  once?: boolean
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div {...(rest as ComponentPropsWithoutRef<'div'>)}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      // Cf. Reveal : seuil indépendant de la hauteur du groupe (une grille de
      // 12 cartes ne peut pas franchir 15 % d'elle-même).
      viewport={{ once, amount: 'some', margin: '0px 0px -15% 0px' }}
      variants={staggerContainer(stagger)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Variant à poser sur les enfants d'un `RevealGroup`. */
export const staggerItem = fadeUp()

/* ───────────────────────────────────────────────────────────────────────────
   CountUp — anime un nombre de 0 → cible quand il entre dans le viewport.
   Accepte une chaîne (« 120+ », « 20+ », « 6 ») : le préfixe/suffixe non
   numérique est conservé, seule la partie chiffrée est animée. `prefers-
   reduced-motion` → affiche directement la valeur finale.
   ─────────────────────────────────────────────────────────────────────────── */
export function CountUp({
  value,
  duration = 1.4,
  className,
}: {
  value: string
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  const match = /^(\D*)([\d\s.,]+)(.*)$/.exec(value.trim())
  const prefix = match?.[1] ?? ''
  const rawNum = match?.[2] ?? ''
  const suffix = match?.[3] ?? ''
  const decimals = (rawNum.split(/[.,]/)[1] ?? '').replace(/\s/g, '').length
  const target = Number(rawNum.replace(/\s/g, '').replace(',', '.'))
  const hasNumber = match !== null && Number.isFinite(target)

  const [display, setDisplay] = useState(hasNumber && !reduce ? 0 : target)

  useEffect(() => {
    if (!hasNumber || reduce || !inView) {
      setDisplay(target)
      return
    }
    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, reduce, target, duration, hasNumber])

  if (!hasNumber) return <span className={className}>{value}</span>

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   ParallaxImage — image de fond avec parallaxe verticale DISCRÈTE au scroll
   (transform seul, GPU). Neutralisée sous reduced-motion. L'image est
   sur-dimensionnée (scale) pour qu'aucun bord n'apparaisse pendant la
   translation. Poser `object-cover` + un positionnement via `className`.
   ─────────────────────────────────────────────────────────────────────────── */
type ParallaxImageProps = {
  src: string
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  /** amplitude de translation (px) — bornée discrète par le brief */
  strength?: number
}

export function ParallaxImage({
  src,
  alt = '',
  className,
  loading,
  fetchPriority,
  strength = 40,
}: ParallaxImageProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])

  if (reduce) {
    return <img src={src} alt={alt} className={className} loading={loading} fetchPriority={fetchPriority} />
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        className={className}
        style={{ y, scale: 1.14 }}
      />
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Marquee — défilement horizontal continu (transform seul, GPU) via une
   keyframe CSS (`.animate-marquee`, cf. index.css) : la pause au survol se fait
   en pur CSS. Le contenu est dupliqué pour une boucle sans couture.

   SOUS 640 px : pas d'animation, mais un rail glissable. Sans survol, la piste
   ne peut pas être mise en pause — on demanderait à l'utilisateur de taper une
   cible mouvante. Le clone, qui ne sert qu'à la boucle sans couture, n'est donc
   pas monté (ni téléchargé) sur mobile.
   Sous reduced-motion → simple rangée scrollable (pas d'animation).
   ─────────────────────────────────────────────────────────────────────────── */
export function Marquee({
  children,
  duration = 40,
  className = '',
}: {
  children: ReactNode
  /** durée d'un cycle complet (s) */
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={`rail flex gap-4 overflow-x-auto ${className}`}>{children}</div>
  }

  return (
    <div className={`rail overflow-x-auto sm:overflow-hidden ${className}`}>
      <div
        className="flex w-max gap-4 sm:animate-marquee"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="hidden shrink-0 gap-4 sm:flex" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

export { motion, useReducedMotion }
