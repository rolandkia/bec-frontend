import { Node } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, type Transaction } from '@tiptap/pm/state'
import { clampGridItemWidth, GRID_ITEM_WIDTH_MIN } from './mediaSizes'

export const MEDIA_GRID_NAME = 'mediaGrid'
export const MEDIA_GRID_MAX_ITEMS = 4

/** Un nœud appartient-il au groupe `media` (figureImage, video) ? */
export function isMediaNode(node: PMNode): boolean {
  return (node.type.spec.group ?? '').split(' ').includes('media')
}

/** Position de la grille parente si `pos` désigne un enfant de grille. */
export function parentGridPos(doc: PMNode, pos: number): number | null {
  const $pos = doc.resolve(pos)
  return $pos.depth >= 1 && $pos.node(1).type.name === MEDIA_GRID_NAME ? $pos.before(1) : null
}

/** Le média déplacé peut-il rejoindre la cible ? Une cible isolée forme une
 *  grille de 2 ; une grille existante accepte jusqu'à MEDIA_GRID_MAX_ITEMS
 *  (sauf réordonnancement interne, qui ne change pas l'effectif). */
export function canJoinGrid(
  doc: PMNode,
  opts: { gridPos: number | null; draggedPos: number },
): boolean {
  if (opts.gridPos == null) return true
  const grid = doc.nodeAt(opts.gridPos)
  if (!grid || grid.type.name !== MEDIA_GRID_NAME) return false
  if (grid.childCount < MEDIA_GRID_MAX_ITEMS) return true
  return parentGridPos(doc, opts.draggedPos) === opts.gridPos
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaGrid: {
      /** Fusionne le média à `draggedPos` avec la cible : cible isolée →
       *  nouvelle grille de 2 ; cible dans une grille → insertion à
       *  `gridIndex`. Refuse (false) si la grille est pleine. */
      combineIntoGrid: (opts: {
        draggedPos: number
        targetPos: number
        side: 'left' | 'right'
        gridPos: number | null
        gridIndex: number
      }) => ReturnType
      /** Sort l'enfant à `itemPos` de sa grille et le replace comme bloc
       *  après elle (la grille se dissout d'elle-même s'il ne reste qu'un
       *  enfant, via la normalisation). */
      liftFromMediaGrid: (itemPos: number) => ReturnType
      /** Dissout la grille à `gridPos` en blocs empilés. */
      unwrapMediaGrid: (gridPos: number) => ReturnType
      /** Redimensionne un enfant de grille : le voisin du côté indiqué
       *  compense (la rangée garde sa largeur totale). */
      setGridItemSize: (itemPos: number, pct: number, neighborSide: 'left' | 'right') => ReturnType
    }
  }
}

/** Grille média : 2 à 4 médias côte à côte. Les enfants sont les nœuds
 *  `figureImage`/`video` habituels (aucun wrapper), sérialisés à l'identique
 *  dedans/dehors — le wrap/unwrap est donc sans perte. Leur attribut `width`
 *  devient la part de la rangée (null = parts égales). */
export const MediaGrid = Node.create({
  name: MEDIA_GRID_NAME,
  group: 'block',
  // min 1 dans le schéma : la suppression d'un enfant d'une grille de 2 doit
  // être une transaction valide ; la normalisation ci-dessous dissout ensuite
  // les grilles orphelines (min 2 en régime permanent).
  content: 'media{1,4}',
  isolating: true,
  selectable: true,
  // Pas de DnD HTML5 : cohérent avec les médias (drag pointeur custom).
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="media-grid"]' }, { tag: 'div.media-grid' }]
  },

  renderHTML({ node }) {
    // media-grid-N est recalculé à chaque rendu (jamais parsé) : simple
    // crochet CSS pour différencier 2-up et 3/4-up.
    return [
      'div',
      { class: `media-grid media-grid-${node.childCount}`, 'data-type': 'media-grid' },
      0,
    ]
  },

  addCommands() {
    return {
      combineIntoGrid:
        ({ draggedPos, targetPos, side, gridPos, gridIndex }) =>
        ({ tr, dispatch }) => {
          const doc = tr.doc
          const dragged = doc.nodeAt(draggedPos)
          if (!dragged || !isMediaNode(dragged) || targetPos === draggedPos) return false
          const draggedGridPos = parentGridPos(doc, draggedPos)
          const $dragged = doc.resolve(draggedPos)

          if (gridPos != null) {
            const grid = doc.nodeAt(gridPos)
            if (!grid || grid.type.name !== MEDIA_GRID_NAME) return false
            const reorder = draggedGridPos === gridPos
            if (!reorder && grid.childCount >= MEDIA_GRID_MAX_ITEMS) return false
          } else {
            const target = doc.nodeAt(targetPos)
            if (!target || !isMediaNode(target)) return false
          }
          if (!dispatch) return true

          // Enfant de grille : centré, part égale par défaut.
          const moved = dragged.type.create(
            { ...dragged.attrs, align: 'center', width: null },
            dragged.content,
            dragged.marks,
          )
          tr.delete(draggedPos, draggedPos + dragged.nodeSize)

          if (gridPos == null) {
            const mappedTarget = tr.mapping.map(targetPos)
            const target = tr.doc.nodeAt(mappedTarget)
            if (!target || !isMediaNode(target)) return false
            const targetNorm = target.type.create(
              { ...target.attrs, align: 'center', width: null },
              target.content,
              target.marks,
            )
            const children = side === 'left' ? [moved, targetNorm] : [targetNorm, moved]
            tr.replaceWith(mappedTarget, mappedTarget + target.nodeSize, this.type.create(null, children))
            const movedPos = side === 'left' ? mappedTarget + 1 : mappedTarget + 1 + targetNorm.nodeSize
            tr.setSelection(NodeSelection.create(tr.doc, movedPos))
          } else {
            const mappedGrid = tr.mapping.map(gridPos)
            const grid = tr.doc.nodeAt(mappedGrid)
            if (!grid || grid.type.name !== MEDIA_GRID_NAME) return false
            // Réordonnancement interne : la suppression du nœud déplacé a
            // décalé d'un cran les index situés après lui.
            let index = gridIndex
            if (draggedGridPos === gridPos && $dragged.index(1) < gridIndex) index -= 1
            index = Math.max(0, Math.min(index, grid.childCount))
            let insertPos = mappedGrid + 1
            for (let i = 0; i < index; i++) insertPos += grid.child(i).nodeSize
            tr.insert(insertPos, moved)
            tr.setSelection(NodeSelection.create(tr.doc, insertPos))
          }
          tr.scrollIntoView()
          return true
        },

      liftFromMediaGrid:
        (itemPos) =>
        ({ tr, dispatch }) => {
          const doc = tr.doc
          const $item = doc.resolve(itemPos)
          if ($item.depth !== 1 || $item.parent.type.name !== MEDIA_GRID_NAME) return false
          const item = doc.nodeAt(itemPos)
          if (!item) return false
          if (!dispatch) return true

          const grid = $item.parent
          const gridPos = $item.before(1)
          const lifted = item.type.create(
            { ...item.attrs, align: 'center', width: 50 },
            item.content,
            item.marks,
          )
          tr.delete(itemPos, itemPos + item.nodeSize)
          const afterGrid = tr.mapping.map(gridPos + grid.nodeSize)
          tr.insert(afterGrid, lifted)
          tr.setSelection(NodeSelection.create(tr.doc, afterGrid))
          tr.scrollIntoView()
          return true
        },

      unwrapMediaGrid:
        (gridPos) =>
        ({ tr, dispatch }) => {
          const grid = tr.doc.nodeAt(gridPos)
          if (!grid || grid.type.name !== MEDIA_GRID_NAME) return false
          if (!dispatch) return true
          const children: PMNode[] = []
          grid.forEach((child) => {
            children.push(
              child.type.create({ ...child.attrs, align: 'center' }, child.content, child.marks),
            )
          })
          tr.replaceWith(gridPos, gridPos + grid.nodeSize, children)
          tr.scrollIntoView()
          return true
        },

      setGridItemSize:
        (itemPos, pct, neighborSide) =>
        ({ tr, dispatch }) => {
          const doc = tr.doc
          const $item = doc.resolve(itemPos)
          if ($item.depth !== 1 || $item.parent.type.name !== MEDIA_GRID_NAME) return false
          const grid = $item.parent
          if (grid.childCount < 2) return false
          const index = $item.index(1)
          let nIndex = neighborSide === 'right' ? index + 1 : index - 1
          if (nIndex < 0 || nIndex >= grid.childCount) {
            nIndex = neighborSide === 'right' ? index - 1 : index + 1
          }
          if (nIndex < 0 || nIndex >= grid.childCount) return false

          const item = grid.child(index)
          const neighbor = grid.child(nIndex)
          // Largeur effective d'un enfant sans largeur explicite : part égale.
          const effective = (n: PMNode) =>
            (n.attrs.width as number | null) ?? Math.round(100 / grid.childCount)
          const pairTotal = effective(item) + effective(neighbor)
          if (pairTotal < 2 * GRID_ITEM_WIDTH_MIN) return false
          const next = clampGridItemWidth(pct, pairTotal - GRID_ITEM_WIDTH_MIN)
          if (!dispatch) return true

          const gridStart = $item.start(1)
          let acc = gridStart
          let itemAbs = gridStart
          let neighborAbs = gridStart
          for (let i = 0; i < grid.childCount; i++) {
            if (i === index) itemAbs = acc
            if (i === nIndex) neighborAbs = acc
            acc += grid.child(i).nodeSize
          }
          tr.setNodeMarkup(itemAbs, undefined, { ...item.attrs, width: next })
          tr.setNodeMarkup(neighborAbs, undefined, { ...neighbor.attrs, width: pairTotal - next })
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      // Normalisation : une grille réduite à un seul enfant (suppression,
      // drag-out…) est remplacée par cet enfant. La transaction ajoutée
      // fusionne avec le geste déclencheur dans l'historique (un seul undo).
      new Plugin({
        key: new PluginKey('mediaGridNormalize'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null
          let tr: Transaction | null = null
          newState.doc.forEach((node, pos) => {
            if (node.type.name !== MEDIA_GRID_NAME || node.childCount !== 1) return
            const child = node.child(0)
            tr ??= newState.tr
            const mapped = tr.mapping.map(pos)
            tr.replaceWith(
              mapped,
              mapped + node.nodeSize,
              child.type.create({ ...child.attrs, align: 'center' }, child.content, child.marks),
            )
          })
          return tr
        },
      }),
    ]
  },
})
