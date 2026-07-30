import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VideoView } from './VideoView'
import type { FigureAlign } from './FigureImage'
import { parseFigureWidth } from './mediaSizes'
import { stripCldTransforms } from '../../../lib/cloudinary'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: { src: string }) => ReturnType
    }
  }
}

export const Video = Node.create({
  name: 'video',
  // `media` : accepté comme enfant d'une grille média (voir MediaGrid).
  group: 'block media',
  atom: true,
  // Pas de DnD HTML5 (ghosts dupliqués) : le déplacement est géré par le
  // drag pointeur custom (voir useMediaDrag).
  draggable: false,
  selectable: true,

  addAttributes() {
    const videoOf = (element: HTMLElement): HTMLVideoElement | null =>
      element instanceof HTMLVideoElement ? element : element.querySelector('video')

    return {
      src: {
        default: null,
        // `stripCldTransforms` : si une figure est glissée/collée depuis un
        // ARTICLE RENDU, son src porte une transformation de livraison. La
        // stocker en base ferait échouer la comparaison du nettoyage d'orphelins
        // et détruire un asset encore affiché — on renormalise donc à l'entrée.
        parseHTML: (element) =>
          stripCldTransforms(videoOf(element)?.getAttribute('src')) || null,
      },
      caption: {
        default: '',
        parseHTML: (element) => element.querySelector('figcaption')?.textContent ?? '',
      },
      width: {
        default: null,
        parseHTML: (element) => parseFigureWidth(element),
      },
      align: {
        default: 'center' as FigureAlign,
        // Habillage flottant préservé au reparse (cf. FigureImage) ; les
        // alignements hérités non flottants retombent sur `center`.
        parseHTML: (element): FigureAlign => {
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
      { tag: 'figure', getAttrs: (el) => (el.querySelector('video') ? {} : false) },
      { tag: 'video' },
    ]
  },

  renderHTML({ node }) {
    const { src, caption, width, align } = node.attrs
    const className = `fig-${align}${width ? ' fig-sized' : ''}`
    const attrs: Record<string, string> = { class: className }
    if (width) attrs.style = `width: ${width}%`
    // `playsinline` en minuscules : sérialisation DOM brute, pas du JSX. Sans lui,
    // iOS Safari force le lecteur plein écran. `poster` n'est volontairement PAS
    // sérialisé : il est dérivé au rendu (cf. lib/blogMedia.ts) pour pouvoir
    // évoluer sans migration — et les deux sanitizers le retireraient de toute
    // façon à l'enregistrement.
    const video = [
      'video',
      mergeAttributes({
        src,
        controls: 'true',
        playsinline: 'true',
        preload: 'metadata',
      }),
    ] as const
    // Pas de <figcaption> vide : évite une marge fantôme dans l'article publié.
    return caption
      ? ['figure', mergeAttributes(attrs), video, ['figcaption', {}, caption]]
      : ['figure', mergeAttributes(attrs), video]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoView)
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands, tr }) =>
          commands.insertContentAt(tr.selection.to, { type: this.name, attrs: { src: attrs.src } }),
    }
  },
})
