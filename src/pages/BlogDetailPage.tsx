import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock } from 'lucide-react'
import { getBlogBySlug } from '../api/blogs'
import { coverImageStyle } from '../api/types'
import { BlogContent } from '../components/blog/BlogContent'
import { Lightbox } from '../components/ui/Lightbox'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'
import { motion, useReducedMotion } from '../components/ui/motion'
import { useScroll } from 'framer-motion'
import { cldImage, cldSrcSet } from '../lib/cloudinary'

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
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()

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
      {/* Fil de lecture : prolonge le liseré rouge de la navbar (signature du
          club) et donne, sur un écran étroit, la seule indication d'avancement
          qui manquait. Transform seul → composé, pas de reflow. */}
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ scaleX: scrollYProgress }}
          className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-club-primary"
        />
      )}

      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au blog
      </Link>

      {post.cover_image_url ? (
        // Couverture « magazine ». Sur 390 px, un titre en surimpression occupe
        // 3 à 5 lignes et étouffe la photo : sous sm il passe DESSOUS, dans le
        // flux. Surimpression à partir de sm. Un seul <h1> dans le DOM — seule
        // sa position change (`relative` → `sm:absolute`).
        <div className="band mb-6 border border-[color:var(--color-line)] sm:mb-8">
          <div className="relative">
            <img
              src={cldImage(post.cover_image_url, 1600)}
              srcSet={cldSrcSet(post.cover_image_url, [640, 1200, 1600], {
                crop: 'limit',
                quality: 'auto',
                format: 'auto',
              })}
              sizes="100vw"
              alt=""
              className="block aspect-[16/10] w-full cursor-zoom-in object-cover sm:aspect-[16/7]"
              style={coverImageStyle(post.cover_position)}
              onClick={() => setCoverOpen(true)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/40 to-transparent" />
          </div>
          {/* px-4 sous sm : `.band` déborde la gouttière (-mx-4), il faut la
              rendre au bloc de titre pour le réaligner sur la colonne de lecture. */}
          <div className="relative px-4 pt-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:px-10 sm:pb-10 sm:pt-0">
            <div className="mx-auto max-w-3xl">
              {meta}
              <h1
                className="mt-2 font-display font-bold leading-[1.1] text-white sm:mt-3"
                style={{ fontSize: 'clamp(1.6rem, 7vw, 3rem)' }}
              >
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <header className="mx-auto mb-6 max-w-3xl sm:mb-8">
          {meta}
          <h1
            className="mt-2 font-display font-bold leading-[1.1] text-white sm:mt-3"
            style={{ fontSize: 'clamp(1.6rem, 7vw, 3rem)' }}
          >
            {post.title}
          </h1>
        </header>
      )}

      <div className="mx-auto max-w-3xl">
        {post.summary && (
          <p className="text-base leading-relaxed text-[color:var(--color-fg)]/90 sm:text-lg">
            {post.summary}
          </p>
        )}
        <hr className="rule-gold my-6 sm:my-8" />
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
