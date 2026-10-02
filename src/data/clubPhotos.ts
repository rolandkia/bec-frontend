/**
 * Photos club curées (statiques, servies depuis `public/photos/gallery/*.webp`).
 *
 * COLLECTION COMPLÈTE : toutes les photos de `bec-pictures/`, regroupées par
 * thème (interclub, starting-block, course, podium, groupe, concentration,
 * portrait) et optimisées en `.webp` (`cwebp -q 72 -resize 1500 0`). Ce sont des ASSETS
 * front-end — distincts des médias de la galerie back-end (upload → Cloudinary).
 * Alimente la bande « Le club en mouvement » (accueil) et la section « Le club
 * en images » (galerie), avec la visionneuse (Lightbox). L'ordre est entrelacé
 * pour varier les thèmes à l'affichage.
 */
export interface ClubPhoto {
  src: string
  alt: string
  legende: string
  /**
   * Forme de la tuile dans la mosaïque « Le club en images » (GalleryPage) :
   * `feature` 2 × 2, `tall` 2 lignes (photo en PORTRAIT), `wide` 2 colonnes dès
   * `sm` (photo PANORAMIQUE, 1,85:1 et plus). Sans valeur : tuile simple. La
   * bande de l'accueil l'ignore.
   *
   * La mosaïque se remplit en `grid-flow-dense` : elle n'a AUCUN trou tant que
   * son nombre de cases tombe juste. Avec f `feature`, t `tall`, w `wide` et
   * n tuiles simples, il faut que
   *   - 4f + 2t + 2w + n soit un multiple de 12 (3 et 4 colonnes),
   *   - 4f + 2t +  w + n soit pair (2 colonnes, où `wide` redevient simple).
   * Aujourd'hui 4 / 7 / 4 / 22 : 60 cases, et 56 au téléphone. En ajoutant une
   * photo, rééquilibrer avec ces formes plutôt que de laisser un trou en bas.
   */
  tile?: 'feature' | 'tall' | 'wide'
}

const P = '/photos/gallery'

export const clubPhotos: ClubPhoto[] = [
  // Les interclubs OUVRENT la collection : ce sont les seules photos où le club
  // apparaît AU COMPLET, et de loin les plus émotionnelles (fumigènes, blason
  // brandi, tout le monde en rouge). Elles portent l'« esprit d'équipe » que les
  // photos individuelles ne peuvent pas raconter.
  {
    src: `${P}/interclub-1.webp`,
    alt: "L'équipe du BEC célébrant les interclubs, fumigènes rouge et or",
    legende: 'Interclubs : la victoire ensemble',
    tile: 'feature',
  },
  {
    src: `${P}/interclub-2.webp`,
    alt: 'Un athlète du BEC brandissant le drapeau du club devant le groupe',
    legende: 'Interclubs : le drapeau',
    tile: 'tall',
  },
  {
    src: `${P}/group-11.webp`,
    alt: 'Sept athlètes du club en tenue rouge, portrait de groupe en studio',
    legende: 'Le collectif',
  },

  { src: `${P}/start-1.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-1.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-1.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-1.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-1.webp`, alt: 'Athlète concentré avant la course', legende: 'Concentration' },
  { src: `${P}/portrait-1.webp`, alt: "Portrait d'un athlète du club", legende: 'Portrait' },

  { src: `${P}/start-2.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-2.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-2.webp`, alt: 'Célébration sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-2.webp`, alt: 'Le groupe du club', legende: "L'équipe", tile: 'feature' },
  { src: `${P}/concentration-2.webp`, alt: 'Concentration avant le départ', legende: 'Concentration', tile: 'tall' },

  { src: `${P}/start-3.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs', tile: 'wide' },
  { src: `${P}/race-3.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-3.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-3.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-3.webp`, alt: 'Athlète concentré', legende: 'Concentration', tile: 'tall' },

  { src: `${P}/start-4.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs', tile: 'tall' },
  { src: `${P}/race-4.webp`, alt: 'Athlète en pleine course', legende: 'En course', tile: 'tall' },
  { src: `${P}/podium-4.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium', tile: 'feature' },
  { src: `${P}/group-4.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-4.webp`, alt: 'Athlète concentré', legende: 'Concentration', tile: 'wide' },

  { src: `${P}/start-5.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs', tile: 'wide' },
  { src: `${P}/race-5.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-5.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-5.webp`, alt: 'Le groupe du club', legende: "L'équipe", tile: 'wide' },
  { src: `${P}/concentration-5.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/race-6.webp`, alt: 'Athlète en pleine course', legende: 'En course', tile: 'tall' },
  { src: `${P}/podium-6.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-6.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-6.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/group-7.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  // Ni group-8 ni group-9 : copies binaires (md5 identique) de group-10 et
  // group-11, qui apparaissaient donc deux fois dans la galerie comme dans la
  // bande de l'accueil. group-8 reste le fichier du bandeau de /club.

  {
    src: `${P}/interclub-3.webp`,
    alt: 'Le groupe du BEC réuni sur la pelouse du stade après les interclubs',
    legende: 'Interclubs : après la dernière course',
    tile: 'tall',
  },
  {
    src: `${P}/group-10.webp`,
    alt: 'Le club réuni lors de la soirée annuelle',
    legende: 'La vie du club',
    tile: 'feature',
  },
  {
    src: `${P}/portrait-2.webp`,
    alt: 'Jeune athlète du club, sa médaille entre les dents',
    legende: 'La relève',
  },
]
