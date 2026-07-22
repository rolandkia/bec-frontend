import { Link } from 'react-router-dom'
import { club } from '../../data/club'

const footerLinks = [
  { to: '/club', label: 'Le club' },
  { to: '/competitions', label: 'Compétitions' },
  { to: '/actualite', label: 'Actualité' },
  { to: '/athletes', label: 'Athlètes' },
  { to: '/infos-pratiques', label: 'Infos pratiques' },
  { to: '/contact', label: 'Contact' },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[color:var(--color-line)] bg-[color:var(--color-ink)]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent opacity-70" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marque */}
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/photos/logo.webp" alt="" className="h-10 w-10 object-contain" />
              <span className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
                {club.sigle}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--color-muted)]">
              {club.nom}
            </p>
          </div>

          {/* Navigation */}
          <nav>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Navigation
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-300 transition-colors hover:text-club-primary-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Contact
            </p>
            <p className="text-sm text-slate-300">{club.contact.adresse}</p>
            <a
              href={`mailto:${club.contact.email}`}
              className="mt-1 inline-block text-sm text-slate-300 transition-colors hover:text-club-primary-light"
            >
              {club.contact.email}
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-[color:var(--color-line)] pt-6 text-xs text-[color:var(--color-muted)]">
          © {new Date().getFullYear()} {club.nom}. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
