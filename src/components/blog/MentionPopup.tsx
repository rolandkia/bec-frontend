import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface MentionItem {
  id: number
  prenom: string
  nom: string
}

export interface MentionPopupHandle {
  /** Renvoie true si la touche a été consommée (nav clavier). */
  onKeyDown: (event: KeyboardEvent) => boolean
}

/** Liste déroulante des athlètes proposés après « @ ». Navigation clavier
 *  (flèches / Entrée / Échap) pilotée par le renderer via la poignée impérative,
 *  et sélection à la souris. Avatar en initiales, façon AthleteCard. */
export const MentionPopup = forwardRef<
  MentionPopupHandle,
  { items: MentionItem[]; onSelect: (item: MentionItem) => void }
>(function MentionPopup({ items, onSelect }, ref) {
  const [selected, setSelected] = useState(0)

  // Toute nouvelle liste (frappe d'un caractère) réinitialise la sélection.
  useEffect(() => setSelected(0), [items])

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event) => {
        if (items.length === 0) return false
        if (event.key === 'ArrowUp') {
          setSelected((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelected((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          onSelect(items[selected])
          return true
        }
        return false
      },
    }),
    [items, selected, onSelect],
  )

  if (items.length === 0) {
    return (
      <div className="mention-popup">
        <div className="mention-popup-empty">Aucun athlète</div>
      </div>
    )
  }

  return (
    <div className="mention-popup">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          className={`mention-popup-item${index === selected ? ' is-selected' : ''}`}
          onMouseEnter={() => setSelected(index)}
          onMouseDown={(e) => {
            // mousedown (pas click) : évite que l'éditeur perde le focus avant
            // l'insertion.
            e.preventDefault()
            onSelect(item)
          }}
        >
          <span className="mention-popup-avatar">
            {item.prenom[0]}
            {item.nom[0]}
          </span>
          <span className="mention-popup-name">
            {item.prenom} {item.nom}
          </span>
        </button>
      ))}
    </div>
  )
})
