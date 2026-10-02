import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { listAlbums, listMedia } from '../../api/gallery'
import { clubPhotos } from '../../data/clubPhotos'
import { sitePhoto } from '../../lib/cloudinary'
import { Loading, ErrorMessage } from '../ui/Status'
import { useInfiniteScroll } from '../../lib/useInfiniteScroll'
import { MediaThumb } from '../ui/MediaThumb'

const PAGE_SIZE = 24

/** Média choisi, quelle que soit sa source : prêt à insérer dans l'article. */
export interface PickedMedia {
  /** Clé de sélection, unique toutes sources confondues. */
  key: string
  /** URL Cloudinary (publication) ou chemin `/photos/…` (photo du club). */
  url: string
  resource_type: 'image' | 'video'
  alt: string | null
}

type Source = 'publications' | 'club'

/**
 * Sélecteur de médias de la GALERIE, pour le corps d'un article ou sa couverture.
 *
 * Deux sources, les mêmes que l'onglet Galerie du Mag :
 *  - « Publications » : les médias envoyés depuis l'admin (API `/gallery/media`,
 *    albums compris, filtrables par album) ;
 *  - « Photos du club » : la collection « Le club en images » (`clubPhotos`).
 * Le sélecteur ne montrait que la première : la galerie publique en affichait
 * 37 de plus, introuvables ici. Une photo du club est insérée par son chemin
 * `/photos/…`, que l'article sert comme les bandeaux (variantes de largeur ou
 * CDN, cf. `storedImageProps`) et que le nettoyage Cloudinary du backend ignore.
 *
 * `mode="single"` (couverture) : un seul choix, images seulement.
 */
export function GalleryMediaPicker({
  onInsert,
  onClose,
  mode = 'multiple',
}: {
  onInsert: (items: PickedMedia[]) => void
  onClose: () => void
  mode?: 'multiple' | 'single'
}) {
  const single = mode === 'single'
  // `Map` : garde l'ordre des clics, qui devient l'ordre d'insertion.
  const [selected, setSelected] = useState<Map<string, PickedMedia>>(new Map())
  const [chosenSource, setChosenSource] = useState<Source | null>(null)
  const [albumId, setAlbumId] = useState<number | null>(null)

  const { data: albums } = useQuery({ queryKey: ['gallery-albums'], queryFn: listAlbums })

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['gallery-media-picker', albumId],
      queryFn: ({ pageParam }) =>
        listMedia({ offset: pageParam, limit: PAGE_SIZE, album_id: albumId ?? undefined }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => {
        const loaded = pages.reduce((n, p) => n + p.items.length, 0)
        return loaded < lastPage.total ? loaded : undefined
      },
    })

  const publicationsTotal = data?.pages[0]?.total
  // Tant que l'utilisateur n'a pas choisi, on ouvre sur les publications, sauf
  // s'il n'y en a aucune : un onglet vide en premier écran ferait croire que la
  // galerie l'est aussi.
  const source: Source =
    chosenSource ?? (publicationsTotal === 0 && albumId === null ? 'club' : 'publications')

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, source === 'publications' && Boolean(hasNextPage))

  const publications: PickedMedia[] = (data?.pages.flatMap((p) => p.items) ?? [])
    .filter((m) => !single || m.resource_type !== 'video')
    .map((m) => ({
      key: `media:${m.id}`,
      url: m.url,
      resource_type: m.resource_type === 'video' ? 'video' : 'image',
      alt: m.description,
    }))

  const club: PickedMedia[] = clubPhotos.map((p) => ({
    key: `club:${p.src}`,
    url: p.src,
    resource_type: 'image',
    alt: p.alt,
  }))

  function toggle(item: PickedMedia) {
    setSelected((prev) => {
      if (single) return prev.has(item.key) ? new Map() : new Map([[item.key, item]])
      const next = new Map(prev)
      if (next.has(item.key)) next.delete(item.key)
      else next.set(item.key, item)
      return next
    })
  }

  const order = [...selected.keys()]

  function tile(item: PickedMedia) {
    const rank = order.indexOf(item.key)
    const isSelected = rank >= 0
    return (
      <button
        type="button"
        key={item.key}
        onClick={() => toggle(item)}
        aria-pressed={isSelected}
        aria-label={item.alt ?? (item.resource_type === 'video' ? 'Vidéo' : 'Photo')}
        className={`relative aspect-square overflow-hidden rounded-lg outline-offset-2 transition ${
          isSelected ? 'outline outline-[3px] outline-club-primary' : 'hover:opacity-90'
        }`}
      >
        {item.url.startsWith('/') ? (
          <img
            src={sitePhoto(item.url, 384)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaThumb url={item.url} isVideo={item.resource_type === 'video'} width={300} />
        )}
        {item.resource_type === 'video' && (
          <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
            <Play className="h-3 w-3" aria-hidden />
          </span>
        )}
        {isSelected && (
          <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-club-primary px-1 text-xs font-bold text-white shadow">
            {single ? '✓' : rank + 1}
          </span>
        )}
      </button>
    )
  }

  const tabs: { key: Source; label: string; count?: number }[] = [
    { key: 'publications', label: 'Publications', count: albumId === null ? publicationsTotal : undefined },
    { key: 'club', label: 'Photos du club', count: club.length },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={single ? 'Choisir la couverture' : 'Insérer depuis la galerie'}
      onClick={onClose}
    >
      {/* Sur mobile : feuille montante collée en bas (geste naturel, et on gagne
          les 32 px de marge du dialogue centré). Dialogue centré dès sm. */}
      <div
        className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-surface)] shadow-xl sm:max-h-[85dvh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-line)] px-4 py-3">
          <h2 className="font-display text-xl font-bold text-[color:var(--color-fg)]">
            {single ? 'Choisir la couverture' : 'Insérer depuis la galerie'}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            className="tap flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 border-b border-[color:var(--color-line)] px-4 py-3">
          <div className="segmented sm:w-fit" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={source === t.key}
                onClick={() => setChosenSource(t.key)}
              >
                {t.label}
                {t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
              </button>
            ))}
          </div>
          {source === 'publications' && albums && albums.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par album">
              {[{ id: null, title: 'Tous les médias' }, ...albums].map((a) => (
                <button
                  key={a.id ?? 'all'}
                  type="button"
                  aria-pressed={albumId === a.id}
                  onClick={() => setAlbumId(a.id)}
                  className={`tap rounded-full border px-3 py-1 text-sm transition ${
                    albumId === a.id
                      ? 'border-club-primary bg-club-primary text-white'
                      : 'border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]'
                  }`}
                >
                  {a.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {source === 'publications' ? (
            <>
              {isLoading && <Loading />}
              {isError && <ErrorMessage message="Impossible de charger la galerie." />}
              {!isLoading && !isError && publications.length === 0 && (
                <p className="py-8 text-center text-[color:var(--color-muted)]">
                  {albumId !== null ? 'Cet album est vide.' : 'Aucune publication pour le moment.'}{' '}
                  <button
                    type="button"
                    className="font-semibold text-club-primary-light hover:underline"
                    onClick={() => setChosenSource('club')}
                  >
                    Voir les photos du club
                  </button>
                </p>
              )}
              {/* 3 colonnes sur mobile (~110 px) : assez pour reconnaître une
                  photo, et deux fois moins de défilement qu'à 2. */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
                {publications.map(tile)}
              </div>
              <div ref={sentinelRef} />
              {isFetchingNextPage && <Loading label="Chargement…" />}
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">{club.map(tile)}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[color:var(--color-line)] px-4 py-3">
          {/* Consigne masquée au téléphone tant que rien n'est choisi : sur
              390 px elle prenait trois lignes à côté des deux boutons. */}
          <p
            className={`mr-auto text-sm text-[color:var(--color-muted)] ${selected.size === 0 ? 'hidden sm:block' : ''}`}
          >
            {selected.size === 0
              ? single
                ? 'Touchez une photo.'
                : 'Touchez les médias à insérer, dans l’ordre voulu.'
              : single
                ? '1 photo choisie'
                : `${selected.size} média${selected.size > 1 ? 's' : ''} choisi${selected.size > 1 ? 's' : ''}`}
          </p>
          <button type="button" className="btn-outline tap" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-primary tap disabled:opacity-50"
            disabled={selected.size === 0}
            onClick={() => onInsert(Array.from(selected.values()))}
          >
            {single ? 'Utiliser' : `Insérer${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
