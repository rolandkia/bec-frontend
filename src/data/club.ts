export const club = {
  nom: 'Bordeaux Étudiants Club Athlétisme',
  sigle: 'BEC',
  accroche: "Le club d'athlétisme qui fait grandir chaque athlète, de l'initiation à la haute performance.",
  // 1897 = fondation du Bordeaux Université Club ; 1903 = le club se réorganise
  // autour des étudiants et prend son nom actuel. Le club communique « depuis
  // 1897 » : on retient la même date d'origine et on explique l'étape de 1903,
  // plutôt que de la contredire (même position dans `data/palmares.ts`).
  histoire:
    "Né en 1897 sous le nom de Bordeaux Université Club, le club prend en 1903 celui de " +
    "Bordeaux Étudiants Club, à l'initiative de Paul Fournial, pour devenir le club des " +
    "étudiants bordelais, le doyen des clubs universitaires français. Plus d'un siècle plus " +
    "tard, la section athlétisme réunit des athlètes de tous niveaux, du loisir à la " +
    "compétition nationale, autour d'un encadrement technique exigeant et bienveillant.",
  // Les quatre valeurs affichées par le club. Les intitulés sont les siens, repris
  // mot pour mot ; il ne publie pas de description, celles-ci ont été rédigées pour
  // le site — le rendu de l'accueil attend un texte à côté du numéral.
  valeurs: [
    {
      titre: "Esprit d'équipe et plaisir",
      description:
        "On court seul sur la piste, jamais seul au club : on s'entraîne, on se déplace et on progresse en groupe, avec le plaisir comme moteur.",
    },
    {
      titre: 'Respect et solidarité',
      description:
        "Respect des entraîneurs, des adversaires, des officiels et du matériel. Et entre nous, l'entraide avant la comparaison, quel que soit le niveau.",
    },
    {
      titre: 'Partage et transmission',
      description:
        "Les anciens transmettent aux plus jeunes, les entraîneurs forment autant qu'ils encadrent. C'est ce qui fait tenir un club depuis plus d'un siècle.",
    },
    {
      titre: "Le goût de l'effort et la persévérance",
      description:
        'Le chrono ne ment pas : progresser demande de la régularité, de la patience et une envie intacte de revenir à chaque entraînement.',
    },
  ],
  // Pas de « chiffres clés » ici : les valeurs affichées sur l'accueil
  // (athlètes / disciplines / coachs) étaient inventées et contredisaient le
  // compteur réel de /athletes, qui vient de l'API. L'accueil met désormais en
  // avant le palmarès du club (`data/palmares.ts`), fait de dates vérifiables.
  contact: {
    adresse: "Piste d'athlétisme de Rocquencourt, 8 rue Lucie Aubrac, 33600 Pessac",
    // Adresse publique du club, affichée sur le site. Sans rapport avec la
    // destination du formulaire de contact, qui vient de `MAIL_TO` côté backend
    // (`bec-backend/src/services/mail_service.py`) — la changer ici ne modifie
    // pas qui reçoit les demandes.
    email: 'becathletisme@gmail.com',
    telephone: '06 83 02 48 32',
    /** Format international sans espaces : c'est ce que `tel:` attend. */
    telephoneLien: 'tel:+33683024832',
  },
}

/** Identifie le réseau et sélectionne son glyphe dans `ui/SocialLinks`. */
export type ReseauId = 'instagram' | 'facebook' | 'linkedin' | 'tiktok'

/** Comptes officiels du club, dans l'ordre d'affichage. */
export const reseaux: { id: ReseauId; nom: string; url: string }[] = [
  { id: 'instagram', nom: 'Instagram', url: 'https://www.instagram.com/bec_athletisme' },
  { id: 'facebook', nom: 'Facebook', url: 'https://www.facebook.com/becathletisme/?locale=fr_FR' },
  { id: 'linkedin', nom: 'LinkedIn', url: 'https://www.linkedin.com/in/bec-athl%C3%A9tisme-b7a02539a/' },
  { id: 'tiktok', nom: 'TikTok', url: 'https://www.tiktok.com/@bec_athletisme' },
]
