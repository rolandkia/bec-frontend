import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteAlbum, deleteMedia, listAlbums, listMedia } from '../api/gallery'
import { AlbumForm } from '../components/gallery/AlbumForm'
import { AlbumMediaManager } from '../components/gallery/AlbumMediaManager'
import { Loading, ErrorMessage } from '../components/ui/Status'
import type { AlbumOut, MediaOut } from '../api/types'

export function GalleryAdminPage() {
  const queryClient = useQueryClient()
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<AlbumOut | null>(null)
  const [managingAlbum, setManagingAlbum] = useState<AlbumOut | null>(null)

  const albumsQuery = useQuery({ queryKey: ['gallery-albums'], queryFn: listAlbums })
  const mediaQuery = useQuery({
    queryKey: ['gallery-media-admin'],
    queryFn: () => listMedia({ limit: 100, offset: 0 }),
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['gallery-albums'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-media'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-media-admin'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-album-media'] })
    queryClient.invalidateQueries({ queryKey: ['album-manager-media'] })
    queryClient.invalidateQueries({ queryKey: ['album-manager-blog-media'] })
  }

  async function handleDeleteAlbum(album: AlbumOut) {
    if (!window.confirm(`Supprimer l'album « ${album.title} » ? Les médias deviendront autonomes.`)) return
    await deleteAlbum(album.id)
    invalidateAll()
  }

  async function handleDeleteMedia(media: MediaOut) {
    if (!window.confirm('Supprimer ce média définitivement ?')) return
    await deleteMedia(media.id)
    invalidateAll()
  }

  return (
    <div className="animate-rise space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-3xl">Gestion de la galerie</h1>
        <Link to="/galerie/nouveau" className="btn-primary">
          Ajouter des médias
        </Link>
      </div>

      {/* Albums */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-club-primary dark:text-club-primary-light">Albums</h2>
          {!creatingAlbum && !editingAlbum && (
            <button type="button" className="btn-outline" onClick={() => setCreatingAlbum(true)}>
              Nouvel album
            </button>
          )}
        </div>

        {creatingAlbum && (
          <AlbumForm
            onDone={() => {
              setCreatingAlbum(false)
              invalidateAll()
            }}
            onCancel={() => setCreatingAlbum(false)}
          />
        )}
        {editingAlbum && (
          <AlbumForm
            existing={editingAlbum}
            onDone={() => {
              setEditingAlbum(null)
              invalidateAll()
            }}
            onCancel={() => setEditingAlbum(null)}
          />
        )}

        {albumsQuery.isLoading && <Loading />}
        {albumsQuery.isError && <ErrorMessage message="Impossible de charger les albums." />}
        {albumsQuery.data && albumsQuery.data.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">Aucun album.</p>
        )}
        {albumsQuery.data && albumsQuery.data.length > 0 && (
          <div className="space-y-3">
            {albumsQuery.data.map((album) => (
              <div key={album.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-club-primary dark:text-club-primary-light">
                    {album.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {album.media_count} média{album.media_count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/galerie/albums/${album.id}`}
                    className="text-sm text-slate-500 hover:underline dark:text-slate-400"
                  >
                    Voir
                  </Link>
                  <button
                    type="button"
                    className="btn-primary px-4 py-1.5 text-sm"
                    onClick={() => setManagingAlbum(album)}
                  >
                    Gérer les photos
                  </button>
                  <button
                    type="button"
                    className="btn-outline px-4 py-1.5 text-sm"
                    onClick={() => setEditingAlbum(album)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                    onClick={() => handleDeleteAlbum(album)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Médias */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-club-primary dark:text-club-primary-light">Médias</h2>
        {mediaQuery.isLoading && <Loading />}
        {mediaQuery.isError && <ErrorMessage message="Impossible de charger les médias." />}
        {mediaQuery.data && mediaQuery.data.items.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">Aucun média.</p>
        )}
        {mediaQuery.data && mediaQuery.data.items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {mediaQuery.data.items.map((media) => (
              <div key={media.id} className="card overflow-hidden p-0">
                <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {media.resource_type === 'video' ? (
                    <video src={media.url} muted preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={media.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <Link
                    to={`/galerie/media/${media.id}/modifier`}
                    className="text-sm text-club-primary hover:underline dark:text-club-primary-light"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                    onClick={() => handleDeleteMedia(media)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {managingAlbum && (
        <AlbumMediaManager
          album={managingAlbum}
          onClose={() => setManagingAlbum(null)}
          onSaved={() => {
            setManagingAlbum(null)
            invalidateAll()
          }}
        />
      )}
    </div>
  )
}
