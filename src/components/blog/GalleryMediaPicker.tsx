import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listMedia } from '../../api/gallery'
import type { MediaOut } from '../../api/types'
import { Loading, ErrorMessage } from '../ui/Status'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'

const PAGE_SIZE = 24

/** Modale de sélection de médias de la galerie à insérer dans l'article. */
export function GalleryMediaPicker({
  onInsert,
  onClose,
}: {
  onInsert: (items: MediaOut[]) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Map<number, MediaOut>>(new Map())

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['gallery-media-picker'],
      queryFn: ({ pageParam }) => listMedia({ offset: pageParam, limit: PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => {
        const loaded = pages.reduce((n, p) => n + p.items.length, 0)
        return loaded < lastPage.total ? loaded : undefined
      },
    })

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, Boolean(hasNextPage))

  const media = data?.pages.flatMap((p) => p.items) ?? []

  function toggle(m: MediaOut) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(m.id)) next.delete(m.id)
      else next.set(m.id, m)
      return next
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-club-primary dark:text-club-primary-light">
            Depuis la galerie
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && <Loading />}
          {isError && <ErrorMessage message="Impossible de charger la galerie." />}
          {!isLoading && !isError && media.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">La galerie est vide.</p>
          )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {media.map((m) => {
              const isSelected = selected.has(m.id)
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggle(m)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                    isSelected ? 'border-club-primary' : 'border-transparent'
                  }`}
                >
                  {m.resource_type === 'video' ? (
                    <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  {isSelected && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-club-primary text-xs text-white">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div ref={sentinelRef} />
          {isFetchingNextPage && <Loading label="Chargement…" />}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <button type="button" className="btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            disabled={selected.size === 0}
            onClick={() => onInsert(Array.from(selected.values()))}
          >
            Insérer{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
