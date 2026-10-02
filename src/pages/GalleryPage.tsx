import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listAlbums, listMedia } from '../api/gallery'
import { clubPhotos, type ClubPhoto } from '../data/clubPhotos'
import { AlbumCard } from '../components/gallery/AlbumCard'
import { AlbumStories } from '../components/gallery/AlbumStories'
import { MediaFeed } from '../components/gallery/MediaFeed'
import { Lightbox } from '../components/ui/Lightbox'
import { sitePhotoProps, sitePhotoUrl } from '../lib/cloudinary'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { Reveal } from '../components/ui/motion'

type Tab = 'feed' | 'grid' | 'albums'

const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'grid', label: 'Grille' },
  { key: 'albums', label: 'Albums' },
]

/**
 * Mosaïque « bento » : la forme de chaque tuile suit sa PHOTO (cf. `tile` dans
 * clubPhotos.ts), et non plus son rang. L'ancien rythme (`i % 6`) donnait une
 * tuile haute à une photo en paysage et une tuile simple à une photo en
 * portrait, donc des recadrages sévères ; et, sans `grid-flow-dense`, il
 * laissait des cases vides dans presque chaque bande de lignes (mesuré : sept
 * trous sur la grille à quatre colonnes).
 */
const TILE_SPAN: Record<NonNullable<ClubPhoto['tile']>, string> = {
  feature: 'col-span-2 row-span-2',
  tall: 'row-span-2',
  wide: 'sm:col-span-2',
}

/** `sizes` par forme : une tuile 2 × 2 est deux fois plus large qu'une simple. */
const TILE_SIZES: Record<NonNullable<ClubPhoto['tile']> | 'simple', string> = {
  feature: '(min-width: 1024px) 50vw, (min-width: 640px) 66vw, 100vw',
  wide: '(min-width: 1024px) 50vw, (min-width: 640px) 66vw, 50vw',
  tall: '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
  simple: '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
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
      {/* Intégrée au Mag, le lien d'administration est porté par la barre
          d'onglets (cf. MagPage). */}
      {!embedded && (
        <Reveal className="mb-6 flex items-center justify-between">
          <h1 className="section-title">Galerie</h1>
          <Link to="/galerie/admin" className="btn-outline">
            Gérer la galerie
          </Link>
        </Reveal>
      )}

      {/* Le club en images — photos curées du club, toujours disponibles. */}
      <section className="mb-12">
        <h2 className="section-title mb-4">Le club en images</h2>
        {/* `grid-flow-dense` : une tuile simple vient boucher la case laissée
            par une tuile double. L'ordre visuel s'écarte ainsi de l'ordre de la
            liste (celui de la visionneuse) de deux places au plus. */}
        <div className="grid grid-flow-row-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-3 lg:grid-cols-4">
          {clubPhotos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setLightbox(i)}
              aria-label={`Agrandir : ${p.legende}`}
              className={`group tap relative cursor-pointer overflow-hidden rounded-2xl ${p.tile ? TILE_SPAN[p.tile] : ''}`}
            >
              <img
                {...sitePhotoProps(p.src, {
                  sizes: TILE_SIZES[p.tile ?? 'simple'],
                  widths: [400, 800, 1200],
                  w: 1200,
                })}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Légende visible d'emblée au doigt : `group-hover:*` n'est jamais
                  évalué sans pointeur fin (cf. MediaTile). */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100" />
              <span className="absolute bottom-3 left-4 right-3 truncate text-left text-sm font-semibold text-white transition-opacity duration-300 hover-hover:opacity-0 group-hover:opacity-100">
                {p.legende}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Médias publiés (back-end) : albums + flux. */}
      <h2 className="section-title mb-4">Publications</h2>

      {albums && <AlbumStories albums={albums} />}

      <div className="segmented mb-8" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
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
              <Link to="/galerie/admin" className="font-semibold text-club-primary-light hover:opacity-70">
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
          items={clubPhotos.map((p) => ({ url: sitePhotoUrl(p.src), type: 'image' as const }))}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
          renderCaption={(_, i) => clubPhotos[i].legende}
        />
      )}
    </div>
  )
}
