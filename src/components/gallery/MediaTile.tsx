import type { MediaOut } from '../../api/types'
import { cldPoster, cldSrcSet, cldThumb } from '../../lib/cloudinary'

/** Tuile bento : remplit sa cellule de grille (object-cover), zoom au survol,
 *  légende révélée en overlay. Les vidéos affichent un badge + un bouton play. */
export function MediaTile({ media, onClick }: { media: MediaOut; onClick: () => void }) {
  const isVideo = media.resource_type === 'video'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group tap relative block h-full w-full overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]"
    >
      {isVideo ? (
        <>
          {/* Image d'affiche, PAS un <video> : la vignette téléchargeait les
              métadonnées — donc des octets vidéo — pour chaque tuile de la grille,
              et rendait souvent un rectangle noir sur iOS. Le badge et le bouton
              play ci-dessous portent déjà l'information « c'est une vidéo ». */}
          <img
            src={cldPoster(media.url, 600) ?? media.url}
            alt={media.description ?? ''}
            loading="lazy"
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
          src={cldThumb(media.url, 600)}
          srcSet={cldSrcSet(media.url, [400, 600, 900], {
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'auto',
          })}
          sizes="(max-width: 640px) 50vw, 33vw"
          alt={media.description ?? ''}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      {(media.description || media.lieu) && (
        // Base VISIBLE : Tailwind v4 place `group-hover:*` derrière
        // @media (hover: hover), donc sur tactile la légende n'était jamais
        // révélée — c'est tout le contenu textuel de l'onglet « Grille ». Le
        // masquage-puis-révélation reste un bonus des pointeurs fins.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 text-left transition-all duration-300 hover-hover:translate-y-2 hover-hover:opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          {media.description && (
            <p className="truncate text-sm font-semibold text-white">{media.description}</p>
          )}
          {media.lieu && <p className="truncate text-xs text-slate-300">{media.lieu}</p>}
        </div>
      )}
    </button>
  )
}
