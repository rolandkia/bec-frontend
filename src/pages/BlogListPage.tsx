import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listBlogs } from '../api/blogs'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'

export function BlogListPage({ embedded = false }: { embedded?: boolean }) {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blogs'],
    queryFn: listBlogs,
  })

  return (
    <div className={embedded ? '' : 'animate-rise'}>
      <div className={`mb-8 flex items-center ${embedded ? 'justify-end' : 'justify-between'}`}>
        {!embedded && <h1 className="section-title text-3xl">Blog du club</h1>}
        <Link to="/blog/admin" className="btn-outline">
          Gérer les articles
        </Link>
      </div>
      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les articles." />}
      {posts && posts.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">Aucun article publié pour le moment.</p>
      )}
      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
