import { Link } from 'react-router-dom'
import type { MediaOut } from '../../api/types'
import { club } from '../../data/club'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Carte « post » type réseau social : en-tête club, média pleine largeur,
 *  légende et athlètes tagués. Le clic sur le média ouvre la visionneuse. */
export function PostCard({ media, onClick }: { media: MediaOut; onClick: () => void }) {
  const isVideo = media.resource_type === 'video'
  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : undefined
  const meta = [media.lieu, media.date ? formatDate(media.date) : null].filter(Boolean).join(' · ')

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-club-primary-light to-club-primary text-xs font-bold text-white">
          {club.sigle}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {club.sigle}
          </p>
          {meta && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{meta}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="block w-full bg-slate-100 dark:bg-slate-800"
        style={{ aspectRatio }}
      >
        {isVideo ? (
          <div className="relative h-full w-full">
            <video src={media.url} muted preload="metadata" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-2xl text-white">
                ▶
              </span>
            </span>
          </div>
        ) : (
          <img src={media.url} alt={media.description ?? ''} loading="lazy" className="h-full w-full object-cover" />
        )}
      </button>

      {(media.description || media.athletes.length > 0) && (
        <div className="space-y-2 px-4 py-3">
          {media.description && (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold">{club.sigle}</span> {media.description}
            </p>
          )}
          {media.athletes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {media.athletes.map((a) => (
                <Link
                  key={a.id}
                  to={`/athletes/${a.id}`}
                  className="rounded-full bg-club-primary/10 px-2.5 py-0.5 text-xs font-medium text-club-primary hover:bg-club-primary/20 dark:text-club-primary-light"
                >
                  @{a.prenom} {a.nom}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
