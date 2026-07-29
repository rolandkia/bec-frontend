import { CalendarClock, MapPin } from 'lucide-react'
import type { GroupeEntrainement } from '../../data/infosPratiques'

/**
 * Encart d'un groupe d'entraînement (/infos-pratiques) : photo pleine hauteur
 * d'un côté, créneaux et lieu de l'autre. Même grammaire que `FigureCard` —
 * grille 0.8/1.2, bascule par `sm:order-2`, voile qui fond la jointure, cadrage
 * piloté par la donnée.
 *
 * Remplace la carte texte seul en `md:grid-cols-3` : le club n'a que DEUX
 * groupes, la grille laissait des colonnes vides et les créneaux tenaient en
 * deux lignes dans une carte prévue pour six.
 *
 * `photoFond: 'studio'` existe pour le portrait adulte, sur fond clair, où les
 * deux voiles de la variante `'scene'` seraient contre-productifs :
 *  - le voile bas de la version mobile (`from-ink/80`) étale un gris sale sur
 *    l'aplat clair, pile sur l'écusson du sweat ;
 *  - le dégradé latéral occupe la MOITIÉ du panneau (le `via-transparent` de la
 *    règle mobile survit au `sm:`), ce qui mangerait le visage — sur ce cliché
 *    le sujet regarde vers la jointure. On garde donc une rampe COURTE (30 %),
 *    qui tombe pile sur le tiers gauche vide du cadrage, et rien sur mobile.
 */
export function GroupeCard({
  groupe,
  imageSide = 'left',
}: {
  groupe: GroupeEntrainement
  /** Côté de la photo. Alterner d'un encart à l'autre donne un rythme visuel. */
  imageSide?: 'left' | 'right'
}) {
  const photoADroite = imageSide === 'right'
  const studio = groupe.photoFond === 'studio'

  return (
    <div className="card overflow-hidden p-0">
      <div
        className={`grid gap-0 ${
          photoADroite ? 'sm:grid-cols-[1.2fr_0.8fr]' : 'sm:grid-cols-[0.8fr_1.2fr]'
        }`}
      >
        {/* Photo de contenu (et non décorative) : chaque groupe porte un vrai
            `alt` décrivant le cliché — cf. `photoAlt` dans `data/infosPratiques`. */}
        <div className={`relative min-h-[260px] sm:min-h-full ${photoADroite ? 'sm:order-2' : ''}`}>
          <img
            src={groupe.photo}
            alt={groupe.photoAlt}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: groupe.photoPosition ?? 'center' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {studio ? (
            <div
              aria-hidden
              className={`absolute inset-0 hidden sm:block ${
                photoADroite
                  ? 'bg-[linear-gradient(to_left,transparent_0%,transparent_70%,var(--color-surface)_100%)]'
                  : 'bg-[linear-gradient(to_right,transparent_0%,transparent_70%,var(--color-surface)_100%)]'
              }`}
            />
          ) : (
            <div
              aria-hidden
              className={`absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/80 via-transparent to-transparent sm:from-transparent sm:to-[color:var(--color-surface)] ${
                photoADroite ? 'sm:bg-gradient-to-l' : 'sm:bg-gradient-to-r'
              }`}
            />
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {groupe.titre}
            </h3>
            <span className="badge shrink-0 bg-club-primary/15 text-club-primary-light ring-1 ring-club-primary/30">
              {groupe.trancheAge}
            </span>
          </div>

          <p className="mt-4 leading-relaxed text-[color:var(--color-muted)]">
            {groupe.description}
          </p>

          {/* Garde extérieure : sans elle, un groupe sans disciplines laisserait
              une liste vide et sa marge. */}
          {groupe.disciplines && groupe.disciplines.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {groupe.disciplines.map((d) => (
                <li
                  key={d}
                  className="badge bg-white/5 text-[color:var(--color-muted)] ring-1 ring-white/10"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-fg)]">
            <CalendarClock aria-hidden className="h-4 w-4 text-club-primary-light" />
            Créneaux
          </p>
          <ul className="mt-2 space-y-1.5">
            {groupe.creneaux.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm text-[color:var(--color-fg)]">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-club-primary"
                />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-center gap-1.5 text-sm text-[color:var(--color-muted)]">
            <MapPin aria-hidden className="h-4 w-4 shrink-0" />
            {groupe.lieu}
          </p>
        </div>
      </div>
    </div>
  )
}
