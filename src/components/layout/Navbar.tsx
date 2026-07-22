import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { club } from '../../data/club'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/club', label: 'Club' },
  { to: '/infos-pratiques', label: 'Infos pratiques' },
  { to: '/competitions', label: 'Compétitions' },
  { to: '/actualite', label: 'Actualité' },
  { to: '/athletes', label: 'Athlètes' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-line)] bg-[color:var(--color-ink)]/80 backdrop-blur-xl">
      {/* Fin liseré rouge : signature du club */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent opacity-70" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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

        <nav className="hidden gap-6 md:flex lg:gap-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group relative py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:text-white ${
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-line)] text-[color:var(--color-muted)] transition hover:border-club-primary hover:text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
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
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[color:var(--color-line)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
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
                      `block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
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
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
