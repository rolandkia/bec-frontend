import { apiClient } from './client'
import type {
  AthleteOut,
  BilanOut,
  ClassementParDiscipline,
  NiveauSaisonOut,
  ResultatsPage,
  RPOut,
  Sexe,
} from './types'

export async function listAthletes(): Promise<AthleteOut[]> {
  const { data } = await apiClient.get<AthleteOut[]>('/athletes/')
  return data
}

export async function getAthlete(athleteId: number): Promise<AthleteOut> {
  const { data } = await apiClient.get<AthleteOut>(`/athletes/${athleteId}`)
  return data
}

export async function getResultats(
  athleteId: number,
  params?: { start_date?: string; end_date?: string; limit?: number; offset?: number },
): Promise<ResultatsPage> {
  const { data } = await apiClient.get<ResultatsPage>(
    `/athletes/${athleteId}/resultats`,
    { params },
  )
  return data
}

export async function getRP(
  athleteId: number,
  params?: { discipline?: string; homologue?: boolean },
): Promise<RPOut[]> {
  const { data } = await apiClient.get<RPOut[]>(`/athletes/${athleteId}/rp`, {
    params,
  })
  return data
}

export async function getBilan(
  athleteId: number,
  params?: { homologue?: boolean },
): Promise<BilanOut> {
  const { data } = await apiClient.get<BilanOut>(
    `/athletes/${athleteId}/bilan`,
    { params },
  )
  return data
}

export async function getNiveau(
  athleteId: number,
  params?: { saison?: string },
): Promise<NiveauSaisonOut[]> {
  const { data } = await apiClient.get<NiveauSaisonOut[]>(
    `/athletes/${athleteId}/niveau`,
    { params },
  )
  return data
}

export async function getClassements(params: {
  sexe: Sexe
  discipline?: string
  saison?: string
  homologue?: boolean
}): Promise<ClassementParDiscipline[]> {
  const { data } = await apiClient.get<ClassementParDiscipline[]>(
    '/athletes/classements',
    { params },
  )
  return data
}
