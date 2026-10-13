/**
 * MODÈLES D'ARTICLE : des mises en page prêtes à remplir, comme les modèles de
 * Canva. Un modèle n'invente aucun bloc : titres, listes, citation, grilles
 * média et blocs image + texte sont ceux de l'éditeur, stylés par les mêmes
 * règles que tout article du Mag. Ce qui est à remplir est de deux sortes :
 *
 *  - une zone de texte : un paragraphe ou un titre VIDE qui porte une consigne
 *    (`data-hint`, cf. extensions/TemplateHint.ts), affichée en grisé ;
 *  - un emplacement photo : `<figure class="media-slot">` (cf.
 *    extensions/MediaSlot.ts), un cadre qu'on remplit par envoi, dépôt ou
 *    galerie.
 *
 * Ce qui reste vide n'apparaît pas dans l'article publié (cf.
 * lib/templateLeftovers.ts). Les intertitres, eux, sont du vrai texte : la
 * structure est la valeur du modèle, l'auteur les garde ou les renomme.
 *
 * Le HTML ci-dessous passe par le même analyseur que le contenu enregistré : un
 * modèle relu depuis la base est donc identique au modèle appliqué.
 */

export interface ArticleTemplate {
  id: string
  name: string
  /** Une ligne pour le choisir. */
  description: string
  /** Consignes des champs Titre et Résumé du formulaire. */
  titleHint: string
  summaryHint: string
  html: string
}

function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Zone de texte à remplir. */
const field = (hint: string, tag = 'p') => `<${tag} data-hint="${attr(hint)}"></${tag}>`
const h2 = (text: string) => `<h2>${text}</h2>`
/** Emplacement photo ; `width` en % de la colonne (ou du bloc image + texte). */
const slot = (hint: string, width?: number) =>
  `<figure class="media-slot${width ? ' fig-sized' : ''}" data-hint="${attr(hint)}"${
    width ? ` style="width: ${width}%"` : ''
  }></figure>`
/** Grille de 2 à 4 emplacements photo, un par consigne. */
const grid = (...hints: string[]) =>
  `<div class="media-grid media-grid-${hints.length}" data-type="media-grid">${hints.map((h) => slot(h)).join('')}</div>`
/** Bloc image + texte : l'image du côté `side`, le texte l'habille. */
const mediaText = (side: 'left' | 'right', media: string, ...column: string[]) =>
  `<div class="media-text media-text-${side}" data-type="media-text">${media}<div class="media-text-col">${column.join('')}</div></div>`
const list = (...hints: string[]) => `<ul>${hints.map((h) => `<li>${field(h)}</li>`).join('')}</ul>`
const quote = (hint: string) => `<blockquote>${field(hint)}</blockquote>`

export const ARTICLE_TEMPLATES: ArticleTemplate[] = [
  {
    id: 'compte-rendu',
    name: 'Compte rendu de compétition',
    description: 'Résultats, temps forts en photos, l’athlète du jour et le prochain rendez-vous.',
    titleHint: 'Nom de la compétition : le fait marquant',
    summaryHint: 'Où, quand, et le résultat qui a marqué la journée, en une phrase.',
    html: [
      field(
        'Le chapeau : où et quand se déroulait la compétition, combien d’athlètes du BEC étaient engagés, et ce qu’il faut en retenir.',
      ),
      slot('Photo d’ambiance : le groupe, le stade, un départ de course'),
      h2('Les résultats'),
      list(
        'Athlète, épreuve, performance et place. Tapez @ pour relier la fiche de l’athlète.',
        'Un record personnel ou un record du club ? Précisez-le.',
        'Un podium, une qualification, une première sélection…',
      ),
      grid('Photo en action', 'Photo en action', 'Le podium'),
      h2('Les temps forts'),
      mediaText(
        'left',
        slot('Portrait de l’athlète du jour', 45),
        field('L’athlète du jour', 'h3'),
        field('Racontez sa course : la stratégie, le moment clé, sa réaction à l’arrivée.'),
      ),
      quote('Une phrase de l’entraîneur ou d’un athlète, à chaud.'),
      h2('Prochain rendez-vous'),
      field('La prochaine compétition : date, lieu, et qui y est engagé.'),
    ].join(''),
  },
  {
    id: 'portrait',
    name: 'Portrait d’athlète',
    description: 'Une photo, un parcours, des chiffres et trois questions.',
    titleHint: 'Prénom Nom, en quelques mots',
    summaryHint: 'Sa discipline, son niveau, et ce qui rend son parcours singulier.',
    html: [
      mediaText(
        'right',
        slot('Portrait, de préférence en tenue du club', 40),
        field(
          'Présentez l’athlète : sa discipline, depuis quand au club, son groupe d’entraînement. Tapez @ pour relier sa fiche.',
        ),
        field('Ce qui le ou la caractérise : un trait de caractère, une habitude d’avant-course, une anecdote.'),
      ),
      h2('Son parcours'),
      field('Ses débuts en athlétisme, son arrivée au BEC, les étapes qui l’ont fait progresser.'),
      h2('Ses meilleures performances'),
      list('Épreuve, performance, compétition et année', 'Épreuve, performance, compétition et année'),
      slot('Photo en compétition'),
      h2('En trois questions'),
      field('Première question (ex. : ton meilleur souvenir sur la piste ?)', 'h3'),
      field('Sa réponse, avec ses mots.'),
      field('Deuxième question (ex. : ta séance la plus redoutée ?)', 'h3'),
      field('Sa réponse.'),
      field('Troisième question (ex. : ton objectif de la saison ?)', 'h3'),
      field('Sa réponse.'),
      quote('Sa devise, ou une phrase qui lui ressemble.'),
    ].join(''),
  },
  {
    id: 'annonce',
    name: 'Annonce d’événement',
    description: 'Stage, soirée, journée portes ouvertes : l’essentiel et les infos pratiques.',
    titleHint: 'Nom de l’événement, et sa date',
    summaryHint: 'Quoi, quand, où : l’essentiel en une phrase.',
    html: [
      slot('Affiche ou photo de l’événement'),
      field('Présentez l’événement en deux ou trois phrases : à qui il s’adresse, et pourquoi venir.'),
      h2('En pratique'),
      list(
        'Date et horaires',
        'Lieu : adresse, accès en tram ou en bus',
        'Tarif et inscription (lien vers /rejoindre pour une adhésion)',
        'Ce qu’il faut apporter',
      ),
      h2('Contact'),
      field('Qui contacter pour toute question, et comment.'),
    ].join(''),
  },
  {
    id: 'reportage-photo',
    name: 'Reportage photo',
    description: 'Peu de texte, beaucoup d’images : des séries de photos et leurs légendes.',
    titleHint: 'La journée en images',
    summaryHint: 'En une phrase, ce que racontent ces photos.',
    html: [
      field('Quelques lignes pour planter le décor : le lieu, la date, l’ambiance.'),
      grid('Photo', 'Photo'),
      field('Un court texte entre deux séries : ce qui se passe sur ces images.'),
      grid('Photo', 'Photo', 'Photo'),
      slot('La photo de la journée, en grand'),
      field('Le mot de la fin, et où retrouver toutes les photos (lien vers la galerie).'),
    ].join(''),
  },
]
