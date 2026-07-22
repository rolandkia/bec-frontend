import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listBlogs } from '../api/blogs'
import { coverImageStyle } from '../api/types'
import type { BlogPostOut } from '../api/types'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { motion, Reveal, RevealGroup, staggerItem } from '../components/ui/motion'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Article vedette : carte large horizontale façon Une de magazine. */
function FeaturedCard({ post }: { post: BlogPostOut }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group card card-hover block overflow-hidden md:grid md:grid-cols-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--color-surface-2)] md:aspect-auto md:h-full">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            style={coverImageStyle(post.cover_position)}
          />
        ) : (
          <div className="flex h-full min-h-56 w-full items-center justify-center bg-gradient-to-br from-club-primary/20 to-[color:var(--color-surface-2)]">
            <span className="font-display text-6xl font-bold text-club-primary-light/70">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <span className="mb-3 inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-club-primary-light">
          <span className="h-1 w-6 rounded-full bg-club-primary" /> À la une
        </span>
        {post.published_at && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            {formatDate(post.published_at)}
          </p>
        )}
        <h2 className="mb-3 font-display text-2xl font-bold leading-tight text-white transition-colors group-hover:text-club-primary-light sm:text-3xl">
          {post.title}
        </h2>
        {post.summary && (
          <p className="line-clamp-4 text-sm leading-relaxed text-slate-300">{post.summary}</p>
        )}
      </div>
    </Link>
  )
}

export function BlogListPage({ embedded = false }: { embedded?: boolean }) {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blogs'],
    queryFn: listBlogs,
  })

  const [featured, ...rest] = posts ?? []

  return (
    <div>
      <Reveal className={`mb-8 flex items-center ${embedded ? 'justify-end' : 'justify-between'}`}>
        {!embedded && <h1 className="section-title text-3xl">Blog du club</h1>}
        <Link to="/blog/admin" className="btn-outline">
          Gérer les articles
        </Link>
      </Reveal>
      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les articles." />}
      {posts && posts.length === 0 && (
        <p className="text-[color:var(--color-muted)]">Aucun article publié pour le moment.</p>
      )}
      {featured && (
        <div className="space-y-6">
          <Reveal>
            <FeaturedCard post={featured} />
          </Reveal>
          {rest.length > 0 && (
            <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {rest.map((post) => (
                <motion.div key={post.id} variants={staggerItem}>
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </RevealGroup>
          )}
        </div>
      )}
    </div>
  )
}
