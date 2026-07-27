import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      {/* px-safe = max(1rem, encoche) : la gouttière de 16 px que `.band`
          compense par `-mx-4` reste la même, les coins arrondis sont respectés. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-safe py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
