/**
 * Photos club curées (statiques, servies depuis `public/photos/gallery/*.webp`).
 *
 * COLLECTION COMPLÈTE : toutes les photos de `bec-pictures/`, regroupées par
 * thème (starting-block, course, podium, groupe, concentration, portrait) et
 * optimisées en `.webp` (`cwebp -q 72 -resize 1500 0`). Ce sont des ASSETS
 * front-end — distincts des médias de la galerie back-end (upload → Cloudinary).
 * Alimente la bande « Le club en mouvement » (accueil) et la section « Le club
 * en images » (galerie), avec la visionneuse (Lightbox). L'ordre est entrelacé
 * pour varier les thèmes à l'affichage.
 */
export interface ClubPhoto {
  src: string
  alt: string
  legende: string
}

const P = '/photos/gallery'

export const clubPhotos: ClubPhoto[] = [
  { src: `${P}/start-1.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-1.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-1.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-1.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-1.webp`, alt: 'Athlète concentré avant la course', legende: 'Concentration' },
  { src: `${P}/portrait-1.webp`, alt: "Portrait d'un athlète du club", legende: 'Portrait' },

  { src: `${P}/start-2.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-2.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-2.webp`, alt: 'Célébration sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-2.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-2.webp`, alt: 'Concentration avant le départ', legende: 'Concentration' },

  { src: `${P}/start-3.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-3.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-3.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-3.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-3.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/start-4.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-4.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-4.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-4.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-4.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/start-5.webp`, alt: 'Athlète dans les starting-blocks', legende: 'Dans les blocs' },
  { src: `${P}/race-5.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-5.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-5.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-5.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/race-6.webp`, alt: 'Athlète en pleine course', legende: 'En course' },
  { src: `${P}/podium-6.webp`, alt: 'Athlètes du club sur le podium', legende: 'Sur le podium' },
  { src: `${P}/group-6.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/concentration-6.webp`, alt: 'Athlète concentré', legende: 'Concentration' },

  { src: `${P}/group-7.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/group-8.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
  { src: `${P}/group-9.webp`, alt: 'Le groupe du club', legende: "L'équipe" },
]
