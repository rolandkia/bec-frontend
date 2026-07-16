import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBlogBySlug } from '../api/blogs'
import { BlogContent } from '../components/blog/BlogContent'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()

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

  return (
    <article>
      <Link to="/blog" className="mb-6 inline-block text-sm text-slate-500 underline dark:text-slate-400">
        ← Retour au blog
      </Link>
      {post.published_at && (
        <p className="mb-2 text-sm font-medium text-club-accent">
          {new Date(post.published_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      <h1 className="mb-6 text-3xl font-bold text-club-primary dark:text-club-primary-light">
        {post.title}
      </h1>
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt=""
          className="mb-6 max-h-96 w-full rounded-lg object-cover"
        />
      )}
      <BlogContent markdown={post.content_markdown} />
    </article>
  )
}
