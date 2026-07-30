import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AthleteOut } from '../../api/types'
import { cldPortrait } from '../../lib/cloudinary'
import { getInitials } from '../../utils/initials'
import { computeNiveauSaison } from '../../utils/niveau'
import { currentSaison } from '../../utils/saison'
import { LevelBadge } from './LevelBadge'

export function AthleteCard({ athlete }: { athlete: AthleteOut }) {
  const niveau = computeNiveauSaison(athlete.resultats, currentSaison())
  const initials = getInitials(athlete.prenom, athlete.nom)
  // Une URL Cloudinary morte affichait le glyphe « image cassée » ici, alors que
  // le composant Avatar partagé dégrade proprement : on reprend son repli.
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = Boolean(athlete.photo_url) && !photoFailed

  return (
    <Link
      to={`/athletes/${athlete.id}`}
      className="group card card-hover tap block overflow-hidden p-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {showPhoto ? (
          <img
            src={cldPortrait(athlete.photo_url, 400)}
            alt={`${athlete.prenom} ${athlete.nom}`}
            loading="lazy"
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
