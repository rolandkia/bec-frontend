import type { MediaOut } from '../../api/types'

/** Cellule de la grille masonry. Réserve l'aspect-ratio quand les dimensions
 *  sont connues (évite les sauts de mise en page pendant le chargement). */
export function MediaTile({ media, onClick }: { media: MediaOut; onClick: () => void }) {
  const isVideo = media.resource_type === 'video'
  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-slate-100 shadow-sm transition hover:shadow-md dark:bg-slate-800"
    >
      <div className="relative" style={{ aspectRatio }}>
        {isVideo ? (
          <>
            <video
              src={media.url}
              muted
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-xl text-white">
                ▶
              </span>
            </span>
          </>
        ) : (
          <img
            src={media.url}
            alt={media.description ?? ''}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>
      {(media.description || media.lieu) && (
        <div className="px-3 py-2 text-left">
          {media.description && (
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {media.description}
            </p>
          )}
          {media.lieu && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{media.lieu}</p>
          )}
        </div>
      )}
    </button>
  )
}
