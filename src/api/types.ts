export type Sexe = 'homme' | 'femme'

export interface ResultatOut {
  id: number
  date: string | null
  saison: string | null
  epreuve: string
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

export interface BlogPostOut {
  id: number
  slug: string
  title: string
  summary: string | null
  content_markdown: string
  created_at: string
  updated_at: string
  published_at: string | null
}
