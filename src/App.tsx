import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { CoachesPage } from './pages/CoachesPage'
import { CalendarPage } from './pages/CalendarPage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogEditorPage } from './pages/BlogEditorPage'
import { BlogEditPage } from './pages/BlogEditPage'
import { BlogAdminPage } from './pages/BlogAdminPage'
import { RecordsPage } from './pages/RecordsPage'
import { AthletesListPage } from './pages/AthletesListPage'
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
        <Route path="coachs" element={<CoachesPage />} />
        <Route path="calendrier" element={<CalendarPage />} />
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/admin" element={<BlogAdminPage />} />
        <Route path="blog/nouveau" element={<BlogEditorPage />} />
        <Route path="blog/:slug" element={<BlogDetailPage />} />
        <Route path="blog/:slug/modifier" element={<BlogEditPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="athletes" element={<AthletesListPage />} />
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
