import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FigureImageView } from './FigureImageView'
import { parseFigureWidth } from './mediaSizes'

/** Placement d'un média AUTONOME : uniquement `center` désormais. L'ancien
 *  habillage flottant (`float-left`/`float-right`) est remplacé par le bloc
 *  2 colonnes image+texte (cf. MediaText) ; ces valeurs héritées — comme
 *  `left`/`right`/`custom` — sont ramenées à `center` au reparse (le CSS `float`
 *  reste seulement pour le rendu des articles déjà publiés non ré-enregistrés).
 *  Le type conserve les variantes flottantes pour typer ce contenu hérité. */
export type FigureAlign = 'center' | 'float-left' | 'float-right'

export interface FigureImageAttrs {
  src: string
  alt: string | null
  caption: string
  width: number | null
  align: FigureAlign
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figureImage: {
      setFigureImage: (attrs: {
        src: string
        alt?: string | null
      }) => ReturnType
    }
  }
}

export const FigureImage = Node.create({
  name: 'figureImage',
  // `media` : accepté comme enfant d'une grille média (voir MediaGrid).
  group: 'block media',
  atom: true,
  // Pas de DnD HTML5 (ghosts dupliqués) : le déplacement est géré par le
  // drag pointeur custom (voir useMediaDrag).
  draggable: false,
  selectable: true,

  addAttributes() {
    const imgOf = (element: HTMLElement): HTMLImageElement | null =>
      element instanceof HTMLImageElement ? element : element.querySelector('img')

    return {
      src: {
        default: null,
        parseHTML: (element) => imgOf(element)?.getAttribute('src') ?? null,
      },
      alt: {
        default: null,
        parseHTML: (element) => imgOf(element)?.getAttribute('alt') ?? null,
      },
      caption: {
        default: '',
        parseHTML: (element) =>
          element.querySelector('figcaption')?.textContent ?? '',
      },
      width: {
        default: null,
        parseHTML: (element) => parseFigureWidth(element),
      },
      align: {
        default: 'center',
        // L'habillage flottant est de retour : on préserve `fig-float-left/right`
        // au reparse (édition d'un article existant). Les alignements hérités
        // non flottants (`fig-left`/`fig-right`/`fig-custom`) retombent sur `center`.
        parseHTML: (element) => {
          const fig = element.closest?.('figure') ?? element
          const cls = fig instanceof HTMLElement ? (fig.getAttribute('class') ?? '') : ''
          if (cls.includes('fig-float-left')) return 'float-left'
          if (cls.includes('fig-float-right')) return 'float-right'
          return 'center'
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'figure', getAttrs: (el) => (el.querySelector('img') ? {} : false) },
      { tag: 'img' },
    ]
  },

  renderHTML({ node }) {
    const { src, alt, caption, width, align } = node.attrs
    const className = `fig-${align}${width ? ' fig-sized' : ''}`
    const attrs: Record<string, string> = { class: className }
    if (width) attrs.style = `width: ${width}%`
    const img = ['img', mergeAttributes({ src, alt })] as const
    // Pas de <figcaption> vide : évite une marge fantôme dans l'article publié.
    return caption
      ? ['figure', mergeAttributes(attrs), img, ['figcaption', {}, caption]]
      : ['figure', mergeAttributes(attrs), img]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureImageView)
  },

  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands, tr }) =>
          commands.insertContentAt(tr.selection.to, {
            type: this.name,
            attrs: { src: attrs.src, alt: attrs.alt ?? '' },
          }),
    }
  },
})
