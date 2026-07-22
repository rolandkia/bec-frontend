import { Link } from 'react-router-dom'
import type { AlbumOut } from '../../api/types'

/** Rangée horizontale de « stories » : un rond par album (façon Instagram). */
export function AlbumStories({ albums }: { albums: AlbumOut[] }) {
  if (albums.length === 0) return null

  return (
    <div className="-mx-1 mb-8 flex gap-4 overflow-x-auto px-1 pb-2">
      {albums.map((album) => (
        <Link
          key={album.id}
          to={`/galerie/albums/${album.id}`}
          className="group flex w-20 flex-shrink-0 flex-col items-center gap-1.5"
        >
          <span className="rounded-full bg-gradient-to-br from-club-primary-light to-club-primary p-[2.5px] transition-transform duration-200 group-hover:scale-105">
            <span className="block rounded-full bg-[color:var(--color-ink)] p-[2px]">
              <span className="block h-16 w-16 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary text-xl font-bold text-white">
                    {album.title[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </span>
            </span>
          </span>
          <span className="w-full truncate text-center text-xs text-[color:var(--color-muted)]">
            {album.title}
          </span>
        </Link>
      ))}
    </div>
  )
}
