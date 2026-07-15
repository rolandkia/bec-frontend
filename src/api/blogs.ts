import { apiClient } from './client'
import type { BlogPostOut } from './types'

export async function listBlogs(): Promise<BlogPostOut[]> {
  const { data } = await apiClient.get<BlogPostOut[]>('/blogs/')
  return data
}

export async function getBlogBySlug(slug: string): Promise<BlogPostOut> {
  const { data } = await apiClient.get<BlogPostOut>(`/blogs/${slug}`)
  return data
}
