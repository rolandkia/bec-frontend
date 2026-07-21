// Partenaires du club + explication de l'intérêt des partenariats.
// Contenu éditorial statique. Déposez les logos dans `public/partenaires/`
// puis renseignez `logo: '/partenaires/mon-logo.png'`.

export type Partenaire = {
  nom: string
  logo: string
  url?: string
  description?: string
}

// Le « pourquoi » des partenariats, affiché en tête de la section.
export const partenairesIntro =
  "Un club associatif comme le nôtre ne vit pas uniquement des cotisations. Le soutien de partenaires — collectivités, entreprises locales et équipementiers — nous permet de financer le matériel technique, d'alléger le coût des licences pour les familles, d'organiser les déplacements en compétition et d'encadrer nos jeunes dans les meilleures conditions. En retour, nous offrons à nos partenaires une visibilité auprès d'une communauté sportive engagée et la fierté de soutenir le sport et la jeunesse du territoire."

// TODO: ajouter les partenaires réels (logo déposé dans public/partenaires/).
export const partenaires: Partenaire[] = [
  // Exemple :
  // { nom: 'Ville de Bordeaux', logo: '/partenaires/ville-bordeaux.png', url: 'https://www.bordeaux.fr' },
]
