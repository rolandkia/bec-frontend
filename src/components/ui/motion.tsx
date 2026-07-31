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
  AnimatePresence,
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
  const ref = useRef<HTMLDivElement>(null)
  // Cf. Reveal : seuil indépendant de la hauteur du groupe (une grille de
  // 12 cartes ne peut pas franchir 15 % d'elle-même).
  const inView = useInView(ref, { once, amount: 'some', margin: '0px 0px -15% 0px' })

  if (reduce) {
    return <div {...(rest as ComponentPropsWithoutRef<'div'>)}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      // `animate` piloté à la main, PAS `whileInView` : un groupe dont les
      // enfants changent après coup (liste filtrée, recherche, pagination) est
      // le cas que `whileInView` ne sait pas tenir. Ses enfants héritent
      // `initial: 'hidden'` du contexte, donc ils NAISSENT à opacité 0 ; or
      // `whileInView` démarre `isActive: false` sur chaque nouvel enfant et
      // n'est réveillé que par l'IntersectionObserver, qui ne se propage
      // qu'aux enfants présents à cet instant — et ne se redéclenche plus
      // ensuite avec `once`. Les cartes ajoutées restaient donc invisibles
      // tout en étant cliquables. `animate` est le seul type actif par défaut :
      // un enfant monté plus tard résout la variante héritée et s'anime
      // lui-même, cascade comprise.
      animate={inView ? 'show' : 'hidden'}
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
   useSlideshow — fait tourner un index sur un jeu d'éléments. Le seul minuteur
   du site : tout le reste du mouvement est piloté par le scroll ou par un
   événement d'entrée. Sert aux bandeaux de page dont la photo alterne.

   Le fondu, lui, n'est PAS ici : `Chapter` enchaîne déjà ses photos dès que sa
   prop `image` change. Ce hook ne fait que dire quand changer.

   ACCESSIBILITÉ (WCAG 2.2.2 « Pause, Stop, Hide ») : un fond qui se met à jour
   tout seul entre dans le champ du critère. La mitigation tient à trois choses —
   la photo est purement décorative (`aria-hidden`, aucune information portée),
   le texte posé dessus ne bouge jamais, et `prefers-reduced-motion` arrête
   complètement la rotation (voir plus bas). À ne pas détourner vers du contenu
   qui, lui, porterait de l'information : il faudrait alors une commande de pause.
   ─────────────────────────────────────────────────────────────────────────── */
export function useSlideshow(count: number, intervalMs = 7000) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Sous reduced-motion on GÈLE le diaporama, on ne se contente pas de couper
    // le fondu : dans ce mode `Chapter` rend un `<img>` nu, donc la rotation
    // deviendrait une coupe sèche toutes les 7 s — précisément ce que la
    // préférence demande d'éviter.
    if (reduce || count < 2) return

    const id = setInterval(() => {
      // Onglet en arrière-plan : on ne décode pas des photos que personne ne
      // regarde. Le navigateur bride déjà les minuteurs des onglets cachés,
      // mais pas assez pour qu'on lui laisse enchaîner des images dans le vide.
      if (!document.hidden) setIndex((prev) => (prev + 1) % count)
    }, intervalMs)

    return () => clearInterval(id)
  }, [reduce, count, intervalMs])

  // Le jeu peut rétrécir entre deux rendus (jamais aujourd'hui, mais l'index
  // survivrait au changement et pointerait dans le vide).
  return index < count ? index : 0
}

/* ───────────────────────────────────────────────────────────────────────────
   CountUp — anime un nombre de 0 → cible quand il entre dans le viewport.
   Accepte une chaîne (« 120+ », « 20+ », « 6 ») : le préfixe/suffixe non
   numérique est conservé, seule la partie chiffrée est animée. `prefers-
   reduced-motion` → affiche directement la valeur finale.

   NB : sans consommateur depuis le retrait des « chiffres clés » de l'accueil.
   Conservé comme primitive du module (à réutiliser pour un compteur issu de
   l'API, pas pour un chiffre éditorial inventé). Surtout PAS pour une année :
   animer 0 → 1968 n'a aucun sens.
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
  /** styles additionnels (typiquement `objectPosition` — cf. <Chapter>) */
  style?: CSSProperties
}

export function ParallaxImage({
  src,
  alt = '',
  className,
  loading,
  fetchPriority,
  strength = 40,
  style,
}: ParallaxImageProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])

  if (reduce) {
    return (
      <img
        src={src}
        alt={alt}
        aria-hidden={alt === '' || undefined}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        style={style}
      />
    )
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        aria-hidden={alt === '' || undefined}
        loading={loading}
        fetchPriority={fetchPriority}
        className={className}
        style={{ ...style, y, scale: 1.14 }}
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

/* ═══════════════════════════════════════════════════════════════════════════
   CHAPITRES — la grammaire narrative du site.

   Le récit alterne des sections CLAIRES (papier) et NOIRES (tension). Un
   chapitre noir porte `.chapter-dark`, qui redéfinit les tokens sémantiques sur
   son sous-arbre (cf. index.css) : le contenu à l'intérieur s'écrit avec les
   mêmes classes qu'ailleurs et s'inverse tout seul.
   ═══════════════════════════════════════════════════════════════════════════ */
type ChapterProps = {
  children: ReactNode
  /** ton du chapitre — `dark` inverse tous les tokens de son sous-arbre */
  tone?: 'light' | 'dark'
  /** photo de fond (déjà en .webp, servie depuis /photos) */
  image?: string
  /** texte alternatif de la photo ; vide ⇒ décorative (aria-hidden) */
  imageAlt?: string
  /** cadrage de la photo (`object-position`) */
  focus?: string
  /**
   * Intensité du voile de lisibilité posé sur la photo.
   * `soft`/`strong` = dégradé concentré en bas, pour une photo qui a une zone
   * sombre où poser le texte. `flat` ajoute en plus un voile UNIFORME : à
   * réserver aux photos claires de bout en bout (le cliché studio sur fond
   * orange), où un dégradé ne peut rien — le texte y tombe forcément sur du
   * clair, quelle que soit sa position.
   */
  veil?: 'none' | 'soft' | 'strong' | 'flat'
  /** parallaxe verticale discrète sur la photo */
  parallax?: boolean
  /** grain léger (casse le vide d'un aplat noir sur grand écran) */
  grain?: boolean
  /**
   * Image du LCP (hero de l'accueil) : chargée en `eager` + priorité haute, et
   * JAMAIS sous parallaxe. Un seul `priority` par page — au-delà, on se met en
   * concurrence avec soi-même sur la bande passante.
   */
  priority?: boolean
  className?: string
  id?: string
}

export function Chapter({
  children,
  tone = 'light',
  image,
  imageAlt = '',
  focus = 'center',
  veil = 'soft',
  parallax = false,
  grain = false,
  priority = false,
  className = '',
  id,
}: ChapterProps) {
  const dark = tone === 'dark'
  const reduce = useReducedMotion()
  // La parallaxe est incompatible avec l'image du LCP : elle la place sous un
  // conteneur animé dès le premier rendu, ce que le navigateur ne peut pas
  // précharger aussi tôt.
  const withParallax = parallax && !priority

  // Attributs communs aux deux rendus de la photo de fond (statique / fondu).
  const imgProps = {
    src: image,
    alt: imageAlt,
    'aria-hidden': imageAlt === '' || undefined,
    loading: (priority ? 'eager' : 'lazy') as 'eager' | 'lazy',
    fetchPriority: (priority ? 'high' : undefined) as 'high' | undefined,
    decoding: (priority ? 'sync' : 'async') as 'sync' | 'async',
    className: 'absolute inset-0 h-full w-full object-cover',
    style: { objectPosition: focus },
  }

  return (
    <section
      id={id}
      className={`chapter ${dark ? 'chapter-dark' : ''} ${grain && dark ? 'grain' : ''} ${className}`}
    >
      {image &&
        (withParallax ? (
          <ParallaxImage
            src={image}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: focus }}
          />
        ) : reduce ? (
          <img {...imgProps} />
        ) : (
          /* FONDU ENCHAÎNÉ quand `image` change (chapitre piloté par un onglet
             ou un filtre : cf. /athletes). Sur les chapitres à photo littérale
             la clé ne bouge jamais — un seul enfant, aucun nœud ajouté, aucun
             changement de comportement.

             `initial={false}` : au chargement de la page la photo s'affiche
             pleine opacité tout de suite, on ne met pas un fondu sur le LCP.
             La photo sortante TIENT son opacité pendant que l'entrante monte
             (délai sur son `exit`) : sans ça les deux se croisent à mi-course
             et le fond du chapitre apparaît une fraction de seconde entre les
             deux clichés — un flash noir. L'entrante est rendue APRÈS la
             sortante, donc peinte au-dessus, et `AnimatePresence` conserve
             l'élément précédent tel quel : la photo qui s'en va garde son
             propre cadrage, elle ne saute pas. */
          <AnimatePresence initial={false}>
            <motion.img
              key={image}
              {...imgProps}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.6 } }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </AnimatePresence>
        ))}

      {/* Voile de lisibilité. Dégradé DEPUIS LE BAS, et concentré dans le tiers
          bas : le haut de la photo (ciel, gradins, fumigènes) reste INTACT —
          c'est là qu'est l'émotion —, tandis que le texte, toujours posé en bas,
          gagne son contraste. Un voile étalé jusqu'en haut virait le ciel bleu
          au gris sale et éteignait les visages du groupe.
          Second voile latéral léger : le texte occupe la moitié gauche. */}
      {image && veil !== 'none' && (
        <>
          {/* Voile UNIFORME, seulement pour `flat` : sur une photo claire de bout
              en bout, aucun dégradé ne sauve le texte. 38 % suffisent à faire
              passer un sur-titre de 12 px de 3,9:1 à ~6,7:1, en laissant la
              photo lisible (mesuré au pixel). */}
          {veil === 'flat' && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'color-mix(in oklab, var(--color-canvas) 38%, transparent)' }}
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top,
                var(--color-canvas) 0%,
                color-mix(in oklab, var(--color-canvas) ${veil === 'strong' ? '88%' : '78%'}, transparent) 22%,
                color-mix(in oklab, var(--color-canvas) ${veil === 'strong' ? '45%' : '28%'}, transparent) 52%,
                transparent 82%)`,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right,
                color-mix(in oklab, var(--color-canvas) ${veil === 'strong' ? '55%' : '40%'}, transparent) 0%,
                transparent 65%)`,
            }}
          />
        </>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-safe">{children}</div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   MaskReveal — la grande image se DÉVOILE par un volet (`clip-path: inset`)
   plutôt que d'apparaître en fondu. Réservé aux photos pleine largeur : c'est
   le geste le plus « editorial » du lot, il perd tout son sens répété partout.
   `clip-path` est composité par le GPU (aucun reflow).
   ─────────────────────────────────────────────────────────────────────────── */
export function MaskReveal({
  children,
  /** sens d'ouverture du volet */
  from = 'bottom',
  duration = 0.9,
  className,
}: {
  children: ReactNode
  from?: 'bottom' | 'left'
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  const closed = from === 'left' ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)'

  return (
    <motion.div
      className={className}
      initial={{ clipPath: closed }}
      whileInView={{ clipPath: 'inset(0 0 0 0)' }}
      viewport={{ once: true, amount: 'some', margin: '0px 0px -12% 0px' }}
      transition={{ duration, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   ScrubImage — image dont le cadrage est PILOTÉ PAR LA POSITION DE SCROLL
   (« scrub »), et non par une durée. Le mouvement est donc exactement celui du
   doigt / de la molette : c'est ce qui donne la sensation de tension continue.
   Le parent doit être `sticky`.

   UNE SEULE section du site en est équipée (le chapitre « Le départ ») :
   multiplier les sections épinglées se bat contre le scroll natif et dégrade
   nettement le ressenti sur mobile.
   ─────────────────────────────────────────────────────────────────────────── */
export function ScrubImage({
  src,
  alt = '',
  focus = 'center',
  className = '',
}: {
  src: string
  alt?: string
  focus?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // Resserrage lent : la photo « avance » vers le lecteur pendant la traversée.
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1])
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  if (reduce) {
    return (
      <img
        src={src}
        alt={alt}
        aria-hidden={alt === '' || undefined}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        style={{ objectPosition: focus }}
      />
    )
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        aria-hidden={alt === '' || undefined}
        className={`h-full w-full object-cover ${className}`}
        style={{ scale, y, objectPosition: focus }}
      />
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   SplitLines — un titre entre LIGNE PAR LIGNE, chaque ligne glissant de sous un
   masque. Le découpage est explicite (tableau de chaînes) et non calculé au
   rendu : mesurer les retours à la ligne réels imposerait une lecture de layout
   à chaque redimensionnement, et une ligne coupée par le navigateur pendant
   l'animation ferait sauter le masque.

   `overflow-hidden` est sur un span de niveau bloc par ligne : c'est lui le
   volet. `pb` compense les jambages (g, y, j) que le masque couperait sinon.
   ─────────────────────────────────────────────────────────────────────────── */
export function SplitLines({
  lines,
  className = '',
  delay = 0,
  stagger = 0.06,
  as: Tag = 'h1',
  trigger = 'inView',
}: {
  lines: string[]
  className?: string
  delay?: number
  stagger?: number
  as?: 'h1' | 'h2' | 'p' | 'div'
  /**
   * `'mount'` pour un titre AU-DESSUS de la ligne de flottaison (hero, bandeau
   * de page) : il doit s'animer à l'arrivée, pas « quand il entre à l'écran »,
   * puisqu'il y est déjà. C'est aussi le seul mode fiable à l'intérieur d'un
   * conteneur à variants (`initial`/`animate` orchestrés par un parent) : le
   * parent y prend la main sur l'`animate` de ses descendants motion, et le
   * `whileInView` de l'enfant ne se déclenche jamais — c'est ce qui laissait la
   * 2e ligne du hero bloquée sous son masque.
   */
  trigger?: 'inView' | 'mount'
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <Tag className={className}>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </Tag>
    )
  }

  const inView = trigger === 'inView'

  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        // `overflow-hidden` fait le volet ; `pb` compense les jambages (g, y, j)
        // que le masque couperait sinon.
        <span key={i} className="block overflow-hidden pb-[0.12em]">
          <motion.span
            className="block"
            initial={{ y: '110%' }}
            {...(inView
              ? {
                  whileInView: { y: '0%' },
                  viewport: { once: true, amount: 'some' as const, margin: '0px 0px -10% 0px' },
                }
              : { animate: { y: '0%' } })}
            transition={{ duration: 0.7, ease: EASE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   MagneticButton — le bouton s'incline VERS le curseur (≤ 5 px). Micro-retour
   qui rend les CTA « vivants » sans les déplacer assez pour qu'on les rate.

   Souris fine UNIQUEMENT : au doigt il n'y a pas de curseur à suivre, et le
   `.tap` du système fournit déjà le retour d'appui. On n'attache donc aucun
   écouteur sur tactile (zéro coût).
   ─────────────────────────────────────────────────────────────────────────── */
export function MagneticButton({
  children,
  className = '',
  strength = 5,
  ...rest
}: ComponentPropsWithoutRef<typeof motion.div> & {
  children: ReactNode
  strength?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const fine = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  if (reduce || !fine) {
    return (
      <div className={`inline-flex ${className}`} {...(rest as ComponentPropsWithoutRef<'div'>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-flex ${className}`}
      animate={offset}
      transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.4 }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        setOffset({
          x: ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength,
          y: ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength,
        })
      }}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export { motion, useReducedMotion, EASE }
