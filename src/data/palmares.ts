/**
 * Histoire et palmarès du BEC Athlétisme — contenu éditorial statique.
 *
 * Sources : palmarès officiel du club (bec-bordeaux.fr/palmares), Wikipédia FR
 * (Bordeaux Étudiants Club, Colette Besson, Patrick Bourbeillon, Frédéric
 * Krantz, Clément Ducos) et les fiches FFA (athle.fr).
 *
 * RÈGLE DE CONTENU : uniquement des faits datés et vérifiables. Pas de total
 * global (« X internationaux », « Y titres ») : ces chiffres circulent sur le
 * web sans source fiable, et c'est exactement le travers qu'on a retiré de
 * l'accueil en supprimant les anciens « chiffres clés ».
 *
 * Deux corrections assumées par rapport au palmarès publié par le club :
 *  - la médaille d'argent de Frédéric Krantz est datée 1997 côté club, mais les
 *    championnats d'Europe de Budapest ont eu lieu en 1998 ;
 *  - le quatrième relayeur de 1969 est Alain Sarteur (et non « Sauteur »).
 *
 * TODO : compléter avec les archives du club (années 1950-1960, section
 * féminine). Le volet photo est amorcé : un cliché d'archive de 1968 alimente
 * désormais l'encart Colette Besson (cf. `figureHistorique`).
 */

export type FaitPalmares = {
  /** '1968' ou une période '1923-1935'. Sert de libellé dans la frise. */
  annee: string
  discipline: string
  titre: string
  /** Absent pour les faits collectifs (fondation du club, création d'une épreuve). */
  athlete?: string
  detail?: string
  /** Niveau international (JO, championnats d'Europe) → nœud et titre en OR. */
  majeur?: boolean
}

/**
 * Portrait éditorial d'une figure du club — les encarts qui ouvrent /palmares
 * (`components/club/FigureCard`). Deux aujourd'hui : la championne olympique de
 * 1968 et le finaliste olympique de 2024.
 */
export type FigurePortrait = {
  nom: string
  discipline: string
  badge: string
  /** `ffa_id` athle.fr (cf. `utils/ffa.ts`). Absent pour les figures dont la
   *  carrière est antérieure aux fiches en ligne → pas de bouton « Profil FFA ». */
  ffaId?: string
  wikipedia: string
  photo: string
  photoAlt: string
  /** `object-position` du cliché : le sujet n'est pas toujours centré. */
  photoPosition?: string
  texte: string
  faits: string[]
}

/** Paragraphe d'introduction de la page /palmares. */
export const histoireIntro =
  "Le BEC n'est pas un club récent. Fondé en 1903 par Paul Fournial pour donner aux " +
  "étudiants bordelais un club à eux, il est le doyen des clubs universitaires français. " +
  "Dès 1905, Henri Gutierrez décroche un titre national au saut en longueur ; dans les " +
  "années 1920 et 1930, Gabriel Sempé enchaîne neuf titres consécutifs sur 110 m haies. " +
  "Le 16 octobre 1968, à Mexico, Colette Besson devient championne olympique du 400 m, " +
  "la seule médaille d'or française de l'athlétisme de ces Jeux. L'année suivante, Patrick " +
  "Bourbeillon est champion d'Europe du 4 × 100 m à Athènes. Trente ans plus tard, Frédéric " +
  "Krantz ramène l'argent de Budapest. Et en 2024, Clément Ducos court la finale olympique " +
  "du 400 m haies. Un siècle plus tard, la même exigence."

/** Faits marquants, du plus ancien au plus récent (ordre d'affichage de la frise). */
export const faitsPalmares: FaitPalmares[] = [
  {
    annee: '1903',
    discipline: 'Fondation',
    titre: 'Naissance du Bordeaux Étudiants Club',
    detail:
      "Issu du Bordeaux Université Club (1897), le BEC devient un club réservé aux étudiants, " +
      'à l\'initiative de Paul Fournial. C\'est aujourd\'hui le doyen des clubs universitaires français.',
  },
  {
    annee: '1904',
    discipline: 'Cross et piste',
    titre: 'Création du challenge Saint-Marc et Barrès',
    detail:
      "D'abord un cross, l'épreuve s'ouvre ensuite à toutes les disciplines de l'athlétisme et " +
      "installe le club au centre de l'athlétisme bordelais.",
  },
  {
    annee: '1905',
    discipline: 'Saut en longueur',
    titre: 'Champion de France',
    athlete: 'Henri Gutierrez',
    detail: 'Premier international du club.',
  },
  {
    annee: '1923-1935',
    discipline: '110 m haies',
    titre: 'Neuf titres consécutifs de champion de France',
    athlete: 'Gabriel Sempé',
    detail: 'Treize saisons de domination sur les haies hautes françaises.',
  },
  {
    annee: '1933',
    discipline: '400 m',
    titre: 'Champion de France',
    athlete: 'Pierre Stawinski',
  },
  {
    annee: '1936',
    discipline: '4 × 100 m',
    titre: 'Champions de France du relais',
    athlete: 'Carlton, Marjou, Jourdian, Stawinski',
  },
  {
    annee: '1938',
    discipline: '110 m haies et 200 m',
    titre: 'Double champion de France',
    athlete: 'Pierre Jourdian',
  },
  {
    annee: '1941-1946',
    discipline: 'Sprint',
    titre: 'Titres de championne de France sur les sprints',
    athlete: 'Jeannine Toulouse',
    detail:
      "La section féminine du club domine les sprints nationaux pendant la guerre et l'immédiat " +
      "après-guerre : Monique Drilhon enlève le 100 m et le 200 m en 1943.",
  },
  {
    annee: '1968',
    discipline: '400 m',
    titre: 'Championne olympique à Mexico',
    athlete: 'Colette Besson',
    detail:
      "52 s 03, record d'Europe, et seule médaille d'or française de l'athlétisme à ces Jeux. " +
      'Licenciée au BEC, entraînée par Yves Durand Saint-Omer.',
    majeur: true,
  },
  {
    annee: '1969',
    discipline: '4 × 100 m',
    titre: "Champions d'Europe à Athènes",
    athlete: 'Patrick Bourbeillon',
    detail: 'Avec Alain Sarteur, Gérard Fenouil et François Saint-Gilles, en 38 s 8.',
    majeur: true,
  },
  {
    annee: '1970',
    discipline: 'Javelot',
    titre: 'Champion de France',
    athlete: 'Manuel Ibanez',
  },
  {
    annee: '1998',
    discipline: '4 × 100 m',
    titre: "Médaille d'argent aux championnats d'Europe de Budapest",
    athlete: 'Frédéric Krantz',
    detail: '38 s 90, avec Thierry Lubin, Christophe Cheval et Needy Guims.',
    majeur: true,
  },
  {
    annee: '2001',
    discipline: 'Sprint',
    titre: 'Titres de champion de France',
    athlete: 'Frédéric Krantz',
  },
  {
    annee: '2022',
    discipline: '400 m en salle',
    titre: 'Champion de France',
    athlete: 'Clément Ducos',
    detail: '47 s 27 à Miramas.',
  },
  {
    annee: '2024',
    discipline: '400 m haies',
    titre: '4ᵉ de la finale olympique à Paris',
    athlete: 'Clément Ducos',
    detail:
      "Qualifié pour la finale avec le 2ᵉ temps des séries, derrière le recordman du monde " +
      'Karsten Warholm. 47 s 42 de record personnel la même saison.',
    majeur: true,
  },
]

/**
 * Les trois jalons repris dans la bande teaser de l'accueil. Libellés courts :
 * ils vivent dans une colonne de ~110 px sur un téléphone.
 */
export const jalonsAccueil = [
  { annee: '1968', label: 'Championne olympique' },
  { annee: '1969', label: "Champions d'Europe" },
  { annee: '2024', label: 'Finaliste olympique' },
]

/** L'athlète qui prolonge ce palmarès aujourd'hui (encart « Aujourd'hui », en
 *  ouverture de /palmares, avant la partie historique). */
export const figureActuelle: FigurePortrait = {
  nom: 'Clément Ducos',
  discipline: '400 m haies',
  badge: 'Finaliste olympique 2024',
  /** `ffa_id` de sa fiche publique athle.fr — cf. `utils/ffa.ts`. */
  ffaId: '1781218',
  wikipedia: 'https://fr.wikipedia.org/wiki/Cl%C3%A9ment_Ducos',
  // C'est bien lui sur ce cliché de la photothèque du club (dossard
  // « CLEMENT DUCOS », maillot Tennessee, championnats NCAA) → vrai `alt`.
  photo: '/photos/race-portrait.webp',
  photoAlt: 'Clément Ducos franchit une haie aux championnats NCAA',
  photoPosition: 'center 20%',
  texte:
    "Né à Pessac en 2001, licencié au BEC, Clément Ducos a couru la finale du 400 m haies des " +
    "Jeux olympiques de Paris 2024, qualifié avec le deuxième temps des séries, derrière " +
    'Karsten Warholm. Le palmarès du club ne s\'écrit pas seulement au passé.',
  faits: [
    '4ᵉ de la finale olympique du 400 m haies (Paris 2024)',
    'Record personnel : 47 s 42 (Chorzów, 2024)',
    'Champion de France du 400 m en salle (Miramas 2022)',
    '5ᵉ performeur français de tous les temps sur 400 m haies',
  ],
}

/**
 * La plus grande championne de l'histoire du club (encart « 1968 », juste sous
 * l'encart « Aujourd'hui » : la page raconte ainsi les deux bouts du palmarès).
 * Pas de `ffaId` — sa carrière est antérieure aux fiches athle.fr.
 */
export const figureHistorique: FigurePortrait = {
  nom: 'Colette Besson',
  discipline: '400 m',
  badge: 'Championne olympique 1968',
  wikipedia: 'https://fr.wikipedia.org/wiki/Colette_Besson',
  // Cliché d'archive : elle porte le maillot du club (« BORDEAUX ÉTUDIANTS
  // CLUB », dossard 37), d'où le choix de celui-là plutôt que d'un portrait
  // sous maillot France — c'est une photo de contenu, donc vrai `alt`. Source
  // 320×480 : douce sur écran 2×, mais le grain passe pour de l'archive.
  photo: '/photos/besson-maillot-bec.webp',
  photoAlt: 'Colette Besson en maillot du Bordeaux Étudiants Club, dossard 37',
  photoPosition: 'center 20%',
  texte:
    "Le 16 octobre 1968, à Mexico, Colette Besson gagne le 400 m olympique en 52 s 03 : " +
    "record d'Europe, et la seule médaille d'or française de l'athlétisme de ces Jeux. Née en " +
    "1946 à Saint-Georges-de-Didonne, licenciée au BEC et entraînée par Yves Durand " +
    "Saint-Omer, elle revient d'Athènes l'année suivante avec deux médailles d'argent et deux " +
    "records du monde. Elle reste la plus grande championne de l'histoire du club.",
  faits: [
    "Championne olympique du 400 m (Mexico 1968), en 52 s 03 — record d'Europe",
    "Seule médaille d'or française de l'athlétisme des Jeux de 1968",
    "Double médaillée d'argent aux championnats d'Europe 1969 (Athènes) : 400 m en 51 s 7 et " +
      '4 × 400 m en 3 min 30 s 8, deux records du monde',
    'Championne de France du 400 m (1968, 1971, 1972) et du 800 m (1970, 1971)',
  ],
}
