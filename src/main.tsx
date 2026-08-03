import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une seule nouvelle tentative : en cas d'API injoignable, l'erreur
      // s'affiche vite au lieu de rester bloqué en « chargement ».
      retry: 1,
      // Cinq minutes, pas trente secondes. Le serveur est aux États-Unis et le
      // public en France : chaque refetch coûte ~110 ms d'aller-retour minimum,
      // pour des données qui bougent au mieux une fois par semaine (résultats
      // FFA) ou par publication (blog, calendrier). Les durées de cache par
      // famille de données sont dans `src/api/staleTime.ts`.
      staleTime: 5 * 60_000,
      // Revenir sur l'onglet ne doit PAS relancer toutes les requêtes de la
      // page : c'est un aller-retour transatlantique par requête pour, presque
      // toujours, la même réponse. Un rechargement volontaire (F5) et
      // l'expiration du `staleTime` suffisent à rattraper les données.
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
