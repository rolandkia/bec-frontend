import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { club } from '../../data/club'
import { sitePhoto } from '../../lib/cloudinary'
import { SocialLinks } from '../ui/SocialLinks'
import { Reveal, RevealGroup, motion, staggerItem } from '../ui/motion'

/** Colonnes du plan de site, alignées sur les 5 sections de la navigation. */
const footerColumns: { titre: string; links: { to: string; label: string }[] }[] = [
  {
    titre: 'Le club',
    links: [
      { to: '/club#histoire', label: 'Notre histoire' },
      { to: '/club#palmares', label: 'Palmarès' },
      { to: '/club#equipe', label: "L'équipe" },
      { to: '/club#partenaires', label: 'Partenaires' },
    ],
  },
  {
    titre: 'Performance',
    links: [
      { to: '/athletes', label: 'Effectif' },
      // Lien profond vers l'onglet Records : sans lui, personne ne les trouve.
      { to: '/athletes?tab=records', label: 'Records du club' },
      { to: '/competitions', label: 'Calendrier' },
    ],
  },
  {
    titre: 'Le Mag',
    links: [
      { to: '/mag', label: 'Articles' },
      { to: '/mag?tab=galerie', label: 'Galerie' },
    ],
  },
  {
    titre: 'Nous rejoindre',
    links: [
      { to: '/rejoindre', label: 'Les entraînements' },
      { to: '/rejoindre#contact', label: 'Contact & inscription' },
    ],
  },
]

/**
 * Pied de page — CHAPITRE NOIR de clôture. Le site est clair ; le footer referme
 * le récit sur le même noir que le hero l'avait ouvert.
 *
 * `.chapter-dark` (et non des classes `dark:` recopiées) : les tokens sémantiques
 * s'inversent sur tout le sous-arbre, donc `text-[--color-muted]` y est le gris
 * clair et non le gris foncé. C'est le même mécanisme que `<Chapter>`.
 */
export function Footer() {
  return (
    // Pas de marge haute : chaque page finit déjà sur un `py-16 sm:py-24`, et
    // les deux s'additionnaient en ~200 px de vide avant le footer. C'est la
    // bascule de fond (papier → noir) qui marque la séparation, pas un écart.
    <footer className="chapter-dark border-t border-[color:var(--color-line)]">
      {/* Filet rouge : la signature du club, reprise de la navbar. */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-club-primary to-transparent"
      />
      <div className="mx-auto max-w-6xl px-safe py-14 pb-safe sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          {/* Marque */}
          <Reveal>
            <div className="flex items-center gap-3">
              <img
                src={sitePhoto('/photos/logo.webp', 120)}
                alt=""
                aria-hidden
                width={44}
                height={44}
                loading="lazy"
                decoding="async"
                className="h-11 w-11 object-contain"
              />
              <span className="font-display text-2xl font-bold uppercase tracking-[0.14em]">
                {club.sigle}
              </span>
            </div>
            <p className="mt-5 max-w-xs leading-relaxed text-[color:var(--color-muted)]">
              {club.nom}
            </p>
            {/* `flex flex-col items-start` : chaque coordonnée est une ligne à
                part entière, et les liens ne s'étirent pas sur toute la colonne
                (la zone cliquable resterait large et vide à droite du texte). */}
            <div className="mt-6 flex flex-col items-start gap-2.5 text-sm">
              <p className="leading-relaxed text-[color:var(--color-muted)]">
                {club.contact.adresse}
              </p>
              <a
                href={club.contact.telephoneLien}
                className="tap inline-flex min-h-11 items-center gap-2 transition-colors hover:text-club-primary-light"
              >
                <Phone aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
                {club.contact.telephone}
              </a>
              <a
                href={`mailto:${club.contact.email}`}
                className="tap inline-flex min-h-11 items-center gap-2 transition-colors hover:text-club-primary-light"
              >
                <Mail aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
                {club.contact.email}
              </a>
            </div>
            <SocialLinks className="mt-6" />
          </Reveal>

          {/* Plan du site — les colonnes entrent en cascade (stagger 100 ms). */}
          <RevealGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <motion.nav key={col.titre} variants={staggerItem} aria-label={col.titre}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-club-primary-light">
                  {col.titre}
                </p>
                {/* py-1.5 : la cible tactile de chaque lien passe de ~17 à ~38 px. */}
                <ul className="space-y-0.5">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="tap group inline-flex min-h-10 items-center text-sm text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-fg)]"
                      >
                        {/* Filet qui se déploie au survol : un « bouton vivant »
                            sans déplacer le texte (donc sans reflow). */}
                        <span
                          aria-hidden
                          className="mr-0 h-px w-0 bg-club-primary transition-all duration-300 group-hover:mr-2 group-hover:w-3"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            ))}
          </RevealGroup>
        </div>

        <div className="mt-14 flex flex-wrap items-baseline justify-between gap-4 border-t border-[color:var(--color-line)] pt-6">
          <p className="text-xs text-[color:var(--color-muted)]">
            © {new Date().getFullYear()} {club.nom}. Tous droits réservés.
          </p>
          <p className="stat text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Fondé en 1897
          </p>
        </div>
      </div>
    </footer>
  )
}
