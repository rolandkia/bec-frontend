import type { ResultatOut } from '../api/types'

/**
 * Score comparable pour un niveau FFA.
 * Porté de bec-backend/src/domain/niveau.py (niveau_score).
 *
 * Hiérarchie (du plus bas au plus haut) :
 * Départemental D1-D7 < Régional R1-R6 < Interrégional IR1-IR4
 * < National N1-N4 < International IA/IB.
 * À l'intérieur d'une catégorie, le chiffre bas est le plus haut (D1 > D7).
 */
export function niveauScore(niveau: string): number {
  const n = niveau.trim().toUpperCase().replace(/\s/g, '')

  if (n === 'IA') return 402
  if (n === 'IB') return 401

  let match = /^IR(\d+)$/.exec(n)
  if (match) return 200 + (5 - Number(match[1]))

  match = /^N(\d+)$/.exec(n)
  if (match) return 300 + (5 - Number(match[1]))

  match = /^R(\d+)$/.exec(n)
  if (match) return 100 + (7 - Number(match[1]))

  match = /^D(\d+)$/.exec(n)
  if (match) return 8 - Number(match[1])

  return 0
}

/**
 * Détermine le niveau d'un athlète pour une saison (min. 2 perfs au même niveau),
 * en renvoyant le plus haut niveau éligible. Porté de compute_niveau_saison.
 */
export function computeNiveauSaison(
  resultats: ResultatOut[],
  saison: string,
): string | null {
  const counts = new Map<string, number>()
  for (const r of resultats) {
    if (r.saison === saison && r.niveau) {
      counts.set(r.niveau, (counts.get(r.niveau) ?? 0) + 1)
    }
  }

  let best: string | null = null
  for (const [niveau, count] of counts) {
    if (count >= 2 && (best === null || niveauScore(niveau) > niveauScore(best))) {
      best = niveau
    }
  }
  return best
}

export interface NiveauTier {
  /** Palier 0 (départemental/inconnu) à 4 (international). */
  tier: number
  /** Nombre de chevrons cumulés affichés dans le badge. */
  chevrons: number
  /** Ajoute une étoile dorée pour le palier international. */
  star: boolean
  /** Classes Tailwind du badge, de plus en plus « impressionnantes ». */
  className: string
}

/** Associe un niveau à son palier visuel (couleur/effet qui montent en gamme). */
export function niveauTier(niveau: string): NiveauTier {
  const score = niveauScore(niveau)

  if (score >= 401) {
    return {
      tier: 4,
      chevrons: 4,
      star: true,
      className:
        'bg-gradient-to-r from-club-accent to-club-accent-light text-slate-900 shadow-lg shadow-club-accent/40 ring-1 ring-white/50',
    }
  }
  if (score >= 300) {
    return {
      tier: 3,
      chevrons: 3,
      star: false,
      className:
        'bg-gradient-to-r from-club-primary to-club-primary-light text-white shadow-md shadow-club-primary/30',
    }
  }
  if (score >= 200) {
    return {
      tier: 2,
      chevrons: 2,
      star: false,
      className:
        'bg-club-primary/15 text-club-primary ring-1 ring-club-primary/40 shadow-sm dark:text-club-primary-light',
    }
  }
  if (score >= 100) {
    return {
      tier: 1,
      chevrons: 1,
      star: false,
      className:
        'bg-club-primary/10 text-club-primary ring-1 ring-club-primary/25 dark:text-club-primary-light',
    }
  }
  // Départemental (1-7) et niveau inconnu (0)
  return {
    tier: 0,
    chevrons: 0,
    star: false,
    className: 'bg-white/5 text-[color:var(--color-muted)] ring-1 ring-white/10',
  }
}
