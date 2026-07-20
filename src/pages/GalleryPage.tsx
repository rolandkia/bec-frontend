import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listAlbums, listMedia } from '../api/gallery'
import { AlbumCard } from '../components/gallery/AlbumCard'
import { AlbumStories } from '../components/gallery/AlbumStories'
import { MediaFeed } from '../components/gallery/MediaFeed'
import { Loading, ErrorMessage } from '../components/ui/Status'

type Tab = 'feed' | 'grid' | 'albums'

const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'grid', label: 'Grille' },
  { key: 'albums', label: 'Albums' },
]

export function GalleryPage() {
  const [tab, setTab] = useState<Tab>('feed')

  // Les albums alimentent la rangée « stories » (toujours visible) et l'onglet Albums.
  const { data: albums, isLoading, isError } = useQuery({
    queryKey: ['gallery-albums'],
    queryFn: listAlbums,
  })

  return (
    <div className="animate-rise">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title text-3xl">Galerie</h1>
        <Link to="/galerie/admin" className="btn-outline">
          Gérer la galerie
        </Link>
      </div>

      {albums && <AlbumStories albums={albums} />}

      <div className="mb-8 flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition sm:flex-none ${
              tab === t.key
                ? 'bg-club-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <MediaFeed
          layout="feed"
          queryKey={['gallery-media']}
          fetchPage={(offset, limit) => listMedia({ offset, limit })}
        />
      )}

      {tab === 'grid' && (
        <MediaFeed
          layout="grid"
          queryKey={['gallery-media']}
          fetchPage={(offset, limit) => listMedia({ offset, limit })}
        />
      )}

      {tab === 'albums' && (
        <>
          {isLoading && <Loading />}
          {isError && <ErrorMessage message="Impossible de charger les albums." />}
          {albums && albums.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">Aucun album pour le moment.</p>
          )}
          {albums && albums.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
