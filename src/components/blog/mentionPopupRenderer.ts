import { createElement, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { MentionPopup, type MentionItem, type MentionPopupHandle } from './MentionPopup'

type RenderReturn = ReturnType<NonNullable<SuggestionOptions<MentionItem>['render']>>

/** Positionne le conteneur du popup sous le curseur de saisie, en le faisant
 *  remonter au-dessus s'il déborderait en bas de la fenêtre. */
function place(container: HTMLElement, clientRect: (() => DOMRect | null) | null | undefined) {
  const rect = clientRect?.()
  if (!rect) return
  const margin = 6
  container.style.left = `${rect.left}px`
  const spaceBelow = window.innerHeight - rect.bottom
  if (spaceBelow < 260 && rect.top > spaceBelow) {
    // Ancrer par le bas : remonte au-dessus de la ligne de saisie.
    container.style.top = 'auto'
    container.style.bottom = `${window.innerHeight - rect.top + margin}px`
  } else {
    container.style.bottom = 'auto'
    container.style.top = `${rect.bottom + margin}px`
  }
}

/** Fabrique l'objet `render` attendu par `Suggestion` : monte un MentionPopup
 *  React dans un conteneur `fixed` de document.body et forwarde la nav clavier. */
export function createMentionRenderer(): NonNullable<SuggestionOptions<MentionItem>['render']> {
  return () => {
    let container: HTMLDivElement | null = null
    let root: Root | null = null
    const popupRef = createRef<MentionPopupHandle>()

    function render(props: SuggestionProps<MentionItem>) {
      if (!container || !root) return
      root.render(
        createElement(MentionPopup, {
          ref: popupRef,
          items: props.items,
          onSelect: (item: MentionItem) => props.command(item),
        }),
      )
      place(container, props.clientRect)
    }

    const handlers: RenderReturn = {
      onStart: (props) => {
        container = document.createElement('div')
        container.className = 'mention-popup-container'
        container.style.position = 'fixed'
        container.style.zIndex = '120'
        document.body.appendChild(container)
        root = createRoot(container)
        render(props)
      },
      onUpdate: (props) => render(props),
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') return false
        return popupRef.current?.onKeyDown(props.event) ?? false
      },
      onExit: () => {
        const toUnmount = root
        const toRemove = container
        root = null
        container = null
        // Démontage différé : évite l'avertissement React si onExit est appelé
        // pendant un rendu.
        queueMicrotask(() => {
          toUnmount?.unmount()
          toRemove?.remove()
        })
      },
    }
    return handlers
  }
}
