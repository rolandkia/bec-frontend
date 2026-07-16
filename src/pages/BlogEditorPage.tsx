import { useNavigate } from 'react-router-dom'
import { createBlog } from '../api/blogs'
import { BlogPostForm, type BlogFormValues } from '../components/blog/BlogPostForm'

export function BlogEditorPage() {
  const navigate = useNavigate()

  async function handleSubmit(values: BlogFormValues, publish: boolean) {
    await createBlog({ ...values, publish })
    navigate('/blog/admin')
  }

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8 text-3xl">Nouvel article</h1>
      <BlogPostForm onSubmit={handleSubmit} />
    </div>
  )
}
