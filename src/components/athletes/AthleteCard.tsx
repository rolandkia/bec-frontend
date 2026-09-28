import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AthleteListItem } from '../../api/types'
import { cldPortrait } from '../../lib/cloudinary'
import { prefetchChunk } from '../../lib/prefetch'
import { athleteDetailPage } from '../../lib/routeChunks'
import { getInitials } from '../../utils/initials'
import { LevelBadge } from './LevelBadge'

/**
 * Carte d'athlète — ANATOMIE UNIQUE : un portrait, puis une légende POSÉE SOUS
 * lui sur la surface de la carte.
 *
 * L'ancienne carte superposait le nom à l'image, sous un dégradé noir qui
 * montait jusqu'à mi-hauteur. Deux conséquences, et c'est la seconde qui a
 * décidé de la refonte :
 *
 *  1. le dégradé mangeait le bas de chaque visage — sur un portrait cadré serré,
 *     c'est-à-dire la moitié du buste ;
 *  2. surtout, les athlètes SANS photo (l'immense majorité de l'effectif :
 *     67 sur 72 au moment d'écrire) recevaient un aplat rouge plein. La grille
 *     de /athletes n'était donc pas une grille de portraits mais un mur de
 *     72 rectangles rouges saturés, tous identiques. Le rouge du club est un
 *     ACCENT (cf. la politique de couleur dans index.css) : répété 72 fois en
 *     aplat, il ne signale plus rien et écrase les quelques vraies photos.
 *
 * Le repli est donc une PLAQUE NEUTRE, et le monogramme y est traité comme un
 * chiffre de maillot : très grand, ancré en bas à gauche, dans une encre à peine
 * plus dense que le fond. Il meuble sans crier, et la carte à photo comme la
 * carte sans photo se lisent maintenant de la même façon — un portrait, une
 * ligne de nom, une ligne de service.
 */
export function AthleteCard({ athlete }: { athlete: AthleteListItem }) {
  // `niveau` vient du serveur (cf. AthleteListItem) : la carte le recalculait à
  // partir de tout l'historique de l'athlète, ce qui obligeait la liste à
  // transporter 1450 résultats.
  const niveau = athlete.niveau
  const initials = getInitials(athlete.prenom, athlete.nom)
  // Une URL Cloudinary morte affichait le glyphe « image cassée » ici, alors que
  // le composant Avatar partagé dégrade proprement : on reprend son repli.
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = Boolean(athlete.photo_url) && !photoFailed

  // Toutes les cartes mènent au MÊME morceau de code : la première intention
  // suffit à le charger, les 55 autres cartes n'ont plus rien à demander. C'est
  // le morceau le plus lourd du site public (graphique de progression compris),
  // donc celui qui rend le plus à ne pas attendre le clic — mais il n'est jamais
  // préchargé à l'aveugle, seulement sur intention.
  const onIntent = () => prefetchChunk(athleteDetailPage)

  return (
    <Link
      to={`/athletes/${athlete.id}`}
      onPointerEnter={onIntent}
      onTouchStart={onIntent}
      onFocus={onIntent}
      className="group card card-hover tap flex h-full flex-col overflow-hidden p-0"
    >
      {/* Carré sur téléphone, portrait 4/5 au-delà : l'effectif compte 72
          cartes, soit 36 rangées sur deux colonnes, et le 4/5 en faisait une
          page de 11 900 px. Le carré en retire ~1 500 sans rien perdre — un
          portrait `object-top` garde le visage, et le monogramme est en `cqw`. */}
      <div className="relative aspect-square overflow-hidden bg-[color:var(--color-surface-2)] sm:aspect-[4/5]">
        {showPhoto ? (
          <img
            src={cldPortrait(athlete.photo_url, 400)}
            alt={`${athlete.prenom} ${athlete.nom}`}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          // Plaque de monogramme. La taille est en `cqw` — une fraction de la
          // LARGEUR DE LA CARTE (container query units) et non du viewport : la
          // grille passe de 2 à 4 colonnes selon l'écran, un `clamp()` en `vw`
          // aurait donc donné un monogramme énorme en deux colonnes et minuscule
          // en quatre. Ici il occupe toujours la même part de sa carte.
          //
          // Le dégradé est à peine perceptible (surface-2 → surface) : sans lui
          // la plaque est un aplat gris mort, avec lui elle a une lumière. Le
          // monogramme reste sous les 20 % d'encre — c'est une texture qui
          // remplit un vide, pas une information à lire ; le nom est juste en
          // dessous, en pleine encre.
          <div
            aria-hidden
            className="absolute inset-0 grid place-items-center overflow-hidden"
            style={{
              containerType: 'inline-size',
              background:
                'linear-gradient(150deg, color-mix(in oklab, var(--color-fg) 6%, var(--color-surface)) 0%, var(--color-surface-2) 100%)',
            }}
          >
            <span
              className="select-none font-display font-bold uppercase leading-none tracking-tight transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              style={{
                fontSize: '42cqw',
                color: 'color-mix(in oklab, var(--color-fg) 16%, transparent)',
              }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Filet rouge du club, posé au PIED du portrait, là où l'image
            rencontre la légende : c'est la seule touche de marque de la carte.
            Un trait de 2 px répété 72 fois reste un rythme ; un aplat répété
            72 fois est un mur. Il court sur toute la largeur au survol. */}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-1/4 origin-left bg-club-primary transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-[4]"
        />

        {niveau && <LevelBadge niveau={niveau} className="absolute right-2.5 top-2.5" />}
      </div>

      {/* Légende sur la surface de la carte : le nom est en encre du thème, pas
          en blanc sur une photo — il tient son contraste quelle que soit
          l'image, et le portrait reste intact jusqu'en bas. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center border-t border-[color:var(--color-line)] px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="truncate font-display text-[0.95rem] font-bold uppercase leading-tight tracking-tight text-[color:var(--color-fg)] sm:text-lg">
          {athlete.prenom} {athlete.nom}
        </p>
        <p className="mt-0.5 truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)] sm:text-[0.68rem]">
          {athlete.sexe}
        </p>
      </div>
    </Link>
  )
}
