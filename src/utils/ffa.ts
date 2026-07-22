/**
 * URL de la fiche athlète sur le site de la FFA.
 *
 * On réutilise EXACTEMENT la convention du site (le scraper backend
 * `bec-backend/src/external/ffa_scraper.py` : endpoint `athle.fr` + athlète
 * identifié par le paramètre `seq` = `ffa_id`). Aucune URL « devinée ».
 */
export function ffaProfileUrl(
  ffaId: string,
  annee: number = new Date().getFullYear(),
): string {
  const params = new URLSearchParams({ seq: ffaId, annee: String(annee) })
  return `https://www.athle.fr/ajax/fiche-athlete-resultats.aspx?${params.toString()}`
}
