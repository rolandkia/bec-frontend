import { apiClient } from './client'
import type { EvenementOut } from './types'

export async function listEvents(): Promise<EvenementOut[]> {
  const { data } = await apiClient.get<EvenementOut[]>('/calendrier/')
  return data
}
