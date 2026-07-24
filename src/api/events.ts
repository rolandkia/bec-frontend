import axios from 'axios'
import { apiClient } from './client'
import type { EvenementOut } from './types'

export async function listEvents(): Promise<EvenementOut[]> {
  try {
    const { data } = await apiClient.get<EvenementOut[]>('/calendrier/')
    return data
  } catch (err) {
    // La feature calendrier n'existe pas (encore) côté backend : on renvoie une
    // liste vide plutôt que de bloquer les pages qui l'affichent.
    if (axios.isAxiosError(err) && err.response?.status === 404) return []
    throw err
  }
}
