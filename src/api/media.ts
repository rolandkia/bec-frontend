import { apiClient } from './client'
import type { MediaUploadOut } from './types'

export async function uploadMedia(file: File): Promise<MediaUploadOut> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<MediaUploadOut>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
