import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../../api/athletes'
import { STATIC_DATA } from '../../api/staleTime'
import { MentionPopup, type MentionPopupHandle } from './MentionPopup'
import { matchAthletes } from './extensions/AthleteMention'
import { pruneMentions, type CaptionMention } from './extensions/captionMentions'

/** Au-delà, ce qui suit « @ » n'est plus un nom qu'on est en train de taper. */
const QUERY_MAX = 30

/**
 * « @ » en cours de saisie juste avant le curseur, ou `null`.
 *
 * Le « @ » doit ouvrir un mot (début de légende, espace, parenthèse,
 * guillemet) : « contact@bec.fr » ne déclenche rien. La requête peut contenir
 * une espace (« @Jean Du »), pas deux — à deux, on écrit une phrase.
 */
function findTrigger(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  if (at > 0 && !/[\s("«'’]/.test(before[at - 1])) return null
  const query = before.slice(at + 1)
  if (query.length > QUERY_MAX || (query.match(/\s/g)?.length ?? 0) > 1) return null
  return { start: at, query }
}

/**
 * Champ de légende d'un média de l'éditeur, avec les mêmes suggestions « @ »
 * que le corps de l'article (cf. captionMentions.ts pour le stockage).
 *
 * Volontairement un `<input>` et non un mini-éditeur : la légende tient sur une
 * ligne, et un champ natif garde la correction orthographique, le collage et
 * la saisie au doigt sans surprise. Les athlètes effectivement liés sont
 * rappelés sous le champ, puisqu'un `<input>` ne peut pas les surligner.
 */
export function CaptionInput({
  value,
  mentions,
  onChange,
  placeholder = 'Légende… (@ pour un athlète)',
}: {
  value: string
  mentions: CaptionMention[]
  onChange: (caption: string, mentions: CaptionMention[]) => void
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<MentionPopupHandle>(null)

  /* Valeur LOCALE du champ, mise à jour dans le même événement que la frappe.
     La légende vit dans un attribut du nœud ProseMirror : `onChange` passe par
     une transaction, et le nouveau `value` ne revient au composant qu'au rendu
     suivant de la vue de nœud. Entre les deux, React rétablissait l'ANCIENNE
     valeur du champ contrôlé, puis posait la nouvelle — le curseur partait au
     bout à chaque frappe : taper « ABC » au milieu d'une légende donnait « A »
     au milieu et « BC » à la fin. On ne suit la valeur du nœud que hors saisie
     (annuler/rétablir, restauration d'un brouillon). */
  const [text, setText] = useState(value)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(value)
  }, [value])
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null)
  /** « @ » refermé par Échap : on ne le rouvre pas tant qu'on reste dessus. */
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [box, setBox] = useState<CSSProperties | null>(null)

  // Même clé que BlogEditor : la liste est déjà en cache quand on arrive ici.
  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: listAthletes,
    staleTime: STATIC_DATA,
  })
  const open = trigger !== null && trigger.start !== dismissedAt
  const items = open ? matchAthletes(athletes ?? [], trigger.query) : []

  function sync(text: string, caret: number | null) {
    const next = caret === null ? null : findTrigger(text, caret)
    setTrigger(next)
    if (!next || next.start !== dismissedAt) setDismissedAt(null)
  }

  function select(item: { id: number; prenom: string; nom: string }) {
    const input = inputRef.current
    if (!input || !trigger) return
    const label = `${item.prenom} ${item.nom}`
    const caret = input.selectionStart ?? text.length
    const next = `${text.slice(0, trigger.start)}@${label} ${text.slice(caret)}`
    const known = mentions.some((m) => m.id === item.id)
    setText(next)
    onChange(next, pruneMentions(next, known ? mentions : [...mentions, { id: item.id, label }]))
    setTrigger(null)
    const nextCaret = trigger.start + label.length + 2
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  // La liste suit le champ : sous lui, ou au-dessus s'il est près du bas de
  // l'écran. Recalculée au défilement (l'éditeur défile sous elle) et au
  // redimensionnement, tant qu'elle est ouverte.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const r = inputRef.current?.getBoundingClientRect()
      if (!r) return
      const below = window.innerHeight - r.bottom
      const left = Math.max(8, Math.min(r.left + r.width / 2 - 120, window.innerWidth - 248))
      setBox(
        below < 260 && r.top > below
          ? { position: 'fixed', left, bottom: window.innerHeight - r.top + 6, zIndex: 120 }
          : { position: 'fixed', left, top: r.bottom + 6, zIndex: 120 },
      )
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  const linked = pruneMentions(text, mentions)

  return (
    <>
      <input
        ref={inputRef}
        className="tiptap-caption-input"
        value={text}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
        onFocus={() => (focused.current = true)}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          onChange(next, pruneMentions(next, mentions))
          sync(next, e.target.selectionStart)
        }}
        // Déplacer le curseur (clic, flèches) peut entrer dans un « @… » ou en
        // sortir : la liste doit suivre.
        onSelect={(e) => sync(e.currentTarget.value, e.currentTarget.selectionStart)}
        onBlur={() => {
          focused.current = false
          setTrigger(null)
        }}
        onKeyDown={(e) => {
          if (!open) return
          if (e.key === 'Escape') {
            e.preventDefault()
            setDismissedAt(trigger.start)
            return
          }
          if (e.key === 'Tab' && items.length) {
            e.preventDefault()
            select(items[0])
            return
          }
          if (popupRef.current?.onKeyDown(e.nativeEvent)) e.preventDefault()
        }}
      />
      {linked.length > 0 && (
        <p className="tiptap-caption-mentions" contentEditable={false}>
          <span>Lien vers la fiche :</span>
          {linked.map((m) => (
            <span key={m.id} className="mention">
              @{m.label}
            </span>
          ))}
        </p>
      )}
      {open &&
        box &&
        createPortal(
          <div style={box} className="mention-popup-container">
            <MentionPopup ref={popupRef} items={items} onSelect={select} />
          </div>,
          document.body,
        )}
    </>
  )
}
