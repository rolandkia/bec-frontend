import { apiClient } from './client'
import type { BlogMediaOut, BlogPostCreate, BlogPostOut, BlogPostUpdate } from './types'

/** Images/vidéos des articles pas encore présentes dans la galerie. */
export async function listBlogMedia(): Promise<BlogMediaOut[]> {
  const { data } = await apiClient.get<BlogMediaOut[]>('/blogs/media')
  return data
}

export async function listBlogs(): Promise<BlogPostOut[]> {
  const { data } = await apiClient.get<BlogPostOut[]>('/blogs/')
  return data
}

export async function listAllBlogs(): Promise<BlogPostOut[]> {
  const { data } = await apiClient.get<BlogPostOut[]>('/blogs/admin')
  return data
}

export async function getBlogBySlug(slug: string): Promise<BlogPostOut> {
  const { data } = await apiClient.get<BlogPostOut>(`/blogs/${slug}`)
  return data
}

export async function getBlogForEdit(slug: string): Promise<BlogPostOut> {
  const { data } = await apiClient.get<BlogPostOut>(`/blogs/${slug}/edit`)
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

export async function deleteBlog(slug: string): Promise<void> {
  await apiClient.delete(`/blogs/${slug}`)
}
