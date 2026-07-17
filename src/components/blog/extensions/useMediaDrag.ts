import type { NodeViewProps } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { canJoinGrid } from './MediaGrid'
import { computeDropTarget, type DropTarget } from './dropTarget'
import { DragOverlay } from './dragOverlay'

/** Distance (px) avant que le cliquer-maintenir ne devienne un drag. */
const DRAG_THRESHOLD = 5
/** Marge (px) près des bords du viewport déclenchant l'auto-scroll. */
const SCROLL_MARGIN = 80

/** Ancêtre défilant le plus proche de l'éditeur (repli : la fenêtre). */
function scrollableAncestor(el: HTMLElement): HTMLElement | null {
  for (let cur = el.parentElement; cur; cur = cur.parentElement) {
    const { overflowY } = getComputedStyle(cur)
    if ((overflowY === 'auto' || overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight) {
      return cur
    }
  }
  return null
}

/** Drag & drop des médias 100 % pointeur (sans DnD HTML5, source de ghosts
 *  dupliqués) : cliquer-maintenir la prise, un fantôme suit la souris.
 *  Deux cibles possibles, calculées par computeDropTarget :
 *  - gap : ligne d'insertion pleine largeur sur la frontière de blocs la plus
 *    proche — le média y atterrit exactement, en conservant son habillage ;
 *  - combine : survoler le bord gauche/droit d'un autre média (barre + halo)
 *    fusionne les deux en grille côte à côte, façon Canva.
 *  Échap, perte de focus ou changement d'onglet annulent. */
export function useMediaDrag({
  editor,
  getPos,
  node,
}: Pick<NodeViewProps, 'editor' | 'getPos' | 'node'>) {
  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0 || !editor.isEditable) return
    const startPos = getPos()
    if (typeof startPos !== 'number') return

    // Empêche la sélection de texte et le drag natif de l'image.
    event.preventDefault()
    editor.commands.setNodeSelection(startPos)

    const view = editor.view
    const figure = (event.currentTarget as HTMLElement).closest('figure')
    const scroller = scrollableAncestor(view.dom)
    const startX = event.clientX
    const startY = event.clientY

    let dragging = false
    let overlay: DragOverlay | null = null
    let target: DropTarget | null = null

    function startDrag() {
      dragging = true
      figure?.classList.add('is-dragging')
      const img = figure?.querySelector('img')
      overlay = new DragOverlay({ imageSrc: img?.src ?? null, label: '🎬 Vidéo' })
    }

    /* Auto-scroll doux près des bords du viewport (articles longs). */
    function autoScroll(e: PointerEvent) {
      const delta =
        e.clientY < SCROLL_MARGIN
          ? -Math.ceil((SCROLL_MARGIN - e.clientY) / 4)
          : window.innerHeight - e.clientY < SCROLL_MARGIN
            ? Math.ceil((SCROLL_MARGIN - (window.innerHeight - e.clientY)) / 4)
            : 0
      if (!delta) return
      if (scroller) scroller.scrollTop += delta
      else window.scrollBy(0, delta)
    }

    function updateTarget(e: PointerEvent) {
      overlay?.moveGhost(e.clientX, e.clientY)
      autoScroll(e)
      const from = getPos()
      if (typeof from !== 'number') {
        target = null
        overlay?.hideTargets()
        return
      }
      target = computeDropTarget(view, e.clientX, e.clientY, {
        excludeFrom: from,
        excludeTo: from + node.nodeSize,
        prev: target?.kind === 'combine' ? target : null,
        canCombine: (info) =>
          canJoinGrid(view.state.doc, { gridPos: info.gridPos, draggedPos: from }),
      })
      if (!target) overlay?.hideTargets()
      else if (target.kind === 'gap') overlay?.showGap(target)
      else overlay?.showCombine(target)
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onCancel)
      document.removeEventListener('visibilitychange', onVisibility)
      figure?.classList.remove('is-dragging')
      overlay?.destroy()
      overlay = null
    }

    /** Déplace le nœud sur une frontière de blocs, en conservant son alignement
     *  (choisi via la barre d'outils du média, pas par la position du drag). */
    function dropAtGap(pos: number, from: number) {
      // Même ligne : aucune transaction.
      if (pos === from || pos === from + node.nodeSize) return
      const moved = node.type.create(node.attrs, node.content, node.marks)
      const tr = view.state.tr
      tr.delete(from, from + node.nodeSize)
      const insertPos = tr.mapping.map(pos)
      tr.insert(insertPos, moved)
      tr.setSelection(NodeSelection.create(tr.doc, insertPos))
      view.dispatch(tr.scrollIntoView())
    }

    function drop() {
      const t = target
      if (!t) return
      const from = getPos()
      if (typeof from !== 'number') return
      try {
        if (t.kind === 'combine') {
          const combined = editor.commands.combineIntoGrid({
            draggedPos: from,
            targetPos: t.targetPos,
            side: t.side,
            gridPos: t.gridPos,
            gridIndex: t.gridIndex,
          })
          if (combined) return
          // Refusé (grille remplie entre-temps…) : repli en dépôt sous le
          // bloc cible — jamais de non-action silencieuse.
          const topPos = t.gridPos ?? t.targetPos
          const topNode = view.state.doc.nodeAt(topPos)
          dropAtGap(topPos + (topNode?.nodeSize ?? 0), from)
          return
        }
        dropAtGap(t.pos, from)
      } catch (err) {
        console.error('[blog-editor] échec du dépôt du média :', err)
        const pos = getPos()
        if (typeof pos === 'number') editor.commands.setNodeSelection(pos)
      }
    }

    function onMove(e: PointerEvent) {
      if (!dragging) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return
        startDrag()
      }
      e.preventDefault()
      updateTarget(e)
    }

    function onUp() {
      const shouldDrop = dragging
      cleanup()
      if (shouldDrop) drop()
    }

    function onCancel() {
      cleanup()
    }

    function onVisibility() {
      if (document.hidden) cleanup()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && dragging) {
        e.preventDefault()
        cleanup()
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onCancel)
    document.addEventListener('visibilitychange', onVisibility)
  }

  return { onPointerDown }
}
