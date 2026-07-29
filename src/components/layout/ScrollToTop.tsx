import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * En SPA, changer de route ne remet pas le défilement à zéro : on arrivait au
 * milieu de la nouvelle page. `<ScrollRestoration>` de React Router n'est pas
 * utilisable ici (réservé au data router, or l'app monte un `<BrowserRouter>`).
 *
 * On ne touche PAS aux navigations POP (retour / avance du navigateur) : la
 * position précédente doit être restaurée, c'est ce que l'utilisateur attend.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') return
    // Défilement instantané : un `smooth` sur un changement de page ajoute une
    // latence perçue et ignore `prefers-reduced-motion`.
    window.scrollTo({ top: 0, left: 0 })
    // Clé sur `pathname` seulement : les onglets (`?tab=`) sont gérés par
    // `useTabParam`, qui remonte lui-même en haut.
  }, [pathname, navigationType])

  return null
}
