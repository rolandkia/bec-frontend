import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { club } from '../../data/club'
import { SocialLinks } from '../ui/SocialLinks'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/club', label: 'Club' },
  { to: '/palmares', label: 'Palmarès' },
  { to: '/infos-pratiques', label: 'Infos' },
  { to: '/competitions', label: 'Compétitions' },
  { to: '/actualite', label: 'Actualité' },
  // Les records vivent dans un onglet de /athletes : sans le dire ici, personne
  // ne les trouve depuis la navigation.
  { to: '/athletes', label: 'Athlètes & Records' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

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
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-line)] bg-[color:var(--color-ink)]/80 backdrop-blur-xl">
      {/* Fin liseré rouge : signature du club */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent opacity-70" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-safe py-2.5 sm:py-3">
        <NavLink to="/" className="group flex items-center gap-2.5">
          <img
            src="/photos/logo.webp"
            alt=""
            className="h-9 w-9 rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
            {club.sigle}
          </span>
        </NavLink>

        {/* Bascule à lg et non md : les liens plus le bloc logo réclament ~800 px,
            à 768 px la nav desktop débordait.
            8 liens désormais (ajout de « Palmarès », et « Athlètes » devenu
            « Athlètes & Records ») : pour rester sur une ligne à 1024 px, on a
            resserré l'interlettrage (0.14em → 0.1em), réduit l'écart
            (gap-8 → gap-5, gap-7 seulement à partir de xl) et raccourci
            « Infos pratiques » en « Infos ». C'est la limite : un 9e lien
            imposera de basculer la nav desktop à xl. */}
        <nav className="hidden gap-6 lg:flex lg:gap-5 xl:gap-7">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group relative whitespace-nowrap py-1 text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:text-white ${
                  isActive ? 'text-white' : 'text-[color:var(--color-muted)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-club-primary"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-club-primary/60 transition-all duration-300 group-hover:w-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="tap inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--color-line)] text-[color:var(--color-muted)] transition hover:border-club-primary hover:text-white lg:hidden"
          onClick={() => setOpen((o) => !o)}
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
            className="overflow-hidden border-t border-[color:var(--color-line)] lg:hidden"
          >
            <div className="flex flex-col gap-1 px-safe py-3 pb-safe">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.05 + i * 0.04, duration: 0.3 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      // py-3 → 44 px de cible tactile.
                      `tap block rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                        isActive
                          ? 'bg-club-primary/15 text-white'
                          : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              {/* Les réseaux ne tiennent que dans le tiroir : la nav desktop est
                  déjà à saturation (cf. le commentaire au-dessus d'elle). */}
              <div className="mt-2 border-t border-[color:var(--color-line)] px-3 pt-4">
                <SocialLinks />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
