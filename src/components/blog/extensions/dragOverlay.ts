import type { CombineTarget, GapTarget } from './dropTarget'

/** Feedback visuel du drag : fantôme sous le curseur, ligne d'insertion de
 *  gap, barre + halo de combinaison. Simples overlays `position: fixed` en
 *  `pointer-events: none` sur <body> — hors de React et de ProseMirror, donc
 *  insensibles aux overflow/floats de l'éditeur, et sans aucune transaction
 *  pendant le drag. */
export class DragOverlay {
  private ghost: HTMLDivElement
  private gapLine: HTMLDivElement
  private combineBar: HTMLDivElement
  private combineOutline: HTMLDivElement

  constructor(preview: { imageSrc?: string | null; label?: string }) {
    this.ghost = document.createElement('div')
    this.ghost.className = 'tiptap-drag-ghost'
    if (preview.imageSrc) {
      const img = document.createElement('img')
      img.src = preview.imageSrc
      this.ghost.appendChild(img)
    } else {
      this.ghost.textContent = preview.label ?? ''
    }

    this.gapLine = document.createElement('div')
    this.gapLine.className = 'tiptap-drop-indicator'
    this.combineBar = document.createElement('div')
    this.combineBar.className = 'tiptap-combine-indicator'
    this.combineOutline = document.createElement('div')
    this.combineOutline.className = 'tiptap-combine-outline'

    for (const el of [this.ghost, this.gapLine, this.combineBar, this.combineOutline]) {
      el.style.display = 'none'
      document.body.appendChild(el)
    }
  }

  moveGhost(x: number, y: number) {
    this.ghost.style.display = 'block'
    this.ghost.style.left = `${x + 14}px`
    this.ghost.style.top = `${y + 14}px`
  }

  /** Ligne horizontale pleine colonne sur le gap de destination. */
  showGap(target: GapTarget) {
    this.hideCombine()
    this.gapLine.style.display = 'block'
    this.gapLine.style.left = `${target.left}px`
    this.gapLine.style.width = `${target.width}px`
    this.gapLine.style.top = `${target.y - 2}px`
  }

  /** Barre verticale sur le bord visé du média cible + halo sur celui-ci. */
  showCombine(target: CombineTarget) {
    this.gapLine.style.display = 'none'
    const { rect, side } = target
    this.combineOutline.style.display = 'block'
    this.combineOutline.style.left = `${rect.left}px`
    this.combineOutline.style.top = `${rect.top}px`
    this.combineOutline.style.width = `${rect.width}px`
    this.combineOutline.style.height = `${rect.height}px`
    this.combineBar.style.display = 'block'
    this.combineBar.style.top = `${rect.top}px`
    this.combineBar.style.height = `${rect.height}px`
    this.combineBar.style.left = `${side === 'left' ? rect.left - 7 : rect.right + 3}px`
  }

  hideTargets() {
    this.gapLine.style.display = 'none'
    this.hideCombine()
  }

  private hideCombine() {
    this.combineBar.style.display = 'none'
    this.combineOutline.style.display = 'none'
  }

  destroy() {
    this.ghost.remove()
    this.gapLine.remove()
    this.combineBar.remove()
    this.combineOutline.remove()
  }
}
