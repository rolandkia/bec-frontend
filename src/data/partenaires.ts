// Partenaires du club, « pourquoi » du partenariat et besoins de financement.
// Contenu éditorial statique. Déposez les logos dans `public/partenaires/` puis
// renseignez `logo: '/partenaires/mon-logo.webp'`.

export type Partenaire = {
  nom: string
  logo: string
  url?: string
  /** Rendu sur /club (`components/club/PartenaireCard`), pas sur l'accueil qui
   *  ne montre que la plaque logo. */
  description?: string
  /**
   * Fond de la plaque qui porte le logo.
   *  - `'clair'` (défaut) : plaque blanche. C'est le cas courant — un logo
   *    d'entreprise est dessiné pour du papier, ses tracés sombres
   *    disparaîtraient sur nos surfaces noires.
   *  - `'sombre'` : le logo est déjà clair (blanc sur fond noir, ou clair sur
   *    transparent). On le laisse sur la surface du site, une plaque blanche
   *    l'effacerait.
   */
  logoFond?: 'clair' | 'sombre'
}

/** Version longue — en tête de la section « Nos partenaires » de /club. */
export const partenairesIntro =
  "Un club associatif ne vit pas uniquement des cotisations. Le soutien de partenaires — " +
  "entreprises locales, collectivités, équipementiers — nous permet de financer le matériel " +
  "technique, d'alléger le coût des licences pour les familles, d'organiser les déplacements " +
  "en compétition et d'encadrer nos jeunes dans les meilleures conditions. En retour, nous " +
  "offrons à nos partenaires une visibilité auprès d'une communauté sportive engagée et la " +
  'fierté de soutenir le sport et la jeunesse du territoire.'

/**
 * Version courte — teaser de l'accueil, où le paragraphe long faisait un pavé.
 * Porte l'essentiel : le club CHERCHE des partenaires. Le détail de ce que ça
 * finance est porté juste à côté par `besoinsCourts`.
 */
export const partenairesAccroche =
  'Le club cherche de nouveaux partenaires. Entreprises, collectivités, équipementiers : ' +
  'votre soutien finance directement le quotidien de nos athlètes, et vous donne une ' +
  "visibilité auprès d'une communauté sportive engagée."

/**
 * Ce à quoi sert concrètement un partenariat — affiché sous les partenaires sur
 * /club. Texte officiel du club (sa page « Partenaires ») : ne pas reformuler
 * sans son accord, et penser à faire glisser la saison chaque année.
 */
export const besoinsClub: string[] = [
  'Financement des déplacements et stages pour les athlètes de haut niveau (compétitions nationales et internationales).',
  "Achat d'équipements sportifs (matériel d'entraînement, tenues du club).",
  "Soutien à l'École d'Athlétisme, pour l'encadrement des 40 licenciés (et plus) du club pour la saison 2025/2026.",
  "Aide à l'organisation d'événements (meeting, compétition de cross, etc.).",
]

/**
 * Les mêmes besoins que `besoinsClub`, en libellés courts — la version longue
 * (texte officiel du club, verbatim) fait quatre cartes de trois lignes,
 * ingérable dans une colonne de l'accueil. Les deux listes doivent rester
 * alignées : si le club réécrit `besoinsClub`, répercuter ici.
 */
export const besoinsCourts: string[] = [
  'Déplacements et stages des athlètes',
  "Matériel d'entraînement et tenues",
  "École d'athlétisme (40 licenciés)",
  'Organisation de meetings et de cross',
]

export const partenaires: Partenaire[] = [
  {
    nom: 'Kiné Concept Sport',
    logo: '/partenaires/kine-concept-sport.webp',
    // Monogramme blanc sur carré noir : il se fond dans nos surfaces, une plaque
    // blanche le rendrait invisible.
    logoFond: 'sombre',
    // Pas d'`url` : le club ne publie aucun lien vers leur site.
    description:
      "Installé au cœur de la zone d'activité de Pessac, Kiné Concept Sport est un centre " +
      "moderne dédié à la rééducation du sportif et à l'optimisation de la performance. Que ce " +
      'soit pour de la prévention, des soins post-traumatiques ou du suivi de haut niveau, ' +
      "l'équipe met son expertise au service des athlètes de tous horizons.",
  },
]
