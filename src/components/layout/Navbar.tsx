import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { club } from '../../data/club'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/coachs', label: 'Coachs' },
  { to: '/calendrier', label: 'Calendrier' },
  { to: '/blog', label: 'Blog' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/records', label: 'Records' },
  { to: '/athletes', label: 'Athlètes' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
      {/* Liseré rouge → or : identité du club */}
      <div className="h-1 w-full bg-gradient-to-r from-club-primary via-club-accent to-club-primary" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-club-primary-light to-club-primary text-sm font-bold text-white shadow-sm transition group-hover:scale-105">
            {club.sigle}
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-club-primary dark:text-club-primary-light sm:block">
            {club.sigle}
          </span>
        </NavLink>

        <nav className="hidden gap-7 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group relative text-sm font-medium transition-colors hover:text-club-primary dark:hover:text-club-primary-light ${
                  isActive
                    ? 'text-club-primary dark:text-club-primary-light'
                    : 'text-slate-600 dark:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-club-accent transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-club-primary hover:text-club-primary md:hidden dark:border-slate-700"
          onClick={() => setOpen((o) => !o)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-club-primary/10 text-club-primary dark:text-club-primary-light'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
