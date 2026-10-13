import { Extension } from '@tiptap/core'

/**
 * Consigne d'une zone de texte d'un MODÈLE d'article (cf. templates.ts) :
 * `<p data-hint="Racontez…"></p>`. Tant que le paragraphe ou le titre est vide,
 * l'éditeur affiche la consigne en grisé à sa place (CSS, via la classe
 * `is-empty` posée par l'extension Placeholder) ; taper la remplace, effacer la
 * fait revenir — comme les zones de texte d'un modèle Canva.
 *
 * La consigne n'est PAS du texte : elle ne compte ni dans le temps de lecture
 * ni dans le contrôle « article vide », et un champ resté vide disparaît de
 * l'article publié (cf. lib/templateLeftovers.ts).
 */
export const TemplateHint = Extension.create({
  name: 'templateHint',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          hint: {
            default: null,
            // Entrée au bout d'une zone remplie : le paragraphe suivant est
            // libre, il ne doit pas hériter de la consigne.
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-hint'),
            renderHTML: (attributes) => (attributes.hint ? { 'data-hint': attributes.hint } : {}),
          },
        },
      },
    ]
  },
})
