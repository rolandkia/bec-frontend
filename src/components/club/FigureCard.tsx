import { ExternalLink, Trophy } from 'lucide-react'
import type { FigurePortrait } from '../../data/palmares'
import { ffaProfileUrl } from '../../utils/ffa'

/**
 * Encart portrait d'une figure du club, en ouverture de /palmares : photo pleine
 * hauteur d'un côté, badge OR + paragraphe + faits datés de l'autre.
 *
 * Extrait du JSX qui était inliné dans l'ancienne `pages/PalmaresPage.tsx` (fusionnée
 * dans `ClubPage`, section `#palmares`) le jour où la
 * page a eu deux portraits (Colette Besson 1968, Clément Ducos 2024). Deux
 * points d'attention :
 *  - le cadrage vient de la donnée (`photoPosition`) et non d'une classe
 *    Tailwind arbitraire : `object-[…]` ne peut pas être dynamique ;
 *  - `ffaId` et `wikipedia` sont tous deux optionnels : pas de fiche athle.fr
 *    pour une carrière des années 1960, pas de page Wikipédia pour un athlète
 *    encore en activité. Celui des deux qui est présent devient l'action
 *    principale (`btn-ffa`), l'autre passe en secondaire (`btn-outline`) ; si
 *    aucun n'est renseigné, la rangée de boutons n'est pas rendue du tout.
 *
 * Le `<Reveal>` reste à la charge de la page : chaque encart choisit sa
 * direction d'apparition.
 */
export function FigureCard({
  figure,
  imageSide = 'left',
}: {
  figure: FigurePortrait
  /** Côté de la photo. Alterner d'un encart à l'autre donne un rythme visuel. */
  imageSide?: 'left' | 'right'
}) {
  const photoADroite = imageSide === 'right'

  return (
    <div className="card overflow-hidden p-0">
      <div
        className={`grid gap-0 ${
          photoADroite ? 'sm:grid-cols-[1.2fr_0.8fr]' : 'sm:grid-cols-[0.8fr_1.2fr]'
        }`}
      >
        {/* Photo de contenu (et non décorative) : chaque portrait porte un vrai
            `alt` décrivant le cliché — cf. `photoAlt` dans `data/palmares.ts`. */}
        <div
          className={`relative min-h-[240px] sm:min-h-full ${photoADroite ? 'sm:order-2' : ''}`}
        >
          <img
            src={figure.photo}
            alt={figure.photoAlt}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: figure.photoPosition ?? 'center' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Voile de lisibilité : par le bas sur mobile (la photo est au-dessus
              du texte), latéral dès `sm` pour fondre la jointure photo/carte. */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/80 via-transparent to-transparent sm:from-transparent sm:to-[color:var(--color-surface)] ${
              photoADroite ? 'sm:bg-gradient-to-l' : 'sm:bg-gradient-to-r'
            }`}
          />
        </div>
        <div className="p-6 sm:p-8">
          <span className="badge-gold">
            <Trophy aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            {figure.badge}
          </span>
          <h3 className="mt-3 font-display text-2xl font-bold uppercase sm:text-3xl">
            {figure.nom}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            {figure.discipline}
          </p>
          <p className="mt-4 leading-relaxed text-[color:var(--color-muted)]">{figure.texte}</p>
          <ul className="mt-5 space-y-2">
            {figure.faits.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[color:var(--color-fg)]">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-club-accent"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {/* Garde extérieure : sans elle, une figure sans aucun lien laisserait
              un conteneur vide et ses 24 px de marge sous les faits. */}
          {(figure.ffaId || figure.wikipedia) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {figure.ffaId && (
                <a
                  href={ffaProfileUrl(figure.ffaId)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ffa"
                >
                  Profil FFA
                  <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2} />
                </a>
              )}
              {figure.wikipedia && (
                <a
                  href={figure.wikipedia}
                  target="_blank"
                  rel="noreferrer"
                  className={figure.ffaId ? 'btn-outline' : 'btn-ffa'}
                >
                  Sa fiche Wikipédia
                  <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
