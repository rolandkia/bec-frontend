import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
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
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
