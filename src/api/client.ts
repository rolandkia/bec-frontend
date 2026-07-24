import axios from 'axios'

// En dev : base relative « /api » relayée vers le backend par le proxy Vite
// (voir vite.config.ts) — requêtes same-origin, aucun problème de CORS.
// En prod : définir VITE_API_BASE_URL sur l'URL publique de l'API.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})
