import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'
import { Loading } from '../ui/Status'

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
        {/* Les pages sont chargées à la demande (cf. App.tsx) : la frontière
            d'attente est posée ICI et non autour de <Routes>, pour que la navbar
            et le pied de page ne clignotent pas d'une page à l'autre. */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
