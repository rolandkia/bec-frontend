import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listBlogs } from '../api/blogs'
import { coverImageStyle } from '../api/types'
import type { BlogPostOut } from '../api/types'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { motion, Reveal, RevealGroup, staggerItem } from '../components/ui/motion'
import { cldImage, cldSrcSet } from '../lib/cloudinary'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Article vedette : « Une » de magazine. Sous `md`, le bloc éditorial passe en
 * SURIMPRESSION au bas d'une couverture 4/3 — il sort du flux, donc la carte ne
 * fait plus que la hauteur de la photo (~290 px au lieu de ~445 px empilés), et
 * le contraste avec les rangées compactes de <BlogCard> donne enfin du rythme.
 * À partir de `md`, `md:static` rend le panneau au flux : split 2 colonnes
 * identique à avant.
 */
function FeaturedCard({ post }: { post: BlogPostOut }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group card card-hover tap relative block overflow-hidden md:grid md:grid-cols-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--color-surface-2)] sm:aspect-[16/10] md:aspect-auto md:h-full">
        {post.cover_image_url ? (
          <img
            src={cldImage(post.cover_image_url, 800)}
            srcSet={cldSrcSet(post.cover_image_url, [480, 800, 1200], {
              crop: 'limit',
              quality: 'auto',
              format: 'auto',
            })}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt=""
            loading="lazy"
            decoding="async"
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
        {/* Voile de lisibilité du bloc en surimpression (sous md uniquement).
            Dosé pour une couverture CLAIRE : à via-30 %, la pastille « À la une »
            et la date se noyaient dans une photo lumineuse. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/60 to-[color:var(--color-ink)]/10 md:hidden" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-center p-5 md:static md:p-8">
        <span className="mb-2 inline-flex w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-club-primary-light sm:text-xs md:mb-3">
          <span className="h-1 w-6 rounded-full bg-club-primary" /> À la une
        </span>
        {post.published_at && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)] sm:text-xs md:mb-2">
            {formatDate(post.published_at)}
          </p>
        )}
        <h2
          className="font-display font-bold leading-[1.1] text-white transition-colors group-hover:text-club-primary-light md:mb-3"
          style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.875rem)' }}
        >
          {post.title}
        </h2>
        {post.summary && (
          // 2 lignes en surimpression (la photo doit rester lisible), 4 en panneau.
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300 md:mt-0 md:line-clamp-4">
            {post.summary}
          </p>
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
      <Reveal
        className={`mb-6 flex flex-wrap items-center gap-3 sm:mb-8 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && <h1 className="section-title">Blog du club</h1>}
        <Link to="/blog/admin" className="btn-outline tap">
          Gérer les articles
        </Link>
      </Reveal>
      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les articles." />}
      {posts && posts.length === 0 && (
        <p className="text-[color:var(--color-muted)]">Aucun article publié pour le moment.</p>
      )}
      {featured && (
        <div className="space-y-4 sm:space-y-6">
          <Reveal>
            <FeaturedCard post={featured} />
          </Reveal>
          {rest.length > 0 && (
            <RevealGroup className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {rest.map((post, i) => (
                <motion.div key={post.id} variants={staggerItem}>
                  {/* Rythme éditorial sur mobile : une carte pleine tous les
                      4 articles casse la monotonie de la pile de rangées. Sans
                      effet dès sm, où tout est déjà en carte. */}
                  <BlogCard post={post} layout={i % 4 === 3 ? 'card' : 'auto'} />
                </motion.div>
              ))}
            </RevealGroup>
          )}
        </div>
      )}
    </div>
  )
}
