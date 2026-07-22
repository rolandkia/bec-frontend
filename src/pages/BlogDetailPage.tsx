import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock } from 'lucide-react'
import { getBlogBySlug } from '../api/blogs'
import { coverImageStyle } from '../api/types'
import { BlogContent } from '../components/blog/BlogContent'
import { Lightbox } from '../components/ui/Lightbox'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

/** Temps de lecture estimé (≈200 mots/min) à partir du HTML de l'article. */
function readingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [coverOpen, setCoverOpen] = useState(false)

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug as string),
    enabled: Boolean(slug),
    retry: false,
  })

  if (isLoading) return <Loading />

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Article introuvable" message="Cet article n'existe pas ou n'est plus publié." />
    }
    return <ErrorMessage message="Impossible de charger cet article." />
  }

  if (!post) return null

  const minutes = readingMinutes(post.content_html)

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--color-muted)]">
      {post.published_at && (
        <span className="font-semibold uppercase tracking-[0.14em] text-club-primary-light">
          {formatDate(post.published_at)}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        {minutes} min de lecture
      </span>
    </div>
  )

  return (
    <article className="animate-rise">
      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au blog
      </Link>

      {post.cover_image_url ? (
        // Couverture « magazine » : photo plein-cadre + titre en surimpression
        <div className="band mb-8 border border-[color:var(--color-line)]">
          <img
            src={post.cover_image_url}
            alt=""
            className="aspect-[16/10] w-full cursor-zoom-in object-cover sm:aspect-[16/7]"
            style={coverImageStyle(post.cover_position)}
            onClick={() => setCoverOpen(true)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="mx-auto max-w-3xl">
              {meta}
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <header className="mx-auto mb-8 max-w-3xl">
          {meta}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
            {post.title}
          </h1>
        </header>
      )}

      <div className="mx-auto max-w-3xl">
        {post.summary && (
          <p className="text-lg leading-relaxed text-[color:var(--color-fg)]/90">{post.summary}</p>
        )}
        <hr className="rule-gold my-8" />
        <BlogContent html={post.content_html} />
      </div>

      {coverOpen && post.cover_image_url && (
        <Lightbox
          items={[{ url: post.cover_image_url, type: 'image' }]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setCoverOpen(false)}
        />
      )}
    </article>
  )
}
