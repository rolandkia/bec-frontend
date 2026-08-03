import { ExternalLink } from 'lucide-react'
import type { Partenaire } from '../../data/partenaires'
import { sitePhoto } from '../../lib/cloudinary'

/**
 * Encart partenaire de /club : plaque logo + nom + description.
 *
 * Remplace la grille de vignettes `lg:grid-cols-4` : avec un seul partenaire
 * elle laissait trois colonnes vides, et elle n'affichait jamais `description`
 * — le partenariat se réduisait à un logo posé là. Ici la carte prend toute la
 * largeur et c'est le texte qui porte le partenariat.
 *
 * La plaque est claire par défaut : un logo d'entreprise est dessiné pour un
 * fond blanc et ses tracés sombres disparaîtraient sur nos surfaces noires.
 * `logoFond: 'sombre'` inverse la règle pour les logos déjà clairs, qu'une
 * plaque blanche effacerait à leur tour.
 */
export function PartenaireCard({ partenaire }: { partenaire: Partenaire }) {
  const { nom, logo, url, description, logoFond = 'clair' } = partenaire

  const carte = (
    <div className="card card-hover h-full overflow-hidden p-0">
      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <div
          className={`flex items-center justify-center p-6 sm:p-8 ${
            logoFond === 'sombre'
              ? 'border-b border-[color:var(--color-line)] sm:border-b-0 sm:border-r'
              : 'bg-white/95'
          }`}
        >
          {/* Logo dans une plaque de 96 px : une largeur unique suffit. */}
          <img
            src={sitePhoto(logo, 400)}
            alt={nom}
            loading="lazy"
            decoding="async"
            className="max-h-24 w-full object-contain"
          />
        </div>
        <div className="p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold uppercase">{nom}</h3>
          {description && (
            <p className="mt-3 leading-relaxed text-[color:var(--color-muted)]">{description}</p>
          )}
          {url && (
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-club-primary-light">
              Visiter le site
              <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2} />
            </span>
          )}
        </div>
      </div>
    </div>
  )

  // Sans `url`, pas de balise <a> : on n'affiche pas une affordance de clic qui
  // ne mène nulle part.
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="tap block">
      {carte}
    </a>
  ) : (
    carte
  )
}
