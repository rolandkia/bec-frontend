import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VideoView } from './VideoView'
import type { FigureAlign } from './FigureImage'
import { parseFigureWidth } from './mediaSizes'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: { src: string }) => ReturnType
    }
  }
}

export const Video = Node.create({
  name: 'video',
  group: 'block',
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
        parseHTML: (element) => videoOf(element)?.getAttribute('src') ?? null,
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
      { tag: 'figure', getAttrs: (el) => (el.querySelector('video') ? {} : false) },
      { tag: 'video' },
    ]
  },

  renderHTML({ node }) {
    const { src, caption, width, align } = node.attrs
    const className = `fig-${align}${width ? ' fig-sized' : ''}`
    const attrs: Record<string, string> = { class: className }
    if (width) attrs.style = `width: ${width}%`
    return [
      'figure',
      mergeAttributes(attrs),
      ['video', mergeAttributes({ src, controls: 'true' })],
      ['figcaption', {}, caption ?? ''],
    ]
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
