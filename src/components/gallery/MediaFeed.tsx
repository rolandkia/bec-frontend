import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { MediaOut, MediaPage } from '../../api/types'
import { Lightbox, type LightboxItem } from '../ui/Lightbox'
import { Loading, ErrorMessage } from '../ui/Status'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'
import { MediaTile } from './MediaTile'
import { PostCard } from './PostCard'

const PAGE_SIZE = 24

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Scroll infini + visionneuse plein écran sur une liste paginée de médias.
 *  `layout` choisit l'affichage : `grid` (mosaïque masonry dense) ou `feed`
 *  (fil vertical de « posts » façon réseau social). `queryKey` isole le cache ;
 *  `fetchPage` fournit une page. */
export function MediaFeed({
  queryKey,
  fetchPage,
  layout = 'grid',
}: {
  queryKey: unknown[]
  fetchPage: (offset: number, limit: number) => Promise<MediaPage>
  layout?: 'grid' | 'feed'
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchPage(pageParam, PAGE_SIZE),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => {
        const loaded = pages.reduce((n, p) => n + p.items.length, 0)
        return loaded < lastPage.total ? loaded : undefined
      },
    })

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, Boolean(hasNextPage))

  const media: MediaOut[] = data?.pages.flatMap((p) => p.items) ?? []
  const items: LightboxItem[] = media.map((m) => ({
    url: m.url,
    type: m.resource_type === 'video' ? 'video' : 'image',
    id: m.id,
  }))

  if (isLoading) return <Loading />
  if (isError) return <ErrorMessage message="Impossible de charger les médias." />
  if (media.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">Aucun média pour le moment.</p>
  }

  function renderCaption(_item: LightboxItem, index: number) {
    const m = media[index]
    if (!m) return null
    return (
      <div className="space-y-1">
        {m.description && <p className="text-base text-white">{m.description}</p>}
        <p className="text-slate-300">
          {[m.lieu, m.date ? formatDate(m.date) : null].filter(Boolean).join(' · ')}
        </p>
        {m.athletes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {m.athletes.map((a) => (
              <Link
                key={a.id}
                to={`/athletes/${a.id}`}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white hover:bg-white/25"
              >
                {a.prenom} {a.nom}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {layout === 'feed' ? (
        <div className="mx-auto flex max-w-[560px] flex-col gap-6">
          {media.map((m, i) => (
            <PostCard key={m.id} media={m} onClick={() => setLightboxIndex(i)} />
          ))}
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {media.map((m, i) => (
            <MediaTile key={m.id} media={m} onClick={() => setLightboxIndex(i)} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <Loading label="Chargement…" />}

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          renderCaption={renderCaption}
        />
      )}
    </>
  )
}
