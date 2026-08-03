import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AthleteListItem } from '../../api/types'
import { cldPortrait } from '../../lib/cloudinary'
import { prefetchChunk } from '../../lib/prefetch'
import { athleteDetailPage } from '../../lib/routeChunks'
import { getInitials } from '../../utils/initials'
import { LevelBadge } from './LevelBadge'

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
      className="group card card-hover tap block overflow-hidden p-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {showPhoto ? (
          <img
            src={cldPortrait(athlete.photo_url, 400)}
            alt={`${athlete.prenom} ${athlete.nom}`}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Repli sans photo : monogramme sur dégradé rouge (jamais de visage
          // d'un tiers associé à un athlète nommé).
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary">
            <span className="font-display text-6xl font-bold uppercase text-white/90">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/15 to-transparent" />
        {niveau && <LevelBadge niveau={niveau} className="absolute right-3 top-3" />}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="truncate font-display text-lg font-bold text-white">
            {athlete.prenom} {athlete.nom}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            {athlete.sexe}
          </p>
        </div>
      </div>
    </Link>
  )
}
