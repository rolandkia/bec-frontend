import { apiClient } from './client'
import type { BlogPostCreate, BlogPostOut, BlogPostUpdate } from './types'

export async function listBlogs(): Promise<BlogPostOut[]> {
  const { data } = await apiClient.get<BlogPostOut[]>('/blogs/')
  return data
}

export async function getBlogBySlug(slug: string): Promise<BlogPostOut> {
  const { data } = await apiClient.get<BlogPostOut>(`/blogs/${slug}`)
  return data
}

export async function createBlog(payload: BlogPostCreate): Promise<BlogPostOut> {
  const { data } = await apiClient.post<BlogPostOut>('/blogs/', payload)
  return data
}

export async function updateBlog(slug: string, payload: BlogPostUpdate): Promise<BlogPostOut> {
  const { data } = await apiClient.put<BlogPostOut>(`/blogs/${slug}`, payload)
  return data
}
