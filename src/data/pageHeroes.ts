/**
 * Photo d'OUVERTURE de chaque page — la première du bandeau, celle que le
 * visiteur voit en arrivant. SOURCE UNIQUE pour deux clients :
 *   - les pages, qui la posent dans leur `PageHero` / `Chapter` (le choix de
 *     chaque photo est commenté là-bas, à côté de son cadrage) ;
 *   - `vite.config.ts`, qui écrit dans index.html un préchargement de la photo
 *     de l'adresse demandée (cf. `LANDING_HEROES`).
 *
 * Module PUR (aucun import) : il est lu par la configuration de Vite, sous Node.
 */

export const HERO_ACCUEIL = '/photos/hero-interclub.webp'
export const HERO_CLUB = '/photos/gallery/group-8.webp'
export const HERO_COMPETITIONS = '/photos/gallery/start-5.webp'
export const HERO_MAG = '/photos/hero-depart.webp'
export const HERO_REJOINDRE = '/photos/hero-studio-team.webp'
export const HERO_ATHLETES = '/photos/interclub-drapeau-wide.webp'
export const HERO_ATHLETES_HOMMES = '/photos/gallery/group-4.webp'
export const HERO_ATHLETES_FEMMES = '/photos/gallery/group-7.webp'
export const HERO_RECORDS = '/photos/gallery/start-2.webp'

/**
 * Adresse d'arrivée → photo d'ouverture, pour le préchargement d'index.html.
 *
 * Sur /athletes la photo dépend de la vue, portée par l'URL (`?tab=records`,
 * `?sexe=femme`) : la clé reprend ce paramètre, et le script d'index.html la
 * reconstruit de la même façon. Les anciennes adresses qui redirigent
 * (/palmares, /calendrier…) ne sont pas listées : elles se chargent simplement
 * sans préchargement, comme avant.
 */
export const LANDING_HEROES: Record<string, string> = {
  '/': HERO_ACCUEIL,
  '/club': HERO_CLUB,
  '/competitions': HERO_COMPETITIONS,
  '/mag': HERO_MAG,
  '/rejoindre': HERO_REJOINDRE,
  '/athletes': HERO_ATHLETES,
  '/athletes?sexe=homme': HERO_ATHLETES_HOMMES,
  '/athletes?sexe=femme': HERO_ATHLETES_FEMMES,
  '/athletes?tab=records': HERO_RECORDS,
}
