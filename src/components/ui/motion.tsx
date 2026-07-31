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
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  /**
   * FILET DE SÉCURITÉ : un groupe qui commence dans le PREMIER ÉCRAN (à une
   * marge près) est révélé sans attendre de défilement.
   *
   * Le seuil d'entrée ci-dessus demande que le haut du groupe franchisse 85 %
   * de la hauteur de fenêtre. Sous un bandeau de page haut, sur un téléphone,
   * la grille commence quelques pixels SOUS la ligne de flottaison (mesuré sur
   * /athletes en iPhone : haut de grille à 673 px pour 664 px d'écran) : elle
   * ne franchit donc jamais ce seuil tant qu'on ne défile pas. Le contenu
   * existait, était cliquable, et restait à opacité 0 — et surtout, changer le
   * filtre Hommes/Femmes ne produisait AUCUN changement visible à l'écran,
   * puisque la seule chose qui bouge est hors champ.
   *
   * Mesuré en coordonnées DOCUMENT (donc indépendant de la position de scroll
   * restaurée par le navigateur), une fois après la peinture : ce qui est
   * au-dessus du groupe a une hauteur déjà fixée à cet instant (le bandeau a une
   * hauteur minimale, pas une hauteur d'image). Les 10 % de marge absorbent le
   * reflow des polices web.
   */
  const [firstScreen, setFirstScreen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (top < window.innerHeight * 1.1) setFirstScreen(true)
  }, [])

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
      animate={inView || firstScreen ? 'show' : 'hidden'}
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
   DÉRIVE DE ZOOM (cf. la prop `drift` de <Chapter>) — le fondu ne dure que
   0,6 s, donc une photo de diaporama restait STRICTEMENT immobile les 6,4 s
   suivantes : rien ne disait qu'il y avait un diaporama, et le changement
   arrivait comme une surprise. Une lente entrée dans l'image suffit à le dire.

   Portée par un CONTENEUR au-dessus du fondu, et non par les photos
   elles-mêmes. Deux raisons, la seconde étant rédhibitoire :

   1. le fondu devient un vrai fondu — les deux clichés partagent la même
      échelle pendant la demi-seconde où ils se superposent, donc aucun décalage
      de cadrage entre l'entrant et le sortant ;
   2. `AnimatePresence initial={false}` (nécessaire pour ne pas fondre le LCP)
      fait rendre son premier enfant DIRECTEMENT à son état `animate`. Une
      échelle posée sur la photo restait donc collée à sa valeur finale pendant
      toute la durée de la première photo — mesuré : 1,06 immobile de 0 à 7 s,
      la dérive ne démarrait qu'à la deuxième. Les images clés ne sauvent pas
      ce cas, la suppression vaut pour tout le sous-arbre. Le conteneur, lui,
      n'est pas un enfant d'`AnimatePresence` : son `initial` est respecté.

   ALLER-RETOUR (`repeatType: 'mirror'`) et non un cycle qui se réarme : la
   dérive tourne en continu, indépendamment du minuteur des photos. Un retour
   sec de 1,06 à 1,00 se verrait, et une durée calée sur les 7 s de l'intervalle
   figerait l'image pile au moment du changement — soit exactement l'immobilité
   qu'on cherche à supprimer, au pire moment. 9 s en linéaire : une courbe
   d'accélération se voit sur une durée aussi longue (l'image « freine » en
   fin de course), une vitesse constante ne se lit que comme de la profondeur.

   1,06 : en dessous le mouvement n'est pas perceptible sur 7 s ; au-delà il
   devient une animation, et la photo se recadre assez pour perdre un visage en
   bord de cadre. L'échelle ne descend jamais sous 1, donc aucun bord d'image ne
   peut apparaître (`.chapter` est par ailleurs en `overflow: hidden`).
   ─────────────────────────────────────────────────────────────────────────── */
const DRIFT_SECONDS = 9
const DRIFT_SCALE = 1.06

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
   PhotoRail — bande d'images en défilement continu, mais VRAIMENT scrollable :
   on incrémente `scrollLeft` en rAF au lieu de translater la piste entière.

   Pourquoi pas une keyframe `transform` (l'implémentation précédente) : avec
   quarante photos dupliquées, la piste faisait ~32 000 px et devenait une couche
   composite hors budget de texture. Le compositeur la re-rastérisait en cours
   d'animation, d'où des à-coups et l'impression de « revenir en arrière ». En
   défilement natif, seules les tuiles visibles sont peintes — et on récupère
   gratuitement le glisser tactile, la molette et la navigation au clavier.
   L'ancienne keyframe avait au passage une couture fausse de 8 px : la piste
   mesurait `W + gap + W` mais ne translatait que de 50 % (`W + gap/2`). Ici la
   gouttière est PORTÉE PAR LES GROUPES (`gap-4 pr-4`), donc la largeur de boucle
   est exactement `group.offsetWidth` — mesurée, jamais devinée.

   DÉFILEMENT AUTOMATIQUE : pointeur fin uniquement. Au doigt, on ne peut pas
   survoler pour mettre en pause : ce serait demander de taper une cible
   mouvante. Le tactile garde donc un rail qu'on pousse soi-même, et le clone
   (qui ne sert qu'à la boucle) n'est ni monté ni téléchargé.

   L'utilisateur reprend la main à tout moment : survol, focus clavier, glisser,
   molette et flèches suspendent la boucle, qui ne repart qu'après un délai
   d'inactivité. Onglet en arrière-plan ou bande hors écran : rien ne tourne.
   Sous reduced-motion → simple rangée scrollable.
   ─────────────────────────────────────────────────────────────────────────── */

/** Délai d'inactivité avant reprise, après une action « ponctuelle » (molette,
 *  flèche, fin de glisser) qui n'a pas d'événement de sortie propre. */
const RAIL_RESUME_DELAY = 2500
/** Au-delà de ce déplacement, un appui souris est un glisser : le clic qui suit
 *  est annulé, sinon on ouvre la visionneuse en croyant pousser la bande. */
const RAIL_DRAG_THRESHOLD = 6

export function PhotoRail({
  children,
  speed = 45,
  className = '',
}: {
  children: ReactNode
  /** vitesse de défilement (px/s) */
  speed?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const [fine, setFine] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  /** Suspension durable : survol, focus, glisser en cours. */
  const hold = useRef(false)
  /** Suspension à échéance (`performance.now()`), cf. RAIL_RESUME_DELAY. */
  const pausedUntil = useRef(0)
  const dragging = useRef(false)
  const dragged = useRef(false)
  /** Distance cumulée du glisser en cours (px), cf. RAIL_DRAG_THRESHOLD. */
  const travel = useRef(0)
  const lastX = useRef(0)

  // `matchMedia` et non un point de rupture Tailwind : c'est la PRÉSENCE d'un
  // survol qui décide, pas la largeur (une tablette large reste tactile).
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const apply = () => setFine(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const playing = fine && !reduce

  useEffect(() => {
    if (!playing) return
    const el = scroller.current
    const track = group.current
    if (!el || !track) return

    let onscreen = true
    const io = new IntersectionObserver(([entry]) => (onscreen = entry.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)

    let frame = 0
    let last = 0
    // Position tenue en JS, et NON lue dans `scrollLeft` d'une frame sur l'autre :
    // le getter arrondit à l'entier, si bien qu'un `scrollLeft += 0.75` répété
    // repart chaque fois du même entier et la bande ne bouge jamais d'un pixel.
    let pos = el.scrollLeft
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      // Borné : au retour d'un onglet en arrière-plan, rAF a cessé de battre et
      // un `dt` de plusieurs secondes ferait sauter la bande d'un bloc.
      const dt = last ? Math.min(now - last, 100) : 0
      last = now
      if (!onscreen || document.hidden || hold.current || now < pausedUntil.current) return
      const loop = track.offsetWidth
      if (loop <= 0) return
      // L'utilisateur est prioritaire : s'il a déplacé la bande (glisser, molette,
      // flèche), on se recale sur elle. Seuil de 2 px, l'arrondi du getter valant
      // déjà 1 px à lui seul.
      if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft
      pos += (speed * dt) / 1000
      // Raccord exact sur le clone : aucun saut perceptible.
      if (pos >= loop) pos -= loop
      el.scrollLeft = pos
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
    }
  }, [playing, speed])

  const suspend = () => {
    pausedUntil.current = performance.now() + RAIL_RESUME_DELAY
  }

  /** Déplacement d'une vignette (gouttière comprise), mesuré sur la première. */
  const step = () => {
    const tile = group.current?.firstElementChild as HTMLElement | null
    return (tile?.offsetWidth ?? 320) + 16
  }

  const nudge = (dir: -1 | 1) => {
    suspend()
    scroller.current?.scrollBy({ left: dir * step(), behavior: 'smooth' })
  }

  const rail = (
    <div
      ref={scroller}
      className="rail rail-free overflow-x-auto"
      // Souris seulement : au doigt, `pointerleave` n'arrive pas toujours après
      // un tap, et la suspension resterait armée pour de bon.
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hold.current = true
      }}
      onPointerLeave={() => {
        hold.current = false
        dragging.current = false
      }}
      // Le focus clavier sur une vignette provoque un `scrollIntoView` : sans
      // pause, il se battrait avec la boucle. (`onFocus`/`onBlur` de React
      // remontent, ce qui donne l'équivalent de `:focus-within`.)
      onFocus={() => (hold.current = true)}
      onBlur={() => (hold.current = false)}
      onWheel={suspend}
      onKeyDown={suspend}
      // Volontairement SANS `setPointerCapture` : la capture détourne aussi les
      // événements souris de compatibilité, donc le `click` partait sur le rail
      // et non sur la vignette — plus aucune photo ne s'ouvrait. Sortir du rail
      // en cours de glisser met simplement fin au glisser (`onPointerLeave`).
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return // le tactile scrolle déjà mieux tout seul
        dragging.current = true
        dragged.current = false
        travel.current = 0
        lastX.current = e.clientX
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        // Écart de `clientX` et non `movementX` : ce dernier n'est renseigné que
        // par les vrais déplacements du curseur (il reste à 0 pour un événement
        // synthétique, donc en test automatisé).
        const dx = e.clientX - lastX.current
        lastX.current = e.clientX
        e.currentTarget.scrollLeft -= dx
        // Cumul, et non déplacement d'un seul événement : dix petits pas de 2 px
        // sont un glisser, pas un clic.
        travel.current += Math.abs(dx)
        if (travel.current >= RAIL_DRAG_THRESHOLD) dragged.current = true
      }}
      onPointerUp={() => {
        dragging.current = false
        suspend()
      }}
      // Sans ça, tirer sur une vignette lance le glisser-déposer natif de
      // l'image : le pointeur nous échappe en pleine course.
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (!dragged.current) return
        dragged.current = false
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="flex w-max">
        {/* La gouttière appartient au groupe (`gap-4 pr-4`) : sa largeur EST la
            longueur de boucle. */}
        <div ref={group} className="flex shrink-0 gap-4 pr-4">
          {children}
        </div>
        {playing && (
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden>
            {children}
          </div>
        )}
      </div>
    </div>
  )

  // Flèches réservées au pointeur fin : au doigt on pousse la bande, et deux
  // boutons de plus ne feraient que masquer des photos.
  if (!fine) return <div className={className}>{rail}</div>

  return (
    <div className={`relative ${className}`}>
      {rail}
      {(['prev', 'next'] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          aria-label={dir === 'prev' ? 'Photos précédentes' : 'Photos suivantes'}
          onClick={() => nudge(dir === 'prev' ? -1 : 1)}
          className={`tap absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/90 text-[color:var(--color-fg)] shadow-sm backdrop-blur transition hover:bg-[color:var(--color-surface)] ${
            dir === 'prev' ? 'left-3' : 'right-3'
          }`}
        >
          {dir === 'prev' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      ))}
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
  /**
   * Lente entrée dans la photo (cf. DRIFT_SECONDS / DRIFT_SCALE). RÉSERVÉ aux
   * bandeaux dont la photo alterne au minuteur : c'est le seul cas où le fond
   * change tout seul, donc le seul qui ait besoin de l'annoncer.
   *
   * Volontairement PAS le défaut. Sur la photo du LCP (`priority`), une
   * transformation qui tourne dès le premier rendu se paie au chargement ; et
   * sur un chapitre dont la photo est choisie par un onglet ou un filtre
   * (/athletes), il n'y a aucun défilement à signaler — l'utilisateur sait
   * déjà pourquoi l'image a changé, c'est lui qui l'a demandé.
   */
  drift?: boolean
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

/**
 * Conteneur de la dérive de zoom (cf. DRIFT_SECONDS). `active` à faux ⇒ aucun
 * nœud ajouté : les chapitres sans dérive gardent exactement le DOM d'avant.
 */
function DriftBox({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return <>{children}</>

  return (
    // Pas d'`aria-hidden` ici : c'est la photo elle-même qui porte le sien
    // quand elle est décorative (cf. `imgProps`), et une photo de contenu au
    // vrai `alt` ne doit pas être masquée par son conteneur d'animation.
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1 }}
      animate={{ scale: DRIFT_SCALE }}
      transition={{
        duration: DRIFT_SECONDS,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    >
      {children}
    </motion.div>
  )
}

export function Chapter({
  children,
  tone = 'light',
  image,
  imageAlt = '',
  focus = 'center',
  veil = 'soft',
  parallax = false,
  drift = false,
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
  // La dérive vit dans la SEULE branche du fondu, jamais sous parallaxe (le
  // conteneur y porte déjà une transformation pilotée par le scroll) et jamais
  // sur l'image du LCP, pour la même raison que la parallaxe. Sous
  // `prefers-reduced-motion` la branche n'est pas rendue du tout : rien à
  // désactiver ici, et le diaporama est de son côté gelé par `useSlideshow`.
  const withDrift = drift && !priority && !withParallax && !reduce

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
             propre cadrage, elle ne saute pas.

             La DÉRIVE est portée par la même image que le fondu, mais avec sa
             propre transition — 9 s en linéaire contre 0,6 s en courbe. Écrite
             en IMAGES CLÉS (`[1, DRIFT_SCALE]`) et non en simple valeur cible :
             `initial={false}` fait rendre le premier enfant directement à son
             état `animate`, ce qui ferait démarrer la toute première photo déjà
             zoomée, immobile pour ses 7 s. Un tableau part toujours de sa
             première valeur, donc la dérive joue dès le chargement, tandis que
             l'opacité (valeur simple) continue, elle, de ne pas se fondre.

             La DÉRIVE de zoom, quand elle est demandée, est posée par le
             conteneur ci-dessous et non ici : cf. le commentaire de
             DRIFT_SECONDS, `initial={false}` empêcherait la première photo de
             l'animer. */
          <DriftBox active={withDrift}>
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
          </DriftBox>
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
