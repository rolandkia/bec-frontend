import type { DOMOutputSpec } from '@tiptap/pm/model'

/**
 * MENTIONS D'ATHLÈTE DANS UNE LÉGENDE (images et vidéos).
 *
 * La légende reste un ATTRIBUT TEXTE du média (`caption`), éditée dans un
 * simple `<input>` : c'est ce qui la rend fiable au doigt comme au clavier, et
 * ce qui garde le média atomique (glisser, grilles, poignées). Une mention n'y
 * est donc pas un nœud : le texte contient « @Prénom Nom », et l'attribut
 * `captionMentions` retient QUELS « @… » sont de vraies mentions, avec l'id de
 * l'athlète. Au rendu, chacun devient le même lien que dans le corps de
 * l'article (`<a class="mention" data-mention="12">`), donc la même pilule et
 * la même navigation.
 *
 * Aller-retour sans perte : relire le HTML enregistré redonne le texte
 * (`textContent` de la figcaption, « @ » compris) et la liste des mentions (ses
 * `a[data-mention]`). Une légende sans mention produit exactement le HTML
 * d'avant, donc les articles déjà publiés ne bougent pas.
 */
export interface CaptionMention {
  id: number
  label: string
}

/** Définition d'attribut TipTap, partagée par FigureImage et Video. */
export const captionMentionsAttribute = {
  default: [] as CaptionMention[],
  parseHTML: (element: HTMLElement): CaptionMention[] => {
    const caption = element.querySelector('figcaption')
    if (!caption) return []
    const found: CaptionMention[] = []
    for (const a of Array.from(caption.querySelectorAll('a[data-mention]'))) {
      const id = Number(a.getAttribute('data-mention'))
      const label = (a.textContent ?? '').replace(/^@/, '').trim()
      if (Number.isFinite(id) && label && !found.some((m) => m.id === id)) {
        found.push({ id, label })
      }
    }
    return found
  },
  // Rien sur la <figure> elle-même : la mention est rendue DANS la légende.
  renderHTML: () => ({}),
}

/** Ne garde que les mentions dont le « @label » figure encore dans le texte. */
export function pruneMentions(caption: string, mentions: CaptionMention[]): CaptionMention[] {
  return mentions.filter((m) => caption.includes(`@${m.label}`))
}

/** Découpe la légende en texte et mentions, dans l'ordre. */
export function captionSegments(
  caption: string,
  mentions: CaptionMention[],
): (string | CaptionMention)[] {
  const live = pruneMentions(caption, mentions)
  if (!live.length) return caption ? [caption] : []
  // Libellés les plus longs d'abord : « @Marie Dupont-Durand » ne doit pas être
  // pris pour « @Marie Dupont » suivi de « -Durand ».
  const sorted = [...live].sort((a, b) => b.label.length - a.label.length)
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(sorted.map((m) => `@${escape(m.label)}`).join('|'), 'g')
  const out: (string | CaptionMention)[] = []
  let last = 0
  for (const match of caption.matchAll(pattern)) {
    const at = match.index ?? 0
    if (at > last) out.push(caption.slice(last, at))
    out.push(sorted.find((m) => `@${m.label}` === match[0])!)
    last = at + match[0].length
  }
  if (last < caption.length) out.push(caption.slice(last))
  return out
}

/** `<figcaption>` sérialisée, mentions comprises. */
export function captionSpec(caption: string, mentions: CaptionMention[]): DOMOutputSpec {
  const children = captionSegments(caption, mentions).map((part) =>
    typeof part === 'string'
      ? part
      : ([
          'a',
          { href: `/athletes/${part.id}`, 'data-mention': String(part.id), class: 'mention' },
          `@${part.label}`,
        ] as const),
  )
  return ['figcaption', {}, ...children] as DOMOutputSpec
}
