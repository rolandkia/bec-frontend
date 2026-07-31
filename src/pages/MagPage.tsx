import { BlogListPage } from './BlogListPage'
import { GalleryPage } from './GalleryPage'
import { PageHero } from '../components/layout/PageHero'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'articles', label: 'Articles' },
  { key: 'galerie', label: 'Galerie' },
]

/**
 * « Le Mag » — ex-/actualite. Hub à deux onglets : les articles du club et la
 * galerie photo. Renommé parce que « Actualité » promettait un flux daté alors
 * que le contenu est éditorial (récits de compétition, portraits, albums).
 * L'ancienne URL /actualite redirige ici, et /galerie ouvre l'onglet galerie.
 */
export function MagPage() {
  const [tab, setTab] = useTabParam('articles')

  return (
    <div>
      <PageHero
        eyebrow="Récits, portraits, albums"
        title={['Le Mag']}
        subtitle="Ce qui se passe au club, raconté par le club."
        image="/photos/podium-02.webp"
        focus="center 6%"
      />
      <div>
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'galerie' ? <GalleryPage embedded /> : <BlogListPage embedded />}
      </div>
    </div>
  )
}
