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
    <Link to={`/blog/${post.slug}`} className="card card-hover block overflow-hidden">
      <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
            style={coverImageStyle(post.cover_position)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary/15 to-club-accent/15">
            <span className="font-display text-4xl font-bold text-club-primary/60 dark:text-club-primary-light/60">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        {post.published_at && (
          <p className="mb-1 text-xs font-semibold text-club-accent">
            {formatDate(post.published_at)}
          </p>
        )}
        <h3 className="mb-2 font-display text-lg font-bold text-club-primary dark:text-club-primary-light">
          {post.title}
        </h3>
        {post.summary && (
          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
            {post.summary}
          </p>
        )}
      </div>
    </Link>
  )
}
