import { apiClient } from './client'
import type {
  AlbumCreate,
  AlbumOut,
  AlbumUpdate,
  MediaCreate,
  MediaOut,
  MediaPage,
  MediaUpdate,
} from './types'

export interface MediaQuery {
  limit?: number
  offset?: number
  album_id?: number
  athlete_id?: number
}

export async function listMedia(params: MediaQuery = {}): Promise<MediaPage> {
  const { data } = await apiClient.get<MediaPage>('/gallery/media', { params })
  return data
}

export async function getMedia(id: number): Promise<MediaOut> {
  const { data } = await apiClient.get<MediaOut>(`/gallery/media/${id}`)
  return data
}

export async function createMedia(payload: MediaCreate): Promise<MediaOut> {
  const { data } = await apiClient.post<MediaOut>('/gallery/media', payload)
  return data
}

export async function updateMedia(id: number, payload: MediaUpdate): Promise<MediaOut> {
  const { data } = await apiClient.put<MediaOut>(`/gallery/media/${id}`, payload)
  return data
}

export async function deleteMedia(id: number): Promise<void> {
  await apiClient.delete(`/gallery/media/${id}`)
}

export async function listAlbums(): Promise<AlbumOut[]> {
  const { data } = await apiClient.get<AlbumOut[]>('/gallery/albums')
  return data
}

export async function getAlbum(id: number): Promise<AlbumOut> {
  const { data } = await apiClient.get<AlbumOut>(`/gallery/albums/${id}`)
  return data
}

export async function createAlbum(payload: AlbumCreate): Promise<AlbumOut> {
  const { data } = await apiClient.post<AlbumOut>('/gallery/albums', payload)
  return data
}

export async function updateAlbum(id: number, payload: AlbumUpdate): Promise<AlbumOut> {
  const { data } = await apiClient.put<AlbumOut>(`/gallery/albums/${id}`, payload)
  return data
}

export async function deleteAlbum(id: number): Promise<void> {
  await apiClient.delete(`/gallery/albums/${id}`)
}

/** Ajoute/retire des médias d'un album (deltas). */
export async function updateAlbumMedia(
  id: number,
  deltas: { add_media_ids?: number[]; remove_media_ids?: number[] },
): Promise<AlbumOut> {
  const { data } = await apiClient.put<AlbumOut>(`/gallery/albums/${id}/media`, {
    add_media_ids: deltas.add_media_ids ?? [],
    remove_media_ids: deltas.remove_media_ids ?? [],
  })
  return data
}

export async function listAlbumMedia(
  id: number,
  params: { limit?: number; offset?: number } = {},
): Promise<MediaPage> {
  const { data } = await apiClient.get<MediaPage>(`/gallery/albums/${id}/media`, { params })
  return data
}
