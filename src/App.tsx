import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { NotFound } from './components/ui/Status'

/* ─── Chargement à la demande ──────────────────────────────────────────────────
   Les 18 pages étaient importées statiquement ici, donc réunies dans un unique
   bundle de 1,9 Mo : tout visiteur téléchargeait ET COMPILAIT l'éditeur Tiptap,
   l'export PDF (jsPDF) et les graphiques Recharts avant de voir l'accueil. Sur
   un téléphone milieu de gamme, compiler 1,9 Mo de JavaScript bloque le thread
   principal une à trois secondes. C'est la moitié « premier chargement » de la
   lenteur constatée, l'autre étant la cascade d'animation (cf. motion.tsx).

   `HomePage` reste en import STATIQUE : c'est la page d'entrée du site, la
   différer ajouterait un aller-retour vers les États-Unis avant le premier
   pixel. Tout le reste part en morceaux séparés, chargés au clic. La frontière
   d'attente (`<Suspense>`) est dans `Layout`. */
const ClubPage = lazy(() => import('./pages/ClubPage').then((m) => ({ default: m.ClubPage })))
const RejoindrePage = lazy(() =>
  import('./pages/RejoindrePage').then((m) => ({ default: m.RejoindrePage })),
)
const MagPage = lazy(() => import('./pages/MagPage').then((m) => ({ default: m.MagPage })))
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const AthletesPage = lazy(() =>
  import('./pages/AthletesPage').then((m) => ({ default: m.AthletesPage })),
)
const AthleteDetailPage = lazy(() =>
  import('./pages/AthleteDetailPage').then((m) => ({ default: m.AthleteDetailPage })),
)
const BlogListPage = lazy(() =>
  import('./pages/BlogListPage').then((m) => ({ default: m.BlogListPage })),
)
const BlogDetailPage = lazy(() =>
  import('./pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })),
)
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })),
)
const AlbumDetailPage = lazy(() =>
  import('./pages/AlbumDetailPage').then((m) => ({ default: m.AlbumDetailPage })),
)
// Pages d'ADMINISTRATION : elles tirent l'éditeur Tiptap, jsPDF et les
// formulaires d'upload, et ne sont liées depuis aucune navigation. Un visiteur
// ne doit jamais en télécharger une ligne.
const BlogAdminPage = lazy(() =>
  import('./pages/BlogAdminPage').then((m) => ({ default: m.BlogAdminPage })),
)
const BlogEditorPage = lazy(() =>
  import('./pages/BlogEditorPage').then((m) => ({ default: m.BlogEditorPage })),
)
const BlogEditPage = lazy(() =>
  import('./pages/BlogEditPage').then((m) => ({ default: m.BlogEditPage })),
)
const GalleryAdminPage = lazy(() =>
  import('./pages/GalleryAdminPage').then((m) => ({ default: m.GalleryAdminPage })),
)
const MediaUploadPage = lazy(() =>
  import('./pages/MediaUploadPage').then((m) => ({ default: m.MediaUploadPage })),
)
const MediaEditPage = lazy(() =>
  import('./pages/MediaEditPage').then((m) => ({ default: m.MediaEditPage })),
)

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
