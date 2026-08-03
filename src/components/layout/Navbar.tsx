import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useMotionValueEvent } from 'framer-motion'
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

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()

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
    <header
      className={`sticky top-0 z-50 border-b bg-[color:var(--color-canvas)]/85 backdrop-blur-xl transition-colors duration-300 ${
        compact ? 'border-[color:var(--color-line)]' : 'border-transparent'
      }`}
    >
      {/* Filet rouge : signature du club. Il ne se révèle qu'une fois la page
          défilée — au repos, l'en-tête doit se fondre dans le papier. */}
      <div
        aria-hidden
        className={`h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent transition-opacity duration-300 ${
          compact ? 'opacity-100' : 'opacity-0'
        }`}
      />
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
          className="tap inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-line)] text-[color:var(--color-fg)] transition hover:border-club-primary md:hidden"
          onClick={() => {
            // Ouvrir le tiroir est le signal le PLUS précoce dont on dispose sur
            // mobile : le visiteur ne l'ouvre que pour changer de page, et il lui
            // faut ensuite ~1 s pour lire les cinq entrées et viser. Précharger
            // les cinq ici (~15 ko compressés en tout) leur laisse le temps
            // d'arriver avant le doigt, là où un `touchstart` sur l'entrée
            // elle-même n'offre que ~100 ms d'avance.
            if (!open) for (const l of [...links, { to: '/rejoindre' }]) prefetchPath(l.to)
            setOpen((o) => !o)
          }}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="nav-mobile"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-200 ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-current transition-all duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-200 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="nav-mobile"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[color:var(--color-line)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-safe py-4 pb-safe">
              {[...links, { to: '/rejoindre', label: 'Nous rejoindre' }].map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.05 + i * 0.04, duration: 0.3 }}
                >
                  <NavLink
                    to={link.to}
                    {...intentProps(link.to)}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      // py-3.5 → 48 px de cible tactile.
                      `tap block rounded-md px-4 py-3.5 font-display text-lg font-bold uppercase tracking-wide transition ${
                        isActive
                          ? 'bg-club-primary text-white'
                          : 'hover:bg-[color:var(--color-surface-2)]'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              {/* Les réseaux ne tiennent que dans le tiroir : la nav desktop
                  porte déjà le CTA. */}
              <div className="mt-3 border-t border-[color:var(--color-line)] px-4 pt-5">
                <SocialLinks />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
