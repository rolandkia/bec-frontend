import { apiClient } from './client'
import type { DemandeInput } from './types'

/**
 * Transmet une demande au club (inscription, question, autre). Le backend
 * l'envoie par e-mail et ne stocke rien : la réponse ne contient qu'un statut.
 */
export async function envoyerDemande(payload: DemandeInput): Promise<void> {
  await apiClient.post('/demandes/', payload)
}
