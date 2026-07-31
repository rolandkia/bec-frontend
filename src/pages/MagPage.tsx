import { BlogListPage } from './BlogListPage'
import { GalleryPage } from './GalleryPage'
import { PageHero, type HeroPhoto } from '../components/layout/PageHero'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'articles', label: 'Articles' },
  { key: 'galerie', label: 'Galerie' },
]

/**
 * Le bandeau alterne sur les trois mots du sur-titre : « récits, portraits,
 * albums ». Un podium, une course, un groupe — un registre par photo.
 */
const HERO_PHOTOS: HeroPhoto[] = [
  // Pancartes « VICTOIRE » et « RECORD PERSO » : le récit, en une image.
  { src: '/photos/podium-02.webp', focus: 'center 6%' },
  { src: '/photos/gallery/race-2.webp', focus: 'center 10%' },
  // Le groupe sur la pelouse, plein soleil : la page d'album. Même contrainte que
  // group-2 sur /club — têtes à 3 % du bord haut, donc pas plus de 5 %.
  { src: '/photos/gallery/group-3.webp', focus: 'center 4%' },
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
        photos={HERO_PHOTOS}
      />
      <div>
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'galerie' ? <GalleryPage embedded /> : <BlogListPage embedded />}
      </div>
    </div>
  )
}
