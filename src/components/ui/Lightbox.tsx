import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface LightboxItem {
  url: string
  type: 'image' | 'video'
  id?: string | number
}

/** Visionneuse plein écran générique, réutilisée par la lecture de blog et la
 *  galerie. Contenu-agnostique : `renderCaption` (optionnel) permet à l'appelant
 *  d'afficher une légende (description, date, lieu, athlètes tagués…). */
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  renderCaption,
}: {
  items: LightboxItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  renderCaption?: (item: LightboxItem, index: number) => ReactNode
}) {
  const count = items.length
  const current = items[index]

  const goPrev = useCallback(() => {
    if (count > 1) onIndexChange((index - 1 + count) % count)
  }, [count, index, onIndexChange])

  const goNext = useCallback(() => {
    if (count > 1) onIndexChange((index + 1) % count)
  }, [count, index, onIndexChange])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    // Empêche le défilement de la page derrière l'overlay.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, goPrev, goNext])

  if (!current) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        type="button"
        aria-label="Fermer"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        onClick={onClose}
      >
        ×
      </button>

      {/* Zone média (le clic sur le média ne ferme pas) */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
        {count > 1 && (
          <button
            type="button"
            aria-label="Précédent"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:left-4"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            ‹
          </button>
        )}

        <div className="flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
          {current.type === 'video' ? (
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          ) : (
            <img
              key={current.url}
              src={current.url}
              alt=""
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          )}
          {renderCaption && (
            <div className="mt-3 max-w-2xl text-center text-sm text-slate-200">
              {renderCaption(current, index)}
            </div>
          )}
        </div>

        {count > 1 && (
          <button
            type="button"
            aria-label="Suivant"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:right-4"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
          >
            ›
          </button>
        )}
      </div>

      {count > 1 && (
        <p className="pb-4 text-center text-sm text-slate-400">
          {index + 1} / {count}
        </p>
      )}
    </div>,
    document.body,
  )
}
