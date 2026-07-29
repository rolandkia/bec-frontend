import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { club } from '../../data/club'
import { SocialLinks } from '../ui/SocialLinks'

const footerLinks = [
  { to: '/club', label: 'Le club' },
  { to: '/palmares', label: 'Palmarès' },
  { to: '/competitions', label: 'Compétitions' },
  { to: '/actualite', label: 'Actualité' },
  { to: '/athletes', label: 'Athlètes' },
  // Lien profond vers l'onglet Records, conservé même depuis que la navbar
  // annonce « Athlètes & Records » : il amène directement au bon onglet.
  { to: '/athletes?tab=records', label: 'Records' },
  { to: '/infos-pratiques', label: 'Infos pratiques' },
  { to: '/contact', label: 'Contact' },
]

export function Footer() {
  return (
    <footer className="mt-14 border-t border-[color:var(--color-line)] bg-[color:var(--color-ink)] sm:mt-20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent opacity-70" />
      <div className="mx-auto max-w-6xl px-safe py-10 pb-safe sm:py-12">
        <div className="grid gap-8 md:grid-cols-3 sm:gap-10">
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
            {/* py-1.5 : la cible tactile de chaque lien passe de ~17 à ~38 px. */}
            <ul className="grid grid-cols-2 gap-x-6">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-block py-1.5 text-sm text-slate-300 transition-colors hover:text-club-primary-light"
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
            {/* `flex flex-col items-start` : chaque coordonnée est une ligne à
                part entière, et les liens ne s'étirent pas sur toute la colonne
                (la zone cliquable resterait large et vide à droite du texte). */}
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm leading-relaxed text-slate-300">{club.contact.adresse}</p>
              <a
                href={club.contact.telephoneLien}
                className="inline-flex items-center gap-2 py-0.5 text-sm text-slate-300 transition-colors hover:text-club-primary-light"
              >
                <Phone aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
                {club.contact.telephone}
              </a>
              <a
                href={`mailto:${club.contact.email}`}
                className="inline-flex items-center gap-2 py-0.5 text-sm text-slate-300 transition-colors hover:text-club-primary-light"
              >
                <Mail aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
                {club.contact.email}
              </a>
            </div>
            <SocialLinks className="mt-5" />
          </div>
        </div>

        <div className="mt-10 border-t border-[color:var(--color-line)] pt-6 text-xs text-[color:var(--color-muted)]">
          © {new Date().getFullYear()} {club.nom}. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
