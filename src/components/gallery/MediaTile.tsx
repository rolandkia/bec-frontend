import type { MediaOut } from '../../api/types'

/** Tuile bento : remplit sa cellule de grille (object-cover), zoom au survol,
 *  légende révélée en overlay. Les vidéos affichent un badge + un bouton play. */
export function MediaTile({ media, onClick }: { media: MediaOut; onClick: () => void }) {
  const isVideo = media.resource_type === 'video'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-full w-full overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]"
    >
      {isVideo ? (
        <>
          <video
            src={media.url}
            muted
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <span className="badge absolute left-2.5 top-2.5 bg-black/60 uppercase tracking-wide text-white backdrop-blur">
            Vidéo
          </span>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-club-primary/90 pl-1 text-xl text-white shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-110">
              ▶
            </span>
          </span>
        </>
      ) : (
        <img
          src={media.url}
          alt={media.description ?? ''}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      {(media.description || media.lieu) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {media.description && (
            <p className="truncate text-sm font-semibold text-white">{media.description}</p>
          )}
          {media.lieu && <p className="truncate text-xs text-slate-300">{media.lieu}</p>}
        </div>
      )}
    </button>
  )
}
