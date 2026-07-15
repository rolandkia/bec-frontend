import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { CoachesPage } from './pages/CoachesPage'
import { CalendarPage } from './pages/CalendarPage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { RecordsPage } from './pages/RecordsPage'
import { AthletesListPage } from './pages/AthletesListPage'
import { AthleteDetailPage } from './pages/AthleteDetailPage'
import { NotFound } from './components/ui/Status'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="coachs" element={<CoachesPage />} />
        <Route path="calendrier" element={<CalendarPage />} />
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/:slug" element={<BlogDetailPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="athletes" element={<AthletesListPage />} />
        <Route path="athletes/:id" element={<AthleteDetailPage />} />
        <Route path="*" element={<NotFound title="Page introuvable" message="Cette page n'existe pas." />} />
      </Route>
    </Routes>
  )
}

export default App
