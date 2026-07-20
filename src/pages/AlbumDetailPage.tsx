import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlbum, listAlbumMedia } from '../api/gallery'
import { MediaFeed } from '../components/gallery/MediaFeed'
import { AlbumMediaManager } from '../components/gallery/AlbumMediaManager'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const albumId = Number(id)
  const queryClient = useQueryClient()
  const [managing, setManaging] = useState(false)

  const { data: album, isLoading, isError, error } = useQuery({
    queryKey: ['gallery-album', albumId],
    queryFn: () => getAlbum(albumId),
    enabled: Number.isFinite(albumId),
    retry: false,
  })

  if (isLoading) return <Loading />
  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Album introuvable" message="Cet album n'existe pas." />
    }
    return <ErrorMessage message="Impossible de charger cet album." />
  }
  if (!album) return null

  return (
    <div className="animate-rise">
      <Link to="/galerie" className="mb-6 inline-block text-sm text-slate-500 underline dark:text-slate-400">
        ← Retour à la galerie
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-club-primary dark:text-club-primary-light">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-lg text-slate-600 dark:text-slate-300">{album.description}</p>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={() => setManaging(true)}>
          Ajouter des photos
        </button>
      </div>

      <MediaFeed
        queryKey={['gallery-album-media', albumId]}
        fetchPage={(offset, limit) => listAlbumMedia(albumId, { offset, limit })}
      />

      {managing && (
        <AlbumMediaManager
          album={album}
          onClose={() => setManaging(false)}
          onSaved={() => {
            setManaging(false)
            queryClient.invalidateQueries({ queryKey: ['gallery-album', albumId] })
            queryClient.invalidateQueries({ queryKey: ['gallery-album-media', albumId] })
            queryClient.invalidateQueries({ queryKey: ['gallery-media'] })
            queryClient.invalidateQueries({ queryKey: ['gallery-albums'] })
            queryClient.invalidateQueries({ queryKey: ['album-manager-media'] })
            queryClient.invalidateQueries({ queryKey: ['album-manager-blog-media'] })
          }}
        />
      )}
    </div>
  )
}
