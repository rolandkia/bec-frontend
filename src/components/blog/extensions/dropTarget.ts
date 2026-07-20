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

/** Dépôt sur le bord d'un bloc de texte : le média y devient flottant
 *  (`fig-float-left/right`) et le texte s'enroule autour. */
export interface WrapTarget {
  kind: 'wrap'
  /** Position top-level du bloc de texte cible. */
  blockPos: number
  /** Côté où le média flottera. */
  side: 'left' | 'right'
  /** Rect du bloc cible (pour le feedback visuel). */
  rect: DOMRect
}

export type DropTarget = GapTarget | CombineTarget | WrapTarget

/** Marge (px) d'hystérésis : la zone de combinaison active s'agrandit un peu
 *  pour éviter le clignotement quand le pointeur oscille sur sa frontière. */
const HYSTERESIS = 20
/** Bande verticale d'un média qui accepte la combinaison ; au-dessus/en dessous,
 *  le drop vise le gap voisin. Large (0,75) pour capter le geste facilement. */
const COMBINE_V_BAND = 0.75
/** Largeur relative des zones bord gauche/droit déclenchant la combinaison. */
const COMBINE_EDGE = 0.5
/** Marge (px) de captation autour du média : la combinaison s'amorce même quand
 *  le pointeur arrive du gap voisin, sans être pile sur le bord. */
const COMBINE_MARGIN = 24

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
    // Marge de base généreuse (captation depuis le gap voisin), agrandie encore
    // par l'hystérésis quand ce média était déjà la cible.
    const margin = COMBINE_MARGIN + (active ? HYSTERESIS : 0)
    const vPad = (rect.height * (1 - COMBINE_V_BAND)) / 2
    if (y < rect.top + vPad - margin || y > rect.bottom - vPad + margin) return null

    const edge = rect.width * COMBINE_EDGE
    const inLeft = x >= rect.left - margin && x <= rect.left + edge + (active?.side === 'left' ? HYSTERESIS : 0)
    const inRight = x >= rect.right - edge - (active?.side === 'right' ? HYSTERESIS : 0) && x <= rect.right + margin
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

/** Largeur (px) max de la bande de bord d'un bloc déclenchant l'habillage.
 *  Bornée (et non toute la largeur) pour que le MILIEU d'un bloc reste un `gap`
 *  (insertion centrée entre blocs) : on n'habille que si le pointeur vise
 *  franchement un bord gauche/droit. */
const WRAP_EDGE_PX = 120
/** Repli proportionnel pour les blocs étroits. */
const WRAP_EDGE_RATIO = 0.33

/** Blocs de texte top-level qui peuvent accueillir un média flottant : le texte
 *  s'enroulera autour. Listes et titres inclus (pas seulement les paragraphes). */
const WRAPPABLE_BLOCKS = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
])

/** Bloc de texte top-level dont le bord gauche/droit est survolé : le média y
 *  flottera et le texte s'enroulera autour. Ignore les blocs vides (rien à
 *  enrouler → on laisse le `gap`). */
export function findWrapTarget(
  view: EditorView,
  x: number,
  y: number,
  opts: Pick<CombineOpts, 'excludeFrom' | 'excludeTo'>,
): WrapTarget | null {
  let found: WrapTarget | null = null
  view.state.doc.forEach((child, offset) => {
    if (found) return
    if (!WRAPPABLE_BLOCKS.has(child.type.name) || child.content.size === 0) return
    if (offset >= opts.excludeFrom && offset < opts.excludeTo) return
    const rect = blockRect(view, offset)
    if (!rect || rect.width <= 0) return
    if (y < rect.top || y > rect.bottom) return
    const edge = Math.min(WRAP_EDGE_PX, rect.width * WRAP_EDGE_RATIO)
    const side: 'left' | 'right' | null =
      x >= rect.left && x <= rect.left + edge
        ? 'left'
        : x >= rect.right - edge && x <= rect.right
          ? 'right'
          : null
    if (!side) return
    found = { kind: 'wrap', blockPos: offset, side, rect }
  })
  return found
}

/** Cible du drag pour la position courante du pointeur : la combinaison
 *  (bord d'un média) a priorité, puis l'habillage (bord d'un paragraphe),
 *  sinon le gap le plus proche en Y. Le déplacement ne change plus l'alignement
 *  horizontal du média (choisi via la barre d'outils) : seul l'ordre vertical /
 *  la mise côte à côte / l'habillage est géré. */
export function computeDropTarget(
  view: EditorView,
  x: number,
  y: number,
  opts: CombineOpts,
): DropTarget | null {
  const combine = findCombineTarget(view, x, y, opts)
  if (combine) return combine
  const wrap = findWrapTarget(view, x, y, opts)
  if (wrap) return wrap
  return nearestGap(collectGaps(view), y)
}
