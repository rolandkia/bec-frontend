import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listAlbums, listMedia } from '../api/gallery'
import { clubPhotos } from '../data/clubPhotos'
import { AlbumCard } from '../components/gallery/AlbumCard'
import { AlbumStories } from '../components/gallery/AlbumStories'
import { MediaFeed } from '../components/gallery/MediaFeed'
import { Lightbox } from '../components/ui/Lightbox'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { Reveal } from '../components/ui/motion'

type Tab = 'feed' | 'grid' | 'albums'

const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'grid', label: 'Grille' },
  { key: 'albums', label: 'Albums' },
]

// Rythme « bento » : quelques tuiles occupent 2 lignes / 2 colonnes.
function tileSpan(i: number): string {
  const m = i % 6
  if (m === 0) return 'row-span-2'
  if (m === 3) return 'sm:col-span-2'
  return ''
}

export function GalleryPage({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('feed')
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Les albums alimentent la rangée « stories » (toujours visible) et l'onglet Albums.
  const { data: albums, isLoading, isError } = useQuery({
    queryKey: ['gallery-albums'],
    queryFn: listAlbums,
  })

  return (
    <div>
      <Reveal className={`mb-6 flex items-center ${embedded ? 'justify-end' : 'justify-between'}`}>
        {!embedded && <h1 className="section-title text-3xl">Galerie</h1>}
        <Link to="/galerie/admin" className="btn-outline">
          Gérer la galerie
        </Link>
      </Reveal>

      {/* Le club en images — photos curées du club, toujours disponibles. */}
      <section className="mb-12">
        <h2 className="section-title mb-4">Le club en images</h2>
        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-3 lg:grid-cols-4">
          {clubPhotos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setLightbox(i)}
              aria-label={`Agrandir : ${p.legende}`}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl ${tileSpan(i)}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute bottom-3 left-4 text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {p.legende}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Médias publiés (back-end) : albums + flux. */}
      <h2 className="section-title mb-4">Publications</h2>

      {albums && <AlbumStories albums={albums} />}

      <div className="mb-8 flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition sm:flex-none ${
              tab === t.key
                ? 'bg-club-primary text-white shadow-sm'
                : 'text-[color:var(--color-muted)] hover:text-white'
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
            <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-8 text-center text-[color:var(--color-muted)]">
              Aucun album pour le moment. Créez-en un depuis{' '}
              <Link to="/galerie/admin" className="font-semibold text-club-primary-light hover:text-white">
                la gestion de la galerie
              </Link>
              .
            </p>
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

      {lightbox !== null && (
        <Lightbox
          items={clubPhotos.map((p) => ({ url: p.src, type: 'image' as const }))}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
          renderCaption={(_, i) => clubPhotos[i].legende}
        />
      )}
    </div>
  )
}
