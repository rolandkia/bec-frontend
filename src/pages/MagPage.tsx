import { Link } from 'react-router-dom'
import { SquarePen } from 'lucide-react'
import { HERO_MAG } from '../data/pageHeroes'
import { BlogListPage } from './BlogListPage'
import { GalleryPage } from './GalleryPage'
import { PageHero, type HeroPhoto } from '../components/layout/PageHero'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'articles', label: 'Articles' },
  { key: 'galerie', label: 'Galerie' },
]

/** Administration de l'onglet affiché (pages non protégées, cf. README). */
const ADMIN: Record<string, { to: string; label: string }> = {
  articles: { to: '/blog/admin', label: 'Gérer les articles' },
  galerie: { to: '/galerie/admin', label: 'Gérer la galerie' },
}

/**
 * Le bandeau alterne sur les trois mots du sur-titre : « récits, portraits,
 * albums ». Une course, une athlète, un groupe — un registre par photo.
 *
 * Que des photos en PAYSAGE, à sujet horizontal : sur ordinateur le bandeau est
 * un ruban de 3:1 (1 470 × 500 px sur un portable, 3,3:1 sur un écran de 1 920),
 * et `object-cover` n'y montre que le tiers de la hauteur d'une photo carrée.
 * L'ancienne ouverture (podium-02, 1 200 × 1 248) n'y gardait qu'un visage,
 * agrandi 2,5 fois sur un écran Retina : flou, et littéralement dans la figure.
 */
const HERO_PHOTOS: HeroPhoto[] = [
  // Le départ d'un 100 m, six athlètes qui sortent des blocs : le récit d'une
  // course en une image, et un mouvement qui court sur toute la largeur. À 30 %,
  // toutes les têtes restent dans le ruban, mains et blocs compris.
  { src: HERO_MAG, focus: 'center 30%' },
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
  const admin = ADMIN[tab] ?? ADMIN.articles

  return (
    <div>
      <PageHero
        eyebrow="Récits, portraits, albums"
        title={['Le Mag']}
        subtitle="Ce qui se passe au club, raconté par le club."
        photos={HERO_PHOTOS}
      />
      <div>
        <SectionTabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
          // Outil des éditeurs du club, pas du public : sur la ligne des
          // onglets plutôt qu'un bouton plein sur sa propre rangée. Icône seule
          // au téléphone (cible de 44 px), libellé dès `sm` ; le libellé reste
          // le nom accessible dans les deux cas (`sr-only`).
          aside={
            <Link
              to={admin.to}
              className="tap inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[color:var(--color-muted)] transition-colors hover-hover:text-[color:var(--color-fg)]"
            >
              <SquarePen className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{admin.label}</span>
            </Link>
          }
        />
        {tab === 'galerie' ? <GalleryPage embedded /> : <BlogListPage embedded />}
      </div>
    </div>
  )
}
