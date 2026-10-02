import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { deleteBlog, getBlogForEdit, updateBlog } from '../api/blogs'
import { BlogPostForm, type BlogFormValues } from '../components/blog/BlogPostForm'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

export function BlogEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Heure du premier enregistrement, quand on arrive de « Nouvel article ».
  const savedAt = (useLocation().state as { savedAt?: number } | null)?.savedAt

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['blog-edit', slug],
    queryFn: () => getBlogForEdit(slug as string),
    enabled: Boolean(slug),
    retry: false,
    // Le formulaire possède ses valeurs une fois ouvert : un rechargement en
    // arrière-plan (retour sur l'onglet) ne doit pas le remonter.
    refetchOnWindowFocus: false,
  })

  if (isLoading) return <Loading />

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Article introuvable" message="Cet article n'existe pas." />
    }
    return <ErrorMessage message="Impossible de charger cet article." />
  }

  if (!post) return null

  // On reste dans l'éditeur après l'enregistrement : la réponse remplace le
  // cache (statut « Publié » / « Brouillon » à jour), et les listes du Mag et de
  // l'administration sont invalidées.
  async function handleSave(values: BlogFormValues, publish: boolean) {
    const saved = await updateBlog(post!.slug, { ...values, publish })
    queryClient.setQueryData(['blog-edit', slug], saved)
    queryClient.invalidateQueries({ queryKey: ['blogs-admin'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    queryClient.invalidateQueries({ queryKey: ['blog', saved.slug] })
  }

  async function handleDelete() {
    await deleteBlog(post!.slug)
    queryClient.invalidateQueries({ queryKey: ['blogs-admin'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    navigate('/blog/admin')
  }

  const isPublished = post.published_at !== null

  return (
    <div className="animate-rise">
      <Link
        to="/blog/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tous les articles
      </Link>
      <h1 className="section-title mb-6">Modifier l'article</h1>
      <BlogPostForm
        // Une clé par article : la copie locale d'un article ne s'invite pas
        // dans un autre.
        key={post.id}
        initial={post}
        status={isPublished ? 'published' : 'draft'}
        draftKey={`bec:brouillon-article:${post.id}`}
        onSave={handleSave}
        onDelete={handleDelete}
        viewHref={`/blog/${post.slug}`}
        savedAt={savedAt}
      />
    </div>
  )
}
