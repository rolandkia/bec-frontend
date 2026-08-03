/**
 * Les imports dynamiques des pages, NOMMÉS et exportés — un seul endroit.
 *
 * Pourquoi ce fichier plutôt que des `import()` écrits directement dans
 * `App.tsx` : le chargement à la demande a déplacé l'attente, il ne l'a pas
 * supprimée. Un visiteur qui touche « Athlètes » déclenche AU MOMENT DU CLIC le
 * téléchargement du morceau correspondant, soit un aller-retour de ~110 ms
 * jusqu'à la VM américaine (davantage si l'accueil télécharge encore ses
 * photos : le navigateur ne tient que six connexions HTTP/1.1 de front, et la
 * demande du morceau se met dans la file derrière elles). Pendant ce temps
 * l'ancienne page reste à l'écran et RIEN ne bouge : le site paraît ne pas
 * répondre au doigt.
 *
 * La réponse est de précharger avant le clic (survol, premier contact du doigt,
 * ou temps mort après le chargement de l'accueil), ce qui exige de pouvoir
 * nommer le même `import()` depuis deux endroits — la route et le déclencheur.
 * `import()` mémoïse par spécificateur de module : appeler `athletesPage()` deux
 * fois ne télécharge qu'une fois, et `React.lazy` réutilise la promesse déjà
 * résolue. Le clic devient donc instantané si le préchargement a eu le temps
 * d'aboutir, et se comporte exactement comme avant sinon.
 *
 * Les chemins doivent rester des littéraux statiques : c'est ce qui permet à
 * Vite de découper les morceaux à la compilation.
 */

export const clubPage = () => import('../pages/ClubPage')
export const rejoindrePage = () => import('../pages/RejoindrePage')
export const magPage = () => import('../pages/MagPage')
export const calendarPage = () => import('../pages/CalendarPage')
export const athletesPage = () => import('../pages/AthletesPage')
export const athleteDetailPage = () => import('../pages/AthleteDetailPage')
export const blogListPage = () => import('../pages/BlogListPage')
export const blogDetailPage = () => import('../pages/BlogDetailPage')
export const galleryPage = () => import('../pages/GalleryPage')
export const albumDetailPage = () => import('../pages/AlbumDetailPage')

/** Le graphique de la fiche athlète (Recharts), séparé de la page elle-même. */
export const performanceChart = () => import('../components/athletes/PerformanceChart')

/**
 * Morceau à précharger pour une adresse donnée, ou `undefined` si l'adresse n'en
 * a pas (accueil, redirections, pages d'admin).
 *
 * Une seule table, consultée par la navbar et par toute autre surface qui pointe
 * vers une section : un lien ajouté ailleurs n'a rien à savoir du découpage.
 */
export const chunkForPath: Record<string, () => Promise<unknown>> = {
  '/club': clubPage,
  '/athletes': athletesPage,
  '/competitions': calendarPage,
  '/mag': magPage,
  '/rejoindre': rejoindrePage,
  '/blog': blogListPage,
  '/galerie': galleryPage,
}
