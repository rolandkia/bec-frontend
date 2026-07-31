import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { ClubPage } from './pages/ClubPage'
import { RejoindrePage } from './pages/RejoindrePage'
import { MagPage } from './pages/MagPage'
import { CalendarPage } from './pages/CalendarPage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogEditorPage } from './pages/BlogEditorPage'
import { BlogEditPage } from './pages/BlogEditPage'
import { BlogAdminPage } from './pages/BlogAdminPage'
import { AthletesPage } from './pages/AthletesPage'
import { AthleteDetailPage } from './pages/AthleteDetailPage'
import { GalleryPage } from './pages/GalleryPage'
import { GalleryAdminPage } from './pages/GalleryAdminPage'
import { MediaUploadPage } from './pages/MediaUploadPage'
import { AlbumDetailPage } from './pages/AlbumDetailPage'
import { MediaEditPage } from './pages/MediaEditPage'
import { NotFound } from './components/ui/Status'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        {/* ─── Les 5 sections de la navigation ────────────────────────────────
            Le Club (histoire + palmarès + équipe + partenaires) · Athlètes
            (effectif + records) · Compétitions (calendrier) · Le Mag (articles +
            galerie) · Nous rejoindre (groupes + contact).
            La nav en comptait 8 et débordait dès 1024 px ; surtout, quatre
            d'entre elles répondaient deux par deux à la même question du
            visiteur (l'histoire du club, ou comment s'inscrire). */}
        <Route path="club" element={<ClubPage />} />
        <Route path="athletes" element={<AthletesPage />} />
        <Route path="competitions" element={<CalendarPage />} />
        <Route path="mag" element={<MagPage />} />
        <Route path="rejoindre" element={<RejoindrePage />} />

        {/* ─── Anciennes URL (liens externes, favoris, moteurs) ───────────────
            Toutes conservées : aucune adresse déjà partagée ne doit tomber en
            404. Les quatre premières datent de la refonte de l'arborescence. */}
        <Route path="palmares" element={<Navigate to="/club#palmares" replace />} />
        <Route path="infos-pratiques" element={<Navigate to="/rejoindre" replace />} />
        <Route path="contact" element={<Navigate to="/rejoindre#contact" replace />} />
        <Route path="actualite" element={<Navigate to="/mag" replace />} />
        <Route path="calendrier" element={<Navigate to="/competitions" replace />} />
        <Route path="records" element={<Navigate to="/athletes?tab=records" replace />} />

        {/* Pages internes (accès direct + réutilisées par les hubs). `/galerie`
            reste une route RÉELLE et non une redirection : ses pages profondes
            (albums, édition de média) en dépendent. */}
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/admin" element={<BlogAdminPage />} />
        <Route path="blog/nouveau" element={<BlogEditorPage />} />
        <Route path="blog/:slug" element={<BlogDetailPage />} />
        <Route path="blog/:slug/modifier" element={<BlogEditPage />} />
        <Route path="athletes/:id" element={<AthleteDetailPage />} />
        <Route path="galerie" element={<GalleryPage />} />
        <Route path="galerie/admin" element={<GalleryAdminPage />} />
        <Route path="galerie/nouveau" element={<MediaUploadPage />} />
        <Route path="galerie/albums/:id" element={<AlbumDetailPage />} />
        <Route path="galerie/media/:id/modifier" element={<MediaEditPage />} />
        <Route path="*" element={<NotFound title="Page introuvable" message="Cette page n'existe pas." />} />
      </Route>
    </Routes>
  )
}

export default App
