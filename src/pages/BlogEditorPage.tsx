import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { createBlog } from '../api/blogs'
import { BlogPostForm, type BlogFormValues } from '../components/blog/BlogPostForm'

export function BlogEditorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Premier enregistrement : l'article existe désormais, on bascule sur sa page
  // de modification (`replace` : « retour » ne ramène pas à un formulaire vide).
  // Le cache est amorcé avec la réponse, donc aucune attente au changement de page.
  async function handleSave(values: BlogFormValues, publish: boolean) {
    const post = await createBlog({ ...values, publish })
    queryClient.setQueryData(['blog-edit', post.slug], post)
    queryClient.invalidateQueries({ queryKey: ['blogs-admin'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    navigate(`/blog/${post.slug}/modifier`, { replace: true, state: { savedAt: Date.now() } })
  }

  return (
    <div className="animate-rise">
      <Link
        to="/blog/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tous les articles
      </Link>
      <h1 className="section-title mb-6">Nouvel article</h1>
      <BlogPostForm status="new" draftKey="bec:brouillon-article:nouveau" onSave={handleSave} />
    </div>
  )
}
