import { Node } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, Selection, TextSelection, type Transaction } from '@tiptap/pm/state'
import { isMediaNode } from './MediaGrid'

export const MEDIA_TEXT_NAME = 'mediaText'
export const MEDIA_TEXT_COLUMN_NAME = 'mediaTextColumn'

export type MediaTextSide = 'left' | 'right'

/** Largeur (% du bloc) donnée à l'image à la création : moitié pour l'image,
 *  moitié pour la colonne de texte. */
const DEFAULT_MEDIA_WIDTH = 50

/** Position du bloc `mediaText` parent si `pos` désigne son média enfant. */
export function parentMediaTextPos(doc: PMNode, pos: number): number | null {
  const $pos = doc.resolve(pos)
  return $pos.depth >= 1 && $pos.node(1).type.name === MEDIA_TEXT_NAME ? $pos.before(1) : null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaText: {
      /** Enveloppe le média autonome à `mediaPos` dans un bloc 2 colonnes
       *  (image d'un côté, colonne de texte éditable de l'autre) et place le
       *  curseur dans le texte. `side` = position de l'image. Conservé pour
       *  l'édition des articles hérités contenant déjà un bloc `MediaText` ;
       *  l'habillage des nouveaux médias passe désormais par un flottant. */
      wrapInMediaText: (mediaPos: number, side: MediaTextSide) => ReturnType
      /** Bascule le côté de l'image d'un bloc `mediaText` existant. */
      setMediaTextSide: (mediaTextPos: number, side: MediaTextSide) => ReturnType
      /** Dissout le bloc `mediaText` à `pos` : le texte de la colonne redevient
       *  des paragraphes normaux. `keepMedia` (défaut) réinsère aussi l'image
       *  centrée avant le texte ; à false, l'image est supprimée (texte gardé). */
      unwrapMediaText: (pos: number, keepMedia?: boolean) => ReturnType
    }
  }
}

/** Colonne de texte éditable d'un bloc `mediaText`. N'appartient à aucun groupe
 *  (donc jamais insérable seule ni au top-level) ; sérialisée en
 *  `<div class="media-text-col">`. */
export const MediaTextColumn = Node.create({
  name: MEDIA_TEXT_COLUMN_NAME,
  content: 'block+',
  isolating: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'div.media-text-col' }]
  },

  renderHTML() {
    return ['div', { class: 'media-text-col' }, 0]
  },
})

/** Bloc 2 colonnes « image + texte » : un média (`figureImage`/`video`) et une
 *  colonne de texte éditable côte à côte, de hauteur alignée sur l'image. Le
 *  côté de l'image (`imageSide`) est un attribut ; l'ordre DOM reste toujours
 *  média puis colonne, le côté visuel est géré en CSS (row-reverse) — round-trip
 *  HTML sans perte. Remplace l'ancien habillage `float` : le contenu placé après
 *  le bloc repart proprement en dessous. */
export const MediaText = Node.create({
  name: MEDIA_TEXT_NAME,
  group: 'block',
  // `media?` (et non `media`) : le retrait du média — suppression ou drag hors
  // du bloc — doit laisser une transaction VALIDE (colonne seule), que la
  // normalisation dissout ensuite en paragraphes. Même logique que la grille
  // média (`media{1,4}`, min 1). En régime permanent, le média est présent.
  content: 'media? mediaTextColumn',
  isolating: true,
  selectable: true,
  // Pas de DnD HTML5 : cohérent avec les médias (drag pointeur custom).
  draggable: false,

  addAttributes() {
    return {
      imageSide: {
        default: 'left' as MediaTextSide,
        parseHTML: (element) => {
          const cls = element.getAttribute('class') ?? ''
          return cls.includes('media-text-right') ? 'right' : 'left'
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="media-text"]' }]
  },

  renderHTML({ node }) {
    const side = node.attrs.imageSide === 'right' ? 'right' : 'left'
    return [
      'div',
      { class: `media-text media-text-${side}`, 'data-type': 'media-text' },
      0,
    ]
  },

  addCommands() {
    return {
      wrapInMediaText:
        (mediaPos, side) =>
        ({ tr, state, dispatch }) => {
          const media = tr.doc.nodeAt(mediaPos)
          if (!media || !isMediaNode(media)) return false
          // Déjà dans une grille ou un bloc mediaText : on ne réenveloppe pas.
          if (tr.doc.resolve(mediaPos).depth !== 0) return false
          if (!dispatch) return true

          const paragraph = state.schema.nodes.paragraph.createAndFill()
          if (!paragraph) return false
          const column = state.schema.nodes[MEDIA_TEXT_COLUMN_NAME].create(null, paragraph)
          const mediaNode = media.type.create(
            { ...media.attrs, align: 'center', width: DEFAULT_MEDIA_WIDTH },
            media.content,
            media.marks,
          )
          const block = this.type.create({ imageSide: side }, [mediaNode, column])
          tr.replaceWith(mediaPos, mediaPos + media.nodeSize, block)
          // Curseur dans le paragraphe vide de la colonne (frappe immédiate) :
          // média = 1 (atom), +2 tokens d'ouverture (colonne, paragraphe).
          tr.setSelection(
            TextSelection.near(tr.doc.resolve(mediaPos + 1 + mediaNode.nodeSize + 2)),
          )
          tr.scrollIntoView()
          return true
        },

      setMediaTextSide:
        (mediaTextPos, side) =>
        ({ tr, dispatch }) => {
          const block = tr.doc.nodeAt(mediaTextPos)
          if (!block || block.type.name !== MEDIA_TEXT_NAME) return false
          if (block.attrs.imageSide === side) return true
          if (!dispatch) return true
          tr.setNodeMarkup(mediaTextPos, undefined, { ...block.attrs, imageSide: side })
          return true
        },

      unwrapMediaText:
        (pos, keepMedia = true) =>
        ({ tr, dispatch }) => {
          const block = tr.doc.nodeAt(pos)
          if (!block || block.type.name !== MEDIA_TEXT_NAME) return false
          const media = block.child(0)
          const column = block.maybeChild(1)
          if (!column) return false
          if (!dispatch) return true

          const children: PMNode[] = []
          if (keepMedia) {
            children.push(
              media.type.create(
                { ...media.attrs, align: 'center', width: null },
                media.content,
                media.marks,
              ),
            )
          }
          column.forEach((child) => children.push(child))
          tr.replaceWith(pos, pos + block.nodeSize, children)
          tr.setSelection(Selection.near(tr.doc.resolve(keepMedia ? pos : pos + 1)))
          tr.scrollIntoView()
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      // Normalisation (filet de sécurité, calquée sur mediaGridNormalize) : un
      // bloc mediaText réduit à un seul enfant — média retiré par drag/suppression
      // (reste la colonne) ou l'inverse — est dissous sans perdre le contenu. La
      // transaction ajoutée fusionne avec le geste dans l'historique (un seul undo).
      new Plugin({
        key: new PluginKey('mediaTextNormalize'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((t) => t.docChanged)) return null
          let tr: Transaction | null = null
          newState.doc.forEach((node, pos) => {
            if (node.type.name !== MEDIA_TEXT_NAME) return
            if (node.childCount === 2 && node.child(0).isBlock && isMediaNode(node.child(0))) return
            tr ??= newState.tr
            const mapped = tr.mapping.map(pos)
            const replacement: PMNode[] = []
            node.forEach((child) => {
              if (child.type.name === MEDIA_TEXT_COLUMN_NAME) {
                // La colonne restée seule : ses paragraphes redeviennent du texte.
                child.forEach((block) => replacement.push(block))
              } else if (isMediaNode(child)) {
                replacement.push(
                  child.type.create({ ...child.attrs, align: 'center' }, child.content, child.marks),
                )
              }
            })
            tr.replaceWith(mapped, mapped + node.nodeSize, replacement)
          })
          return tr
        },
      }),
    ]
  },
})
