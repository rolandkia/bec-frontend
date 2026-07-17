import { compressImage } from '../lib/compressImage'
import { apiClient } from './client'
import type { MediaUploadOut } from './types'

/** Limites d'upload — doivent rester alignées sur le backend
 *  (media_service.py : MAX_IMAGE_BYTES / MAX_VIDEO_BYTES). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024

/** Message d'erreur si le fichier dépasse sa limite (feedback immédiat avant
 *  l'envoi), ou null s'il est acceptable. Les images sont compressées côté
 *  client avant l'envoi, donc la limite image est indicative ici. */
export function mediaTooLargeMessage(file: File): string | null {
  const isVideo = file.type.startsWith('video/')
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size <= max) return null
  const label = isVideo ? 'Vidéo' : 'Image'
  return `${label} trop volumineuse (max ${max / (1024 * 1024)} Mo). Réduisez ou compressez le fichier avant l'envoi.`
}

export async function uploadMedia(file: File): Promise<MediaUploadOut> {
  if (file.type.startsWith('image/')) {
    file = await compressImage(file)
  }
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<MediaUploadOut>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
