import { Node } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, type Transaction } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MediaSlotView } from './MediaSlotView'
import { MEDIA_GRID_NAME } from './MediaGrid'
import { parseFigureWidth } from './mediaSizes'

export const MEDIA_SLOT_NAME = 'mediaSlot'

/** Média prêt à prendre la place d'un emplacement (envoi ou galerie). */
export interface SlotMedia {
  url: string
  resource_type: string
  alt?: string | null
}

export interface MediaSlotOptions {
  /** Envoi de fichiers choisis depuis l'emplacement à `pos` : orchestré par
   *  BlogEditor, qui partage l'état d'envoi avec la barre d'outils. */
  onUploadFiles: (view: EditorView, pos: number, files: File[]) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaSlot: {
      /** Remplit l'emplacement à `pos` avec le premier média, les emplacements
       *  vides suivants de la même grille avec les autres ; ce qui reste est
       *  inséré après le bloc. */
      fillMediaSlots: (pos: number, items: SlotMedia[]) => ReturnType
    }
  }
}

/** Remplace l'emplacement à `pos` par une figure ou une vidéo. Le média garde la
 *  largeur de l'emplacement : dans un bloc image + texte, c'est elle qui fixe la
 *  part de l'image. Renvoie false s'il n'y a plus d'emplacement à cet endroit. */
export function fillSlot(tr: Transaction, pos: number, item: SlotMedia): boolean {
  const slot = tr.doc.nodeAt(pos)
  if (!slot || slot.type.name !== MEDIA_SLOT_NAME) return false
  const { schema } = tr.doc.type
  const width = slot.attrs.width as number | null
  const node =
    item.resource_type === 'video'
      ? schema.nodes.video.create({ src: item.url, width })
      : schema.nodes.figureImage.create({ src: item.url, alt: item.alt ?? '', width })
  tr.replaceWith(pos, pos + slot.nodeSize, node)
  return true
}

/** L'emplacement à `pos`, suivi des emplacements vides qui le suivent dans la
 *  même grille : choisir trois photos pour une grille de trois la remplit d'un
 *  coup. Hors grille, l'emplacement seul. */
export function slotTargets(doc: PMNode, pos: number): number[] {
  const slot = doc.nodeAt(pos)
  if (!slot || slot.type.name !== MEDIA_SLOT_NAME) return []
  const $pos = doc.resolve(pos)
  if ($pos.parent.type.name !== MEDIA_GRID_NAME) return [pos]
  const targets: number[] = []
  $pos.parent.forEach((child, offset) => {
    const childPos = $pos.start() + offset
    if (childPos >= pos && child.type.name === MEDIA_SLOT_NAME) targets.push(childPos)
  })
  return targets
}

/** Frontière juste après le bloc de premier niveau qui contient `pos`. */
export function afterTopLevelBlock(doc: PMNode, pos: number): number {
  const $pos = doc.resolve(pos)
  return $pos.depth === 0 ? pos + (doc.nodeAt(pos)?.nodeSize ?? 0) : $pos.after(1)
}

/** Emplacement visé par un évènement (dépôt d'un fichier sur son cadre). */
export function slotPosFromEvent(view: EditorView, event: Event): number | null {
  const el = event.target instanceof Element ? event.target.closest('figure.media-slot') : null
  if (!el || !view.dom.contains(el)) return null
  const pos = view.posAtDOM(el, 0)
  return view.state.doc.nodeAt(pos)?.type.name === MEDIA_SLOT_NAME ? pos : null
}

/**
 * Emplacement photo d'un MODÈLE d'article (cf. templates.ts) : un cadre vide,
 * avec sa consigne (« Le podium »), qu'on remplit en y envoyant un fichier, en
 * y déposant une photo ou en piochant dans la galerie — comme un cadre photo
 * de Canva. Il appartient au groupe `media` : il prend place dans une grille ou
 * un bloc image + texte exactement comme la photo qui le remplacera.
 *
 * Sérialisé `<figure class="media-slot" data-hint="…">`, sans média : il
 * survit à l'enregistrement d'un brouillon, et un emplacement resté vide
 * disparaît de l'article publié (cf. lib/templateLeftovers.ts).
 */
export const MediaSlot = Node.create<MediaSlotOptions>({
  name: MEDIA_SLOT_NAME,
  group: 'block media',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { onUploadFiles: () => {} }
  },

  addAttributes() {
    return {
      hint: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-hint'),
      },
      width: {
        default: null,
        parseHTML: (element) => parseFigureWidth(element),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'figure.media-slot' }]
  },

  renderHTML({ node }) {
    const { hint, width } = node.attrs
    const attrs: Record<string, string> = { class: `media-slot${width ? ' fig-sized' : ''}` }
    if (hint) attrs['data-hint'] = hint
    if (width) attrs.style = `width: ${width}%`
    return ['figure', attrs]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaSlotView)
  },

  addCommands() {
    return {
      fillMediaSlots:
        (pos, items) =>
        ({ tr, dispatch }) => {
          const targets = slotTargets(tr.doc, pos)
          if (!targets.length || !items.length) return false
          if (!dispatch) return true
          // Les médias en trop d'abord, APRÈS le bloc : les positions des
          // emplacements, qui le précèdent, restent valables.
          let insertAt = afterTopLevelBlock(tr.doc, pos)
          for (const item of items.slice(targets.length)) {
            const node =
              item.resource_type === 'video'
                ? tr.doc.type.schema.nodes.video.create({ src: item.url })
                : tr.doc.type.schema.nodes.figureImage.create({ src: item.url, alt: item.alt ?? '' })
            tr.insert(insertAt, node)
            insertAt += node.nodeSize
          }
          items.slice(0, targets.length).forEach((item, i) => fillSlot(tr, tr.mapping.map(targets[i]), item))
          tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(pos)))
          tr.scrollIntoView()
          return true
        },
    }
  },
})
