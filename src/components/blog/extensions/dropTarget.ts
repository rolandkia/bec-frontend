import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { isMediaNode, MEDIA_GRID_NAME } from './MediaGrid'

/** Dépôt entre deux blocs : `pos` est une frontière top-level du document et
 *  `y/left/width` décrivent la ligne d'insertion (coordonnées viewport).
 *  Invariant central du drag : la ligne affichée EST la destination. */
export interface GapTarget {
  kind: 'gap'
  pos: number
  y: number
  left: number
  width: number
}

/** Dépôt sur le bord d'un média : fusion côte à côte (grille). */
export interface CombineTarget {
  kind: 'combine'
  /** Position du média cible (top-level ou enfant de grille). */
  targetPos: number
  side: 'left' | 'right'
  /** Position de la grille si la cible est déjà dans une grille. */
  gridPos: number | null
  /** Index d'insertion dans la grille (0 = tout à gauche). */
  gridIndex: number
  /** Rect du média cible (pour le feedback visuel). */
  rect: DOMRect
}

export type DropTarget = GapTarget | CombineTarget

/** Marge (px) d'hystérésis : la zone de combinaison active s'agrandit un peu
 *  pour éviter le clignotement quand le pointeur oscille sur sa frontière. */
const HYSTERESIS = 12
/** Bande verticale centrale d'un média qui accepte la combinaison ; au-dessus/
 *  en dessous, le drop vise le gap voisin. */
const COMBINE_V_BAND = 0.5
/** Largeur relative des zones bord gauche/droit déclenchant la combinaison
 *  (le cœur restant, 20 %, retombe sur le gap le plus proche). */
const COMBINE_EDGE = 0.4

/** Rect « visuel » d'un bloc. Les NodeViews React enveloppent le média dans un
 *  div (pleine largeur, hauteur nulle si le média flotte, display:contents
 *  dans une grille) : on mesure la <figure> intérieure quand elle existe. */
function blockRect(view: EditorView, pos: number): DOMRect | null {
  const dom = view.nodeDOM(pos)
  if (!(dom instanceof HTMLElement)) return null
  const el =
    (dom.querySelector(':scope > [data-node-view-wrapper]') as HTMLElement | null) ?? dom
  const rect = el.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0 ? rect : null
}

/** Toutes les frontières top-level du document, chacune avec l'ordonnée où
 *  dessiner la ligne d'insertion : à mi-chemin entre le bas du bloc précédent
 *  (maximum courant, pour absorber les floats qui débordent) et le haut du
 *  suivant, en gardant la suite strictement croissante. */
export function collectGaps(view: EditorView): GapTarget[] {
  const doc = view.state.doc
  const column = view.dom.getBoundingClientRect()
  const blocks: { pos: number; top: number; bottom: number }[] = []
  doc.forEach((_child, offset) => {
    const rect = blockRect(view, offset)
    if (rect) blocks.push({ pos: offset, top: rect.top, bottom: rect.bottom })
  })

  const gaps: GapTarget[] = []
  const base = { kind: 'gap' as const, left: column.left, width: column.width }
  if (blocks.length === 0) {
    gaps.push({ ...base, pos: 0, y: column.top })
    return gaps
  }
  let runningBottom = -Infinity
  let lastY = -Infinity
  for (let i = 0; i < blocks.length; i++) {
    const raw = i === 0 ? blocks[0].top - 6 : (runningBottom + blocks[i].top) / 2
    const y = Math.max(raw, lastY + 1)
    gaps.push({ ...base, pos: blocks[i].pos, y })
    lastY = y
    runningBottom = Math.max(runningBottom, blocks[i].bottom)
  }
  gaps.push({ ...base, pos: doc.content.size, y: Math.max(runningBottom + 6, lastY + 1) })
  return gaps
}

/** Gap dont la ligne d'insertion est la plus proche du pointeur (en Y). */
export function nearestGap(gaps: GapTarget[], y: number): GapTarget | null {
  let best: GapTarget | null = null
  for (const gap of gaps) {
    if (!best || Math.abs(gap.y - y) < Math.abs(best.y - y)) best = gap
  }
  return best
}

export interface CombineOpts {
  /** Plage du nœud en cours de déplacement (exclue du hit-test). */
  excludeFrom: number
  excludeTo: number
  /** La cible peut-elle accueillir le média (grille pleine…) ? */
  canCombine: (info: { targetPos: number; gridPos: number | null }) => boolean
  /** Cible de combinaison du mouvement précédent (hystérésis). */
  prev: CombineTarget | null
}

/** Média (isolé ou enfant de grille) dont le bord gauche/droit est survolé. */
export function findCombineTarget(
  view: EditorView,
  x: number,
  y: number,
  opts: CombineOpts,
): CombineTarget | null {
  const hitTest = (
    node: PMNode,
    pos: number,
    gridPos: number | null,
    index: number,
  ): CombineTarget | null => {
    if (pos >= opts.excludeFrom && pos < opts.excludeTo) return null
    if (!isMediaNode(node)) return null
    const rect = blockRect(view, pos)
    if (!rect || rect.width <= 0) return null

    const active = opts.prev && opts.prev.targetPos === pos ? opts.prev : null
    const margin = active ? HYSTERESIS : 0
    const vPad = (rect.height * (1 - COMBINE_V_BAND)) / 2
    if (y < rect.top + vPad - margin || y > rect.bottom - vPad + margin) return null

    const edge = rect.width * COMBINE_EDGE
    const inLeft = x >= rect.left - margin && x <= rect.left + edge + (active?.side === 'left' ? margin : 0)
    const inRight = x >= rect.right - edge - (active?.side === 'right' ? margin : 0) && x <= rect.right + margin
    let side: 'left' | 'right' | null
    if (inLeft && inRight) side = active?.side ?? (x < rect.left + rect.width / 2 ? 'left' : 'right')
    else side = inLeft ? 'left' : inRight ? 'right' : null
    if (!side) return null
    if (!opts.canCombine({ targetPos: pos, gridPos })) return null

    const gridIndex =
      gridPos == null ? (side === 'left' ? 0 : 1) : side === 'left' ? index : index + 1
    return { kind: 'combine', targetPos: pos, side, gridPos, gridIndex, rect }
  }

  let found: CombineTarget | null = null
  view.state.doc.forEach((child, offset) => {
    if (found) return
    if (child.type.name === MEDIA_GRID_NAME) {
      let childPos = offset + 1
      let index = 0
      child.forEach((item) => {
        found ??= hitTest(item, childPos, offset, index)
        childPos += item.nodeSize
        index += 1
      })
    } else {
      found = hitTest(child, offset, null, 0)
    }
  })
  return found
}

/** Cible du drag pour la position courante du pointeur : la combinaison
 *  (bord d'un média) a priorité, sinon le gap le plus proche en Y. */
export function computeDropTarget(
  view: EditorView,
  x: number,
  y: number,
  opts: CombineOpts,
): DropTarget | null {
  const combine = findCombineTarget(view, x, y, opts)
  if (combine) return combine
  return nearestGap(collectGaps(view), y)
}
