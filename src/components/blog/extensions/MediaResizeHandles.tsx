import { clampMediaWidth } from './mediaSizes'

/** Une poignée par coin. `dir` = sens dans lequel un déplacement horizontal
 *  agrandit le média (coins droits : vers la droite ; coins gauches : vers la
 *  gauche). La hauteur suit automatiquement (ratio conservé). */
const HANDLES = [
  { key: 'nw', dir: -1 },
  { key: 'ne', dir: 1 },
  { key: 'sw', dir: -1 },
  { key: 'se', dir: 1 },
] as const

export function MediaResizeHandles({
  onResize,
  container = 'column',
}: {
  /** Nouvelle largeur en % du conteneur ; `dir` indique le côté saisi
   *  (1 = poignées droites, -1 = gauches) pour choisir le voisin qui
   *  compense dans une grille. */
  onResize: (widthPercent: number, dir: 1 | -1) => void
  /** Référence de mesure : la colonne de contenu, ou la grille média. */
  container?: 'column' | 'grid'
}) {
  function startResize(event: React.PointerEvent, dir: 1 | -1) {
    event.preventDefault()
    event.stopPropagation()
    const handle = event.currentTarget as HTMLElement
    const figure = handle.closest('figure') as HTMLElement | null
    const column = handle.closest(container === 'grid' ? '.media-grid' : '.ProseMirror') as HTMLElement | null
    if (!figure || !column) return

    const columnWidth = column.getBoundingClientRect().width
    const startWidth = figure.getBoundingClientRect().width
    const startX = event.clientX
    if (columnWidth <= 0) return

    function onMove(e: PointerEvent) {
      const delta = (e.clientX - startX) * dir
      const nextPx = startWidth + delta
      onResize(clampMediaWidth((nextPx / columnWidth) * 100), dir)
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <>
      {HANDLES.map((h) => (
        <span
          key={h.key}
          className={`tiptap-resize-handle ${h.key}`}
          contentEditable={false}
          onPointerDown={(e) => startResize(e, h.dir)}
        />
      ))}
    </>
  )
}
