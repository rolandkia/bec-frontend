import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../api/athletes'
import { STATIC_DATA } from '../api/staleTime'
import { AthletesListPage } from './AthletesListPage'
import { RecordsPage } from './RecordsPage'
import { PageHero } from '../components/layout/PageHero'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'effectif', label: 'Effectif' },
  { key: 'records', label: 'Records' },
]

export type Sexe = 'tous' | 'homme' | 'femme'
const SEXES: readonly Sexe[] = ['tous', 'homme', 'femme']

/**
 * Un DÉCOR par vue. Les onglets et le filtre ne changent pas seulement une
 * liste : ils changent de photo, de sur-titre et d'accroche, et `Chapter` fait
 * le fondu enchaîné entre deux clichés (cf. motion.tsx).
 *
 * Les quatre photos sont choisies pour ce qu'elles racontent de la vue, pas
 * pour faire jolie : le groupe au complet pour l'effectif entier, le portrait
 * studio des athlètes féminines pour « Femmes », le relais pour « Hommes », et
 * les blocs de départ pour les records — la seconde qui précède le chrono.
 */
const SCENES = {
  effectif: {
    tous: {
      eyebrow: "L'effectif",
      // Le club au complet aux interclubs 2025 : ciel bleu franc, l'effectif
      // entier agenouillé en maillot, et un athlète qui brandit le drapeau
      // du club face à lui. C'est la photo qui dit « effectif » le plus
      // directement de toute la bibliothèque.
      //
      // La source est en PORTRAIT (1200×1600), inutilisable telle quelle dans un
      // bandeau paysage : elle est recadrée en 16/9 sur sa bande centrale avant
      // conversion (commande exacte dans public/photos/README.md). Le tiers de
      // ciel vide du haut et le tiers de pelouse vide du bas partent — ce sont
      // eux qui écrasaient le sujet.
      //
      // `50%` et non le `40%` de la photo précédente : le bandeau est plus large
      // que le 16/9 du fichier sur grand écran, `object-cover` rogne donc encore
      // en hauteur. À 40 % on gardait une bande de ciel vide en haut et le
      // premier rang du groupe tombait dans la partie la plus voilée ; à 50 % le
      // drapeau reste entier en diagonale et le groupe remonte là où le voile
      // est le plus léger.
      photo: { src: '/photos/interclub-drapeau-wide.webp', focus: 'center 50%' },
      veil: 'strong',
    },
    homme: {
      eyebrow: 'Les hommes du club',
      photo: { src: '/photos/gallery/group-4.webp', focus: 'center 35%' },
      veil: 'strong',
    },
    femme: {
      eyebrow: 'Les femmes du club',
      // Haut de l'image : les six visages sont tous dans le tiers supérieur, et
      // c'est le seul cadrage qui n'en rogne aucun sur un hero en paysage.
      photo: { src: '/photos/gallery/group-7.webp', focus: 'center 10%' },
      // Studio clair de bout en bout : aucun dégradé ne sauve le texte, il faut
      // le voile uniforme (cf. <Chapter>, même cas que le studio de /rejoindre).
      veil: 'flat',
    },
  },
  records: {
    eyebrow: 'Les meilleures performances du club',
    photo: { src: '/photos/gallery/start-2.webp', focus: 'center 40%' },
    veil: 'strong',
  },
} as const

/**
 * Hub « Athlètes » : l'effectif et les records du club sont deux vues des mêmes
 * données de performance (les noms du tableau de records pointent d'ailleurs vers
 * `/athletes/:id`). Les records vivaient auparavant sous « Compétitions », qui ne
 * porte plus que le calendrier.
 */
export function AthletesPage() {
  const [tab, setTab] = useTabParam('effectif')
  const isRecords = tab === 'records'

  // Le filtre homme/femme vit dans l'URL (`?sexe=femme`) et non en état local :
  // il pilote maintenant la PHOTO du hero, donc la vue doit être partageable et
  // survivre à un rechargement. `scrollTop: false` : contrairement à un onglet,
  // affiner une liste ne doit pas téléporter le lecteur en haut de page.
  const [rawSexe, setSexe] = useTabParam('tous', 'sexe', { scrollTop: false })
  // Repli auto-réparant sur une valeur d'URL inconnue (cf. RecordsPage).
  const sexe: Sexe = SEXES.includes(rawSexe as Sexe) ? (rawSexe as Sexe) : 'tous'

  // Même clé de requête que <AthletesListPage> : le compte est gratuit (cache).
  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: listAthletes,
    staleTime: STATIC_DATA,
  })

  // Les photos des vues non affichées sont préchargées APRÈS le premier rendu :
  // sans ça le tout premier fondu partirait sur une image encore en vol, et
  // l'enchaînement se verrait. ~160 ko au total, après le LCP.
  //
  // Ici c'est un préchargement GROUPÉ, contrairement au roulement de <PageHero> :
  // la vue suivante n'est pas prévisible (c'est un clic sur un onglet ou un
  // filtre, pas un minuteur), donc il faut les trois d'avance.
  useEffect(() => {
    for (const { src } of [
      SCENES.effectif.homme.photo,
      SCENES.effectif.femme.photo,
      SCENES.records.photo,
    ]) {
      new Image().src = src
    }
  }, [])

  const scene = isRecords ? SCENES.records : SCENES.effectif[sexe]

  const count = athletes?.filter((a) => sexe === 'tous' || a.sexe === sexe).length
  const effectifSubtitle =
    count === undefined
      ? undefined
      : sexe === 'femme'
        ? `${count} athlètes féminines licenciées, du premier cross à la finale nationale.`
        : sexe === 'homme'
          ? `${count} athlètes masculins licenciés, du premier cross à la finale nationale.`
          : `${count} athlètes licenciés, du premier cross à la finale nationale.`

  return (
    <div>
      {/* Le sur-titre passe en OR sur l'onglet Records : ce sont les meilleures
          performances du club, c'est exactement ce que l'or signale. */}
      <PageHero
        eyebrow={scene.eyebrow}
        title={isRecords ? ['Records'] : ['Athlètes']}
        subtitle={
          isRecords
            ? 'Le meilleur chrono jamais réalisé sous les couleurs du club, discipline par discipline.'
            : effectifSubtitle
        }
        // Un seul élément : sur cette page la photo est choisie par l'onglet et
        // le filtre, pas par un minuteur. Aucune rotation ici.
        photos={[scene.photo]}
        veil={scene.veil}
        tone={isRecords ? 'gold' : 'red'}
      />

      <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

      {isRecords ? (
        // Un classement est toujours par sexe : « Tous » n'y a pas de sens, on
        // retombe sur « Hommes » sans réécrire l'URL (le filtre reste celui du
        // hub, donc revenir à l'effectif conserve le choix du visiteur).
        <RecordsPage embedded sexe={sexe === 'tous' ? 'homme' : sexe} onSexeChange={setSexe} />
      ) : (
        <AthletesListPage embedded sexe={sexe} onSexeChange={setSexe} />
      )}
    </div>
  )
}
