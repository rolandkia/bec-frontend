import { apiClient } from './client'
import type { CoachOut } from './types'

export async function listCoachs(): Promise<CoachOut[]> {
  const { data } = await apiClient.get<CoachOut[]>('/coachs/')
  return data
}
