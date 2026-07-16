import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FigureImageView } from './FigureImageView'
import { parseFigureWidth } from './mediaSizes'

export type FigureAlign = 'left' | 'center' | 'right' | 'float-left' | 'float-right'

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
  group: 'block',
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
        parseHTML: (element) => {
          const cls = element.getAttribute('class') ?? ''
          const match = cls.match(/fig-(float-left|float-right|left|center|right)/)
          return match ? match[1] : 'center'
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
    return [
      'figure',
      mergeAttributes(attrs),
      ['img', mergeAttributes({ src, alt })],
      ['figcaption', {}, caption ?? ''],
    ]
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
