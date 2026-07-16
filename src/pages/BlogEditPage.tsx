import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { deleteBlog, getBlogForEdit, updateBlog } from '../api/blogs'
import { BlogPostForm, type BlogFormValues } from '../components/blog/BlogPostForm'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'

export function BlogEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['blog-edit', slug],
    queryFn: () => getBlogForEdit(slug as string),
    enabled: Boolean(slug),
    retry: false,
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

  async function handleSubmit(values: BlogFormValues, publish: boolean) {
    await updateBlog(post!.slug, { ...values, publish })
    navigate('/blog/admin')
  }

  async function handleDelete() {
    await deleteBlog(post!.slug)
    navigate('/blog/admin')
  }

  const isPublished = post.published_at !== null

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8 text-3xl">Modifier l'article</h1>
      <BlogPostForm
        initial={post}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        submitLabelDraft={isPublished ? 'Repasser en brouillon' : 'Enregistrer le brouillon'}
        submitLabelPublish={isPublished ? 'Mettre à jour' : 'Publier'}
      />
    </div>
  )
}
