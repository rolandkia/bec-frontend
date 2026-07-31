// Infos pratiques : les groupes d'entraînement du club et leurs créneaux.
//
// SOURCE : informations transmises par le club. Il n'a que DEUX groupes —
// « Athlé découverte » (U7–U16) et « Sprint & haies » (U18–Masters) —, tous deux
// sur la piste de Rocquencourt (cf. `data/club.ts`). Tranches d'âge, créneaux et
// lieu sont donc RÉELS : ils remplacent six groupes inventés (éveil, poussins,
// benjamins, minimes, espoirs, masters) et leurs horaires fictifs.
//
// Les `description` sont rédigées pour le site à partir des mots du club
// (« à partir de 17 ans jusqu'aux Masters, que vous visiez la compétition ou le
// running loisir ») — même règle que `club.valeurs`.
//
// DÉLIBÉRÉMENT ABSENT : les noms des entraîneurs. Ne pas les rajouter.
//
// TODO : les TARIFS et les modalités d'inscription restent inconnus. La page ne
// les mentionne donc pas du tout — plutôt qu'un montant inventé. Les demandes
// passent par /contact, où le formulaire pose déjà l'âge et la discipline.

export type GroupeEntrainement = {
  titre: string
  trancheAge: string
  creneaux: string[]
  lieu: string
  description: string
  /** Disciplines travaillées, en pastilles. Absent = rangée non rendue (le
   *  groupe découverte touche à tout, et le club ne détaille pas). */
  disciplines?: string[]
  photo: string
  photoAlt: string
  /**
   * `object-position` du cliché. Les deux sources sont en PAYSAGE alors que la
   * colonne photo de la carte est plutôt portrait : `object-cover` en rogne les
   * côtés, et le haut dès que le panneau est plus large que haut. À réajuster à
   * l'œil si la longueur d'une `description` change la hauteur de la carte.
   */
  photoPosition?: string
  /**
   *  - `'scene'` (défaut) : cliché de terrain, voiles habituels.
   *  - `'studio'` : fond clair. Les voiles de `'scene'` y sont
   *    contre-productifs, cf. `components/club/GroupeCard`.
   */
  photoFond?: 'scene' | 'studio'
}

export const groupesEntrainement: GroupeEntrainement[] = [
  {
    titre: 'Athlé découverte',
    trancheAge: 'U7 → U16',
    creneaux: ['Mercredi, de 14h30 à 16h30'],
    lieu: 'Piste de Rocquencourt, Pessac',
    description:
      "De l'éveil athlétique aux minimes, une séance par semaine pour découvrir l'athlétisme " +
      'sous toutes ses formes : courir, sauter, lancer. On apprend en jouant, on progresse à ' +
      "son rythme, et on part en compétition quand on en a envie.",
    photo: '/infos/groupe-jeunes.webp',
    photoAlt:
      'Jeune athlète du BEC en chasuble rouge, sa médaille entre les dents après une compétition',
    // Sa chevelure touche le bord haut du cadrage : tout décalage vertical le
    // décapite dès que le panneau est plus large que haut.
    photoPosition: 'center top',
  },
  {
    titre: 'Sprint & haies',
    trancheAge: 'U18 → Masters',
    creneaux: ['Du lundi au vendredi, de 18h à 20h', 'Samedi, de 10h à 12h'],
    lieu: 'Piste de Rocquencourt, Pessac',
    disciplines: ['Sprint', 'Haies'],
    description:
      "À partir de 17 ans et jusqu'aux Masters, un seul groupe pour le sprint et les haies, que " +
      'vous visiez la compétition ou le running loisir. Six créneaux par semaine : le club est ' +
      'sur la piste tous les soirs de la semaine, et le samedi matin.',
    photo: '/infos/groupe-adultes.webp',
    photoAlt: "Membre du BEC en sweat à capuche rouge floqué de l'écusson du club",
    // Le tiers gauche du cliché est du fond studio vide : ce cadrage l'amène sous
    // le dégradé de jointure et sort le visage de la rampe.
    photoPosition: '30% center',
    photoFond: 'studio',
  },
]
