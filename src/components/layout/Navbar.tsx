import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  useSpring,
} from 'framer-motion'
import { club } from '../../data/club'
import { sitePhoto } from '../../lib/cloudinary'
import { intentProps, prefetchPath } from '../../lib/prefetch'
import { SocialLinks } from '../ui/SocialLinks'

/**
 * Les 5 sections du site. On est passé de 8 à 5 : la nav débordait dès 1024 px,
 * et quatre entrées répondaient deux par deux à la même question du visiteur
 * (Club/Palmarès = l'histoire ; Infos/Contact = comment s'inscrire).
 */
const links = [
  { to: '/club', label: 'Le club' },
  { to: '/athletes', label: 'Athlètes' },
  { to: '/competitions', label: 'Compétitions' },
  { to: '/mag', label: 'Le Mag' },
]

/** Entrées du tiroir mobile : les 4 rubriques + l'action. */
const mobileLinks = [...links, { to: '/rejoindre', label: 'Nous rejoindre' }]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const reduce = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()

  /* Barre de progression de lecture. Le filet rouge de l'en-tête existait déjà,
     mais il ne disait qu'une chose — « vous avez défilé » — et la répétait
     jusqu'en bas de page. Les pages du site sont LONGUES (l'accueil fait neuf
     mouvements, /club en fait quatre) : la même ligne, mise à l'échelle sur
     l'avancement, répond en plus à « combien reste-t-il ».

     `useSpring` et non la valeur brute : au doigt, le défilement arrive par
     paquets d'événements et une largeur pilotée directement saccade visiblement
     sur un trait fin. Le ressort lisse sans jamais retarder assez pour se voir.
     `scaleX` sur une origine gauche : composité par le GPU, aucun reflow — une
     `width` animée en relayerait un à chaque frame. */
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.35 })

  // Navbar élégante : elle se resserre après les premiers pixels de scroll, pour
  // rendre de la hauteur au contenu. Piloté par `useMotionValueEvent` (et non un
  // écouteur `scroll` + setState à chaque frame) : Framer Motion ne notifie qu'au
  // franchissement, et le seuil de 24 px évite tout battement au repos.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const next = y > 24
    setCompact((prev) => (prev === next ? prev : next))
  })

  // Menu mobile ouvert : on verrouille le défilement de la page derrière et on
  // referme à Échap (même contrat que <Lightbox>).
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
    <header
      className={`sticky top-0 z-50 border-b bg-[color:var(--color-canvas)]/85 backdrop-blur-xl transition-colors duration-300 ${
        compact ? 'border-[color:var(--color-line)]' : 'border-transparent'
      }`}
    >
      {/* Filet rouge : signature du club ET jauge de lecture. Il ne se révèle
          qu'une fois la page défilée — au repos, l'en-tête doit se fondre dans
          le papier. La piste sous le trait reste invisible : c'est la portion
          PARCOURUE qu'on montre, pas une barre de chargement. */}
      <div
        aria-hidden
        className={`h-px w-full transition-opacity duration-300 ${compact ? 'opacity-100' : 'opacity-0'}`}
      >
        <motion.div
          className="h-full w-full origin-left bg-gradient-to-r from-club-primary via-club-primary to-club-accent"
          style={reduce ? { transform: 'scaleX(1)' } : { scaleX: progress }}
        />
      </div>

      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-safe transition-[padding] duration-300 ${
          compact ? 'py-2' : 'py-3.5'
        }`}
      >
        <NavLink to="/" className="group flex items-center gap-3" aria-label="Accueil">
          <img
            // Affiché à 32-40 px : `120` couvre le triple de densité, contre les
            // 22 ko du fichier source, servi à chaque page.
            src={sitePhoto('/photos/logo.webp', 120)}
            alt=""
            aria-hidden
            width={40}
            height={40}
            className={`object-contain transition-all duration-300 group-hover:scale-105 ${
              compact ? 'h-8 w-8' : 'h-10 w-10'
            }`}
          />
          <span className="font-display text-xl font-bold uppercase tracking-[0.16em]">
            {club.sigle}
          </span>
        </NavLink>

        {/* Cinq entrées tiennent largement dès `md` — l'ancienne nav à 8 liens
            devait attendre `lg` et restait serrée. */}
        <nav className="hidden items-center gap-7 md:flex lg:gap-9">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              // Le morceau de code de la page part au SURVOL, pas au clic (cf.
              // lib/prefetch.ts).
              {...intentProps(link.to)}
              className={({ isActive }) =>
                `group relative whitespace-nowrap py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  isActive
                    ? 'text-[color:var(--color-fg)]'
                    : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    // `layoutId` : le souligné GLISSE d'un onglet à l'autre au
                    // lieu de disparaître puis réapparaître.
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 h-0.5 w-full bg-club-primary"
                      transition={
                        reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }
                      }
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-club-primary/50 transition-all duration-300 group-hover:w-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* « Nous rejoindre » est l'action, pas une rubrique : elle sort de la
              liste et devient le CTA de l'en-tête (une seule action primaire par
              écran). */}
          <NavLink
            to="/rejoindre"
            {...intentProps('/rejoindre')}
            className="btn-primary !px-5 !py-2.5 !text-[0.7rem] !tracking-[0.14em]"
          >
            Nous rejoindre
          </NavLink>
        </nav>

        <button
          type="button"
          className="tap relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-line)] text-[color:var(--color-fg)] transition hover:border-club-primary md:hidden"
          onClick={() => {
            // Ouvrir le tiroir est le signal le PLUS précoce dont on dispose sur
            // mobile : le visiteur ne l'ouvre que pour changer de page, et il lui
            // faut ensuite ~1 s pour lire les cinq entrées et viser. Précharger
            // les cinq ici (~15 ko compressés en tout) leur laisse le temps
            // d'arriver avant le doigt, là où un `touchstart` sur l'entrée
            // elle-même n'offre que ~100 ms d'avance.
            if (!open) for (const l of mobileLinks) prefetchPath(l.to)
            setOpen((o) => !o)
          }}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="nav-mobile"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 rounded-full bg-current transition-all duration-200 ${open ? 'w-0 opacity-0' : 'w-full opacity-100'}`}
            />
            <span
              className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
            />
          </span>
        </button>
      </div>
    </header>

      {/* ─── TIROIR MOBILE ───────────────────────────────────────────────────
          Panneau PLEIN ÉCRAN, et non le volet de 5 lignes replié sous l'en-tête
          qu'il remplace. Trois raisons :

            1. le volet se dépliait EN POUSSANT la page, donc la première chose
               que voyait le visiteur en ouvrant le menu était la page qui saute ;
            2. il n'avait pas de hauteur garantie : sur un petit écran en paysage,
               les cinq entrées plus les réseaux dépassaient sous la ligne de
               flottaison, sans défilement possible (`overflow-hidden` portait
               l'animation de hauteur) ;
            3. à 48 px de haut par entrée dans un volet de 300 px, la navigation
               principale du site sur son support principal avait l'air d'un menu
               contextuel. En plein écran, elle retrouve la typographie éditoriale
               du reste du site et des cibles qu'on ne rate pas.

          `fixed inset-0` sous l'en-tête (z-40 contre z-50) : le logo et le bouton
          de fermeture restent visibles et cliquables par-dessus le panneau, donc
          on referme là où on a ouvert — le geste le plus attendu.

          ⚠️ LE PANNEAU EST FRÈRE DE `<header>`, PAS SON ENFANT. L'en-tête porte
          `backdrop-blur-xl`, et un `backdrop-filter` autre que `none` fait de
          l'élément un BLOC CONTENEUR pour ses descendants `position: fixed` (CSS
          Filter Effects, § containing block). Un panneau `fixed inset-0` posé à
          l'intérieur se serait donc calé sur la boîte de l'en-tête — 56 px de
          haut — au lieu du viewport. Ne pas le remonter dans le `<header>` pour
          « ranger » le JSX. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-mobile"
            className="fixed inset-0 z-40 md:hidden"
            initial={reduce ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Le fond est OPAQUE à 97 % + flou : on ne cherche pas un voile de
                modale (il n'y a rien à garder en vue derrière), mais une page à
                part entière. Le flou garde juste assez de la photo du hero pour
                qu'on sache qu'on n'a pas changé de page. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[color:var(--color-canvas)]/97 backdrop-blur-2xl"
              onClick={() => setOpen(false)}
            />

            <motion.nav
              className="relative flex h-full flex-col justify-between overflow-y-auto px-safe pb-safe pt-24"
              initial={reduce ? false : { y: -12 }}
              animate={{ y: 0 }}
              exit={reduce ? undefined : { y: -8 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="flex flex-col">
                {mobileLinks.map((link, i) => (
                  <motion.li
                    key={link.to}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    // 45 ms d'écart : assez pour que l'oeil suive la descente,
                    // assez court pour que la 5e entrée soit là en 200 ms — au
                    // doigt, on vise avant d'avoir fini de lire.
                    transition={{ delay: reduce ? 0 : 0.04 + i * 0.045, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-[color:var(--color-line)] last:border-b-0"
                  >
                    <NavLink
                      to={link.to}
                      {...intentProps(link.to)}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        // Cible de 72 px : c'est une navigation principale, pas
                        // une liste d'options.
                        `tap group flex items-baseline gap-4 py-5 font-display text-[2rem] font-bold uppercase leading-none tracking-tight transition-colors ${
                          isActive
                            ? 'text-club-primary-light'
                            : 'text-[color:var(--color-fg)] active:text-club-primary-light'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Numérotation éditoriale : elle donne un rythme à la
                              colonne et marque la page courante sans ajouter de
                              pastille. */}
                          <span
                            aria-hidden
                            className={`w-7 shrink-0 font-sans text-[0.62rem] font-semibold tracking-[0.18em] ${
                              isActive
                                ? 'text-club-primary-light'
                                : 'text-[color:var(--color-muted)]'
                            }`}
                          >
                            0{i + 1}
                          </span>
                          <span className="min-w-0 flex-1">{link.label}</span>
                          {isActive && (
                            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-club-primary" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              {/* Les réseaux ne tiennent que dans le tiroir : la nav desktop
                  porte déjà le CTA. Poussés en bas de panneau par le
                  `justify-between` — ils ferment la colonne au lieu de flotter
                  juste sous la dernière entrée. */}
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.3, duration: 0.3 }}
                className="mt-10 border-t border-[color:var(--color-line)] pt-6"
              >
                {/* Le nom complet ne tient nulle part ailleurs sur mobile : la
                    barre du haut n'affiche que le sigle, et le pied de page est
                    à 8 000 px de là sur l'accueil. Le tiroir est le seul endroit
                    où on a la place de l'écrire. */}
                <p className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                  {club.nom}
                </p>
                <SocialLinks />
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
