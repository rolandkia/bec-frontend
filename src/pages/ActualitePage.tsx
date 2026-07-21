import { BlogListPage } from './BlogListPage'
import { GalleryPage } from './GalleryPage'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'articles', label: 'Articles' },
  { key: 'galerie', label: 'Galerie' },
]

export function ActualitePage() {
  const [tab, setTab] = useTabParam('articles')

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-6 text-3xl">Actualité</h1>
      <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'galerie' ? <GalleryPage embedded /> : <BlogListPage embedded />}
    </div>
  )
}
