/**
 * Restes d'un MODÈLE d'article (cf. components/blog/templates.ts) dans le HTML
 * enregistré : les zones que l'auteur n'a pas remplies.
 *
 *  - un emplacement photo : `<figure class="media-slot" data-hint="…">`, sans
 *    média ;
 *  - une zone de texte : `<p data-hint="…"></p>` (ou h1-h4), VIDE. Une fois
 *    remplie elle garde son `data-hint`, qui ne sert plus qu'à faire réapparaître
 *    la consigne si l'auteur efface son texte.
 *
 * Ces restes sont ENREGISTRÉS tels quels : un brouillon rouvert retrouve ses
 * consignes. Ils sont retirés au RENDU (article publié, aperçu, PDF) plutôt qu'à
 * l'enregistrement, ce qui garde l'aller-retour éditeur ↔ base sans perte.
 */

const SLOT_SELECTOR = 'figure.media-slot'
const HINT_SELECTOR = '[data-hint]'

function isBlank(el: Element): boolean {
  return !el.textContent?.trim() && !el.querySelector('img, video')
}

/** Zones du modèle encore vides : de quoi prévenir l'auteur avant publication. */
export function countTemplateLeftovers(html: string): { slots: number; fields: number } {
  if (!html.includes('media-slot') && !html.includes('data-hint')) return { slots: 0, fields: 0 }
  const body = new DOMParser().parseFromString(html, 'text/html').body
  return {
    slots: body.querySelectorAll(SLOT_SELECTOR).length,
    fields: Array.from(body.querySelectorAll(`:is(p, h1, h2, h3, h4)${HINT_SELECTOR}`)).filter(isBlank).length,
  }
}

/**
 * Retire du DOM d'un article les restes de modèle, puis les conteneurs qu'ils
 * laissent vides (puce de liste, citation, liste, grille). Un article sans
 * modèle n'est pas modifié.
 */
export function stripTemplateLeftovers(root: ParentNode): void {
  for (const slot of Array.from(root.querySelectorAll(SLOT_SELECTOR))) slot.remove()

  for (const el of Array.from(root.querySelectorAll(HINT_SELECTOR))) {
    if (isBlank(el)) {
      // Le conteneur qui n'avait QUE ce champ disparaît avec lui (une puce
      // vide afficherait sa puce, une citation vide son filet).
      let gone: Element = el
      while (
        gone.parentElement &&
        gone.parentElement !== root &&
        ['LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(gone.parentElement.tagName) &&
        gone.parentElement.children.length === 1
      ) {
        gone = gone.parentElement
      }
      gone.remove()
    } else {
      el.removeAttribute('data-hint')
    }
  }

  // Bloc image + texte resté entièrement vide : sa marge (2rem de part et
  // d'autre) laisserait un trou dans l'article.
  for (const block of Array.from(root.querySelectorAll('.media-text'))) {
    if (isBlank(block)) block.remove()
  }

  // Grille dont un ou plusieurs emplacements ont été retirés : la classe
  // `media-grid-N` (cf. MediaGrid.renderHTML) doit refléter l'effectif réel, et
  // une grille vidée ne doit pas laisser sa marge.
  for (const grid of Array.from(root.querySelectorAll('.media-grid'))) {
    const count = grid.querySelectorAll(':scope > figure').length
    if (count === 0) grid.remove()
    else grid.className = grid.className.replace(/\bmedia-grid-\d\b/, `media-grid-${count}`)
  }
}
