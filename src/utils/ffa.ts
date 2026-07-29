/**
 * URL de la fiche athlète sur le site de la FFA.
 *
 * C'est l'URL publique du site (ex. `https://www.athle.fr/athletes/2932639`),
 * l'identifiant du segment étant le `ffa_id` de l'athlète. On ne pointe PAS vers
 * l'endpoint AJAX `fiche-athlete-resultats.aspx` utilisé par le scraper backend
 * (`bec-backend/src/external/ffa_scraper.py`) : c'est un fragment technique,
 * pas une page à ouvrir dans un onglet.
 */
export function ffaProfileUrl(ffaId: string): string {
  return `https://www.athle.fr/athletes/${encodeURIComponent(ffaId)}`
}
