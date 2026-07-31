import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cldImage, cldPoster, cldVideo } from '../../lib/cloudinary'

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

  // Balayage horizontal — geste attendu sur une visionneuse mobile. Pointer
  // events, aucune dépendance ; seuil de 50 px pour ne pas confondre avec un
  // tap, et on ignore la souris pour ne pas gêner un cliquer-glisser.
  const swipeStartX = useRef<number | null>(null)

  function onPointerDown(e: ReactPointerEvent) {
    // Jamais de balayage démarré SUR la vidéo : tirer la barre de progression de
    // plus de 50 px déclenchait un `goNext()`, rendant le seek inutilisable au
    // doigt. Le balayage reste actif sur la zone sombre et via les flèches basses.
    if ((e.target as HTMLElement).closest('video')) {
      swipeStartX.current = null
      return
    }
    swipeStartX.current = e.pointerType === 'mouse' ? null : e.clientX
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (swipeStartX.current === null) return
    const dx = e.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)()
  }

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
        className="tap absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        onClick={onClose}
      >
        ×
      </button>

      {/* Zone média (le clic sur le média ne ferme pas) */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
        {count > 1 && (
          // Flèches latérales réservées à sm : à 390 px, `left-2`/`right-2` les
          // posait SUR la photo et masquait le sujet (cf. barre basse).
          <button
            type="button"
            aria-label="Précédent"
            className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:flex"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            ‹
          </button>
        )}

        <div
          className="flex max-h-full max-w-full flex-col items-center"
          style={{ touchAction: 'pan-y' }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {current.type === 'video' ? (
            <video
              key={current.url}
              src={cldVideo(current.url)}
              poster={cldPoster(current.url) ?? undefined}
              controls
              // `autoPlay` sans `muted` est simplement ignoré par iOS (l'utilisateur
              // appuie sur lecture) ; ajouter `muted` couperait le son d'une vidéo
              // ouverte volontairement. `playsInline` est ce qui fait jouer la
              // vidéo DANS l'overlay au lieu de partir dans le lecteur iOS.
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[72dvh] max-w-full rounded-lg bg-black"
            />
          ) : (
            <img
              key={current.url}
              src={cldImage(current.url, 1920)}
              alt=""
              className="max-h-[72dvh] max-w-full rounded-lg object-contain"
            />
          )}
          {renderCaption && (
            <div className="mt-3 max-w-2xl text-center text-sm text-white/85">
              {renderCaption(current, index)}
            </div>
          )}
        </div>

        {count > 1 && (
          <button
            type="button"
            aria-label="Suivant"
            className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:flex"
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
        // Barre basse : sur mobile elle porte les flèches (hors de la photo) de
        // part et d'autre du compteur. Dès sm, seul le compteur reste.
        <div
          className="flex items-center justify-center gap-6 pb-safe pt-2 sm:pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Précédent"
            className="tap flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:hidden"
            onClick={goPrev}
          >
            ‹
          </button>
          <p className="tabular text-sm text-white/60">
            {index + 1} / {count}
          </p>
          <button
            type="button"
            aria-label="Suivant"
            className="tap flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:hidden"
            onClick={goNext}
          >
            ›
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
