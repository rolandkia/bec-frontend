import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteBlog, listAllBlogs } from '../api/blogs'
import { Loading, ErrorMessage } from '../components/ui/Status'
import type { BlogPostOut } from '../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogAdminPage() {
  const queryClient = useQueryClient()
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blogs-admin'],
    queryFn: listAllBlogs,
  })

  async function handleDelete(post: BlogPostOut) {
    if (!window.confirm(`Supprimer « ${post.title} » ?`)) return
    await deleteBlog(post.slug)
    queryClient.invalidateQueries({ queryKey: ['blogs-admin'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
  }

  return (
    <div className="animate-rise">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="section-title text-3xl">Gestion des articles</h1>
        <Link to="/blog/nouveau" className="btn-primary">
          Nouvel article
        </Link>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les articles." />}

      {posts && posts.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">Aucun article pour le moment.</p>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => {
            const isPublished = post.published_at !== null
            return (
              <div key={post.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPublished ? 'Publié' : 'Brouillon'}
                    </span>
                    <h3 className="truncate font-semibold text-club-primary dark:text-club-primary-light">
                      {post.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isPublished && post.published_at
                      ? `Publié le ${formatDate(post.published_at)}`
                      : `Créé le ${formatDate(post.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isPublished && (
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-sm text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Voir
                    </Link>
                  )}
                  <Link to={`/blog/${post.slug}/modifier`} className="btn-outline px-4 py-1.5 text-sm">
                    Modifier
                  </Link>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                    onClick={() => handleDelete(post)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
