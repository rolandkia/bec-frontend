import { Link } from 'react-router-dom'
import { coverImageStyle, type BlogPostOut } from '../../api/types'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogCard({ post }: { post: BlogPostOut }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group card card-hover block h-full overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            style={coverImageStyle(post.cover_position)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary/20 to-[color:var(--color-surface-2)]">
            <span className="font-display text-5xl font-bold text-club-primary-light/70">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/70 via-transparent to-transparent" />
      </div>
      <div className="p-5">
        {post.published_at && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-club-primary-light">
            {formatDate(post.published_at)}
          </p>
        )}
        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-club-primary-light">
          {post.title}
        </h3>
        {post.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">{post.summary}</p>
        )}
      </div>
    </Link>
  )
}
