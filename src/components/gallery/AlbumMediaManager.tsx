import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createMedia, listMedia, updateAlbumMedia } from '../../api/gallery'
import { listBlogMedia } from '../../api/blogs'
import type { AlbumOut, BlogMediaOut, MediaOut } from '../../api/types'
import { Loading, ErrorMessage } from '../ui/Status'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'

const PAGE_SIZE = 24

type Source = 'gallery' | 'blogs'

/** Modale de gestion du contenu d'un album : cocher/décocher des médias de la
 *  galerie, et importer des images d'articles de blog directement dans l'album.
 *  L'appartenance est envoyée en deltas (add/remove) — sûr avec la pagination. */
export function AlbumMediaManager({
  album,
  onClose,
  onSaved,
}: {
  album: AlbumOut
  onClose: () => void
  onSaved: () => void
}) {
  const [source, setSource] = useState<Source>('gallery')
  // id → coché voulu (absent = état initial = média déjà dans l'album).
  const [galleryToggles, setGalleryToggles] = useState<Map<number, boolean>>(new Map())
  // url → média de blog sélectionné pour import.
  const [blogSelected, setBlogSelected] = useState<Map<string, BlogMediaOut>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const galleryQuery = useInfiniteQuery({
    queryKey: ['album-manager-media'],
    queryFn: ({ pageParam }) => listMedia({ offset: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
  })

  const blogQuery = useQuery({
    queryKey: ['album-manager-blog-media'],
    queryFn: listBlogMedia,
    enabled: source === 'blogs',
  })

  const sentinelRef = useInfiniteScroll(() => {
    if (galleryQuery.hasNextPage && !galleryQuery.isFetchingNextPage) galleryQuery.fetchNextPage()
  }, Boolean(galleryQuery.hasNextPage))

  const media: MediaOut[] = galleryQuery.data?.pages.flatMap((p) => p.items) ?? []

  function isChecked(m: MediaOut): boolean {
    const toggled = galleryToggles.get(m.id)
    return toggled ?? m.album_id === album.id
  }

  function toggleMedia(m: MediaOut) {
    setGalleryToggles((prev) => {
      const next = new Map(prev)
      const desired = !isChecked(m)
      // Revenir à l'état initial retire l'entrée (pas de delta inutile).
      if (desired === (m.album_id === album.id)) next.delete(m.id)
      else next.set(m.id, desired)
      return next
    })
  }

  function toggleBlog(bm: BlogMediaOut) {
    setBlogSelected((prev) => {
      const next = new Map(prev)
      if (next.has(bm.url)) next.delete(bm.url)
      else next.set(bm.url, bm)
      return next
    })
  }

  // Deltas d'appartenance calculés depuis les bascules (médias toujours chargés).
  const { addIds, removeIds } = useMemo(() => {
    const add: number[] = []
    const remove: number[] = []
    const byId = new Map(media.map((m) => [m.id, m]))
    for (const [id, desired] of galleryToggles) {
      const m = byId.get(id)
      if (!m) continue
      const wasIn = m.album_id === album.id
      if (desired && !wasIn) add.push(id)
      else if (!desired && wasIn) remove.push(id)
    }
    return { addIds: add, removeIds: remove }
  }, [galleryToggles, media, album.id])

  const changeCount = addIds.length + removeIds.length + blogSelected.size

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      // Import des images de blog : nouvelle entrée galerie rattachée à l'album.
      for (const bm of blogSelected.values()) {
        await createMedia({
          url: bm.url,
          resource_type: bm.resource_type,
          album_id: album.id,
        })
      }
      if (addIds.length || removeIds.length) {
        await updateAlbumMedia(album.id, { add_media_ids: addIds, remove_media_ids: removeIds })
      }
      onSaved()
    } catch {
      setError("Échec de l'enregistrement.")
      setIsSaving(false)
    }
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
          <h2 className="truncate text-lg font-semibold text-club-primary dark:text-club-primary-light">
            Photos de « {album.title} »
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

        <div className="flex gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          {(['gallery', 'blogs'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                source === s
                  ? 'bg-club-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {s === 'gallery' ? 'Galerie' : 'Images des blogs'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {source === 'gallery' ? (
            <>
              {galleryQuery.isLoading && <Loading />}
              {galleryQuery.isError && <ErrorMessage message="Impossible de charger la galerie." />}
              {!galleryQuery.isLoading && !galleryQuery.isError && media.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">La galerie est vide.</p>
              )}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {media.map((m) => (
                  <SelectableTile
                    key={m.id}
                    url={m.url}
                    isVideo={m.resource_type === 'video'}
                    selected={isChecked(m)}
                    onClick={() => toggleMedia(m)}
                  />
                ))}
              </div>
              <div ref={sentinelRef} />
              {galleryQuery.isFetchingNextPage && <Loading label="Chargement…" />}
            </>
          ) : (
            <>
              {blogQuery.isLoading && <Loading />}
              {blogQuery.isError && <ErrorMessage message="Impossible de charger les images des blogs." />}
              {blogQuery.data && blogQuery.data.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  Aucune image d'article à importer (elles sont déjà dans la galerie).
                </p>
              )}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {blogQuery.data?.map((bm) => (
                  <SelectableTile
                    key={bm.url}
                    url={bm.url}
                    isVideo={bm.resource_type === 'video'}
                    selected={blogSelected.has(bm.url)}
                    caption={bm.blog_title}
                    onClick={() => toggleBlog(bm)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {changeCount > 0
              ? `${changeCount} modification${changeCount > 1 ? 's' : ''} en attente`
              : 'Aucune modification'}
          </p>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              disabled={changeCount === 0 || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function SelectableTile({
  url,
  isVideo,
  selected,
  caption,
  onClick,
}: {
  url: string
  isVideo: boolean
  selected: boolean
  caption?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
        selected ? 'border-club-primary' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {isVideo ? (
        <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
      {selected && (
        <span className="absolute inset-0 bg-club-primary/20" />
      )}
      <span
        className={`absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs ${
          selected ? 'bg-club-primary text-white' : 'bg-black/30 text-white/80'
        }`}
      >
        {selected ? '✓' : ''}
      </span>
      {caption && (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-left text-[10px] text-white">
          {caption}
        </span>
      )}
    </button>
  )
}
