// Infos pratiques : groupes et créneaux d'entraînement.
// Contenu éditorial statique — à ajuster selon la saison en cours.

export type GroupeEntrainement = {
  titre: string
  trancheAge: string
  creneaux: string[]
  lieu: string
  description: string
}

// TODO: adapter les tranches d'âge, créneaux et lieux à la réalité du club.
export const infosPratiques: {
  jeunes: GroupeEntrainement[]
  adultes: GroupeEntrainement[]
} = {
  jeunes: [
    {
      titre: 'Éveil athlétique',
      trancheAge: 'U7 – U11 (Baby, Éveil, Poussins)',
      creneaux: ['Mercredi 14h00 – 15h30'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Découverte ludique de l'athlétisme : courir, sauter, lancer. L'accent est mis sur la motricité, le jeu et le plaisir de bouger en groupe.",
    },
    {
      titre: 'Poussins & Benjamins',
      trancheAge: 'U11 – U14',
      creneaux: ['Mardi 17h30 – 19h00', 'Vendredi 17h30 – 19h00'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Initiation aux différentes familles de l'athlétisme (sprints, sauts, lancers, endurance) et premières compétitions par équipes.",
    },
    {
      titre: 'Minimes',
      trancheAge: 'U14 – U16',
      creneaux: ['Mardi 18h00 – 19h30', 'Jeudi 18h00 – 19h30'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Spécialisation progressive vers une ou deux disciplines, préparation physique adaptée et compétitions individuelles.",
    },
  ],
  adultes: [
    {
      titre: 'Cadets & Juniors',
      trancheAge: 'U18 – U20',
      creneaux: ['Lundi 18h30 – 20h00', 'Mercredi 18h30 – 20h00', 'Vendredi 18h30 – 20h00'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Entraînement structuré par spécialité, planification de la saison et objectifs de performance régionaux et nationaux.",
    },
    {
      titre: 'Espoirs & Seniors',
      trancheAge: 'U23 – Senior',
      creneaux: ['Lundi 19h00 – 20h30', 'Mercredi 19h00 – 20h30', 'Samedi 10h00 – 12h00'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Groupe compétition et loisir : préparation à la compétition, remise en forme et pratique de l'athlétisme à son rythme.",
    },
    {
      titre: 'Masters',
      trancheAge: '35 ans et +',
      creneaux: ['Mercredi 19h00 – 20h30', 'Samedi 10h00 – 12h00'],
      lieu: 'Stade municipal, Bordeaux',
      description:
        "Athlétisme adapté aux vétérans, en compétition ou en entretien, dans une ambiance conviviale.",
    },
  ],
}
