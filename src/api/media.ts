import { compressImage } from '../lib/compressImage'
import { mediaKind, withInferredType } from '../lib/mediaKind'
import { apiClient } from './client'
import type { MediaUploadOut } from './types'

/** Limites d'upload — doivent rester alignées sur le backend
 *  (media_service.py : MAX_IMAGE_UPLOAD_BYTES / MAX_VIDEO_UPLOAD_BYTES).
 *  Ce sont des plafonds DURS du plan gratuit Cloudinary, non contournables. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024

function mo(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} Mo`
}

/** Message d'erreur si le fichier dépasse sa limite (feedback immédiat avant
 *  l'envoi), ou null s'il est acceptable. Les images sont compressées côté
 *  client avant l'envoi, donc la limite image est indicative ici.
 *
 *  Le type est déterminé par `mediaKind` et non par le seul MIME : une vidéo
 *  annoncée `application/octet-stream` tombait dans la branche image et se
 *  faisait refuser avec « Image trop volumineuse (max 10 Mo) ». */
export function mediaTooLargeMessage(file: File): string | null {
  const isVideo = mediaKind(file) === 'video'
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size <= max) return null

  const label = isVideo ? 'Vidéo' : 'Image'
  const head = `${label} trop volumineuse : « ${file.name} » pèse ${mo(file.size)} pour une limite de ${mo(max)}.`
  // Pour une vidéo, il n'y a pas de compression navigateur : le seul remède est
  // côté utilisateur, autant lui dire lequel.
  return isVideo
    ? `${head} Réduisez la définition avant l'envoi — sur iPhone : Réglages › Appareil photo › Formats › 1080p 30 i/s — ou raccourcissez la vidéo.`
    : `${head} Réduisez ou compressez l'image avant l'envoi.`
}

export async function uploadMedia(file: File): Promise<MediaUploadOut> {
  // Re-type le fichier quand le navigateur n'a pas su le faire, pour que le
  // Content-Type de la part multipart soit correct côté serveur.
  let payload = withInferredType(file)
  if (mediaKind(payload) === 'image') {
    payload = await compressImage(payload)
  }
  const formData = new FormData()
  formData.append('file', payload)
  const { data } = await apiClient.post<MediaUploadOut>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
