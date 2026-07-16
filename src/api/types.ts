export type Sexe = 'homme' | 'femme'

export interface ResultatOut {
  id: number
  date: string | null
  saison: string | null
  epreuve: string
  tour: string | null
  raw_performance: string | null
  performance_metric: string | null
  performance_valeur: number | null
  performance_dq: string | null
  lieu: string | null
  place: number | null
  vent: number | null
  niveau: string | null
  points: number | null
}

export interface ResultatsPage {
  items: ResultatOut[]
  total: number
  limit: number | null
  offset: number
}

export interface AthleteOut {
  id: number
  nom: string
  prenom: string
  ffa_id: string
  sexe: string
  resultats: ResultatOut[]
}

export interface RPOut {
  discipline: string
  epreuve: string
  raw_performance: string | null
  performance_valeur: number | null
  performance_metric: string | null
  date: string | null
  lieu: string | null
  vent: number | null
  niveau: string | null
  homologue: boolean
  resultat_id: number
}

export interface BilanOut {
  athlete_id: number
  nom: string
  prenom: string
  records: RPOut[]
}

export interface ClassementEntry {
  rang: number
  athlete_id: number
  nom: string
  prenom: string
  performance_valeur: number
  raw_performance: string | null
  performance_metric: string | null
  epreuve: string
  date: string | null
  lieu: string | null
  vent: number | null
  niveau: string | null
}

export interface ClassementParDiscipline {
  discipline: string
  classement: ClassementEntry[]
}

export interface NiveauSaisonOut {
  saison: string
  niveau: string | null
}

export interface EvenementOut {
  id: number
  nom: string
  date: string
  lieu: string
  type: 'Piste' | 'Route' | 'Cross' | 'Meeting'
}

export interface CoachOut {
  id: number
  nom: string
  prenom: string
  role: string
  disciplines: string[]
  bio: string
  photo_url: string | null
}

/** Cadrage de la couverture, stocké comme chaîne `"x% y% z<zoom>"`
 *  (p.ex. `"50% 30% z1.6"`). Le token `z…` est optionnel (zoom par défaut = 1).
 *  Les anciennes valeurs `"50% 30%"` / `top` / `center` / `bottom` restent gérées. */
export type CoverPosition = string

/** Bornes de zoom de la couverture. */
export const COVER_ZOOM_MIN = 1
export const COVER_ZOOM_MAX = 4

/** Normalise les mots-clés hérités en pourcentages `"x% y%"`. */
function normalizeKeywords(value: string): string {
  if (value === 'top') return 'center top'
  if (value === 'bottom') return 'center bottom'
  if (value === 'center') return '50% 50%'
  return value
}

/** Convertit la position stockée en valeur CSS `object-position` (sans le zoom). */
export function coverObjectPosition(position?: CoverPosition | null): string {
  if (!position) return '50% 50%'
  const withoutZoom = position.replace(/\s*z[\d.]+\s*$/, '').trim()
  return normalizeKeywords(withoutZoom) || '50% 50%'
}

/** Extrait le facteur de zoom (défaut 1), borné à [MIN, MAX]. */
export function coverZoom(position?: CoverPosition | null): number {
  const match = position?.match(/z([\d.]+)\s*$/)
  const zoom = match ? parseFloat(match[1]) : 1
  if (!Number.isFinite(zoom)) return 1
  return Math.min(COVER_ZOOM_MAX, Math.max(COVER_ZOOM_MIN, zoom))
}

/** Construit la chaîne `cover_position` à partir de la position et du zoom. */
export function buildCoverPosition(objectPosition: string, zoom: number): string {
  const pos = objectPosition.trim() || '50% 50%'
  const z = Math.min(COVER_ZOOM_MAX, Math.max(COVER_ZOOM_MIN, zoom))
  return z === 1 ? pos : `${pos} z${z.toFixed(2)}`
}

/** Styles inline partagés par le picker, l'aperçu et l'article : garantit un
 *  recadrage identique partout (même conteneur à ratio fixe + object-cover). */
export function coverImageStyle(position?: CoverPosition | null): {
  objectPosition: string
  transform: string
  transformOrigin: string
} {
  const objectPosition = coverObjectPosition(position)
  const zoom = coverZoom(position)
  return {
    objectPosition,
    transform: `scale(${zoom})`,
    transformOrigin: objectPosition,
  }
}

export interface BlogPostOut {
  id: number
  slug: string
  title: string
  summary: string | null
  cover_image_url: string | null
  cover_position: CoverPosition
  content_html: string
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface BlogPostCreate {
  title: string
  summary?: string | null
  cover_image_url?: string | null
  cover_position?: CoverPosition
  content_html: string
  publish?: boolean
}

export interface BlogPostUpdate {
  title?: string | null
  summary?: string | null
  cover_image_url?: string | null
  cover_position?: CoverPosition | null
  content_html?: string | null
  publish?: boolean | null
}

export interface MediaUploadOut {
  url: string
  resource_type: string
}
