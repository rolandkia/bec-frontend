import { Link } from 'react-router-dom'
import type { BlogPostOut } from '../../api/types'

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
    <Link to={`/blog/${post.slug}`} className="card card-hover block p-5">
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
    </Link>
  )
}
