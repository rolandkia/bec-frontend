export interface Coach {
  id: string
  nom: string
  prenom: string
  role: string
  disciplines: string[]
  bio: string
  photoUrl?: string
}

export const coaches: Coach[] = [
  {
    id: 'coach-1',
    nom: 'Martin',
    prenom: 'Sophie',
    role: 'Entraîneure principale — sprint & haies',
    disciplines: ['100m', '200m', '110m haies', '400m haies'],
    bio: 'Ancienne athlète nationale, Sophie encadre les groupes sprint depuis 10 ans avec une approche centrée sur la technique de course.',
  },
  {
    id: 'coach-2',
    nom: 'Dubois',
    prenom: 'Alexandre',
    role: 'Entraîneur — demi-fond & fond',
    disciplines: ['800m', '1500m', '5000m', '10000m'],
    bio: "Alexandre accompagne les coureurs de demi-fond et de fond, du premier plan d'entraînement jusqu'à la préparation des courses sur route.",
  },
  {
    id: 'coach-3',
    nom: 'Lefebvre',
    prenom: 'Camille',
    role: 'Entraîneure — sauts',
    disciplines: ['Longueur', 'Triple saut', 'Hauteur', 'Perche'],
    bio: "Spécialiste des sauts, Camille forme les jeunes athlètes aux fondamentaux techniques et prépare les compétiteurs confirmés.",
  },
  {
    id: 'coach-4',
    nom: 'Petit',
    prenom: 'Julien',
    role: 'Entraîneur — lancers',
    disciplines: ['Poids', 'Disque', 'Javelot', 'Marteau'],
    bio: "Julien encadre le groupe lancers avec un travail approfondi sur la puissance et la technique gestuelle.",
  },
]
