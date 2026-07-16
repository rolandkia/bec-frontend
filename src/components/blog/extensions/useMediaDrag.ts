import type { NodeViewProps } from '@tiptap/react'
import { Fragment, Slice } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
import type { FigureAlign } from './FigureImage'

/** Distance (px) avant que le cliquer-maintenir ne devienne un drag. */
const DRAG_THRESHOLD = 5
/** Marge (px) près des bords du viewport déclenchant l'auto-scroll. */
const SCROLL_MARGIN = 80

/** Drag & drop des médias 100 % pointeur (sans DnD HTML5, source de ghosts
 *  dupliqués) : cliquer-maintenir la prise, un fantôme suit la souris et une
 *  ligne d'insertion montre où le média atterrira. La zone horizontale du
 *  dépôt règle l'habillage : tiers gauche → texte à droite, centre → centré,
 *  tiers droit → texte à gauche. Échap annule. */
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
    const startX = event.clientX
    const startY = event.clientY

    let dragging = false
    let ghost: HTMLDivElement | null = null
    let indicator: HTMLDivElement | null = null
    let target: { pos: number; align: FigureAlign } | null = null

    const slice = new Slice(Fragment.from(node), 0, 0)

    function startDrag() {
      dragging = true
      figure?.classList.add('is-dragging')

      ghost = document.createElement('div')
      ghost.className = 'tiptap-drag-ghost'
      const img = figure?.querySelector('img')
      if (img) {
        const clone = document.createElement('img')
        clone.src = (img as HTMLImageElement).src
        ghost.appendChild(clone)
      } else {
        ghost.textContent = '🎬 Vidéo'
      }
      document.body.appendChild(ghost)

      indicator = document.createElement('div')
      indicator.className = 'tiptap-drop-indicator'
      document.body.appendChild(indicator)
    }

    function updateTarget(e: PointerEvent) {
      if (ghost) {
        ghost.style.left = `${e.clientX + 14}px`
        ghost.style.top = `${e.clientY + 14}px`
      }

      // Auto-scroll doux près des bords du viewport (articles longs).
      if (e.clientY < SCROLL_MARGIN) {
        window.scrollBy(0, -Math.ceil((SCROLL_MARGIN - e.clientY) / 4))
      } else if (window.innerHeight - e.clientY < SCROLL_MARGIN) {
        window.scrollBy(0, Math.ceil((SCROLL_MARGIN - (window.innerHeight - e.clientY)) / 4))
      }

      const coords = view.posAtCoords({ left: e.clientX, top: e.clientY })
      if (!coords) {
        target = null
        if (indicator) indicator.style.display = 'none'
        return
      }

      const pos = dropPoint(view.state.doc, coords.pos, slice) ?? coords.pos
      const rect = view.dom.getBoundingClientRect()
      const frac = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5
      const align: FigureAlign =
        frac < 1 / 3 ? 'float-left' : frac > 2 / 3 ? 'float-right' : 'center'
      target = { pos, align }

      if (indicator) {
        // La ligne occupe le tiers correspondant à l'habillage cible.
        const third = rect.width / 3
        const left =
          align === 'float-left'
            ? rect.left
            : align === 'float-right'
              ? rect.left + 2 * third
              : rect.left + third
        const lineY = view.coordsAtPos(pos).top
        indicator.style.display = 'block'
        indicator.style.left = `${left}px`
        indicator.style.top = `${lineY - 2}px`
        indicator.style.width = `${third}px`
      }
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKeyDown)
      figure?.classList.remove('is-dragging')
      ghost?.remove()
      indicator?.remove()
    }

    function drop() {
      if (!target) return
      const from = getPos()
      if (typeof from !== 'number') return
      try {
        const attrs: Record<string, unknown> = { ...node.attrs, align: target.align }
        // Habillage : une image sans largeur (ou quasi pleine largeur) ne
        // laisserait aucune place au texte → largeur raisonnable par défaut.
        const width = node.attrs.width as number | null
        if ((target.align === 'float-left' || target.align === 'float-right') && (!width || width > 66)) {
          attrs.width = 50
        }
        const moved = node.type.create(attrs, node.content, node.marks)
        const tr = view.state.tr
        tr.delete(from, from + node.nodeSize)
        const mapped = tr.mapping.map(target.pos)
        const insertPos = dropPoint(tr.doc, mapped, slice) ?? mapped
        tr.insert(insertPos, moved)
        tr.setSelection(NodeSelection.create(tr.doc, insertPos))
        view.dispatch(tr.scrollIntoView())
      } catch {
        // Position de dépôt invalide : on abandonne, le document reste intact
        // (la transaction n'a pas été dispatchée).
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
  }

  return { onPointerDown }
}
