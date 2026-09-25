import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'
import { PageFallback } from '../ui/Status'
import { warmNavRoutes } from '../../lib/prefetch'

export function Layout() {
  const { pathname } = useLocation()

  /* L'entrée de page ne joue QUE sur une navigation, jamais au premier
     chargement. Une animation d'opacité au tout premier rendu repousserait le
     LCP d'autant (un élément à `opacity: 0` n'est pas candidat au « largest
     contentful paint ») : la photo du hero de l'accueil est préchargée dès
     l'analyse du HTML précisément pour arriver le plus tôt possible — la fondre
     ensuite pendant 260 ms rendrait ce travail nul.

     L'effet de montage suffit à faire la distinction : il s'exécute après le
     PREMIER rendu, donc le drapeau est encore faux pendant celui-ci et déjà vrai
     pour tous les rendus déclenchés par un changement d'URL ensuite. */
  const navigated = useRef(false)
  useEffect(() => {
    navigated.current = true
  }, [])

  // Les cinq sections de la navbar sont préchargées pendant le premier temps
  // mort qui suit le chargement complet de la page (cf. lib/prefetch.ts) : elles
  // pèsent ~15 ko compressés à elles cinq, et c'est ce qui rend le premier clic
  // sur un onglet immédiat au lieu d'un aller-retour vers la VM américaine.
  useEffect(warmNavRoutes, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Navbar />
      {/* Le conteneur du site vit ICI, une seule fois : px-safe = max(1rem,
          encoche), donc `.band` (-mx-4) et `.chapter` (marge négative en vw)
          retrouvent le bord de l'écran sans double gouttière.
          Plus de padding VERTICAL : un chapitre d'ouverture (`PageHero`) doit
          toucher la navbar. Chaque page pose son propre rythme vertical. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-safe">
        {/* Les pages sont chargées à la demande (cf. App.tsx) : la frontière
            d'attente est posée ICI et non autour de <Routes>, pour que la navbar
            et le pied de page ne clignotent pas d'une page à l'autre. */}
        <Suspense fallback={<PageFallback />}>
          {/* Clé = CHEMIN seul, jamais `location.key` ni la chaîne de requête.
              Les onglets et les filtres du site vivent dans l'URL
              (`/athletes?tab=records`, `?sexe=femme`) : keyer sur l'URL complète
              rejouerait l'entrée de toute la page à chaque appui sur un filtre,
              et surtout REMONTERAIT la page — donc perdrait son état local et
              redéclencherait ses requêtes. Sur le chemin seul, changer d'onglet
              ne coûte rien et changer de page s'annonce. */}
          <div key={pathname} className={navigated.current ? 'page-enter' : undefined}>
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
