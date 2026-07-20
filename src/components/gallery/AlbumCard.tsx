import { Link } from 'react-router-dom'
import type { AlbumOut } from '../../api/types'

export function AlbumCard({ album }: { album: AlbumOut }) {
  return (
    <Link
      to={`/galerie/albums/${album.id}`}
      className="card card-hover block overflow-hidden p-0"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {album.cover_image_url ? (
          <img
            src={album.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary-light to-club-primary text-3xl font-bold text-white">
            {album.title[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="truncate font-semibold text-club-primary dark:text-club-primary-light">
          {album.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {album.media_count} média{album.media_count > 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  )
}
