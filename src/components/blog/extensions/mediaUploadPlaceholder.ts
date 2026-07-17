import { Extension } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

interface AddAction {
  add: { id: string; pos: number; previewUrl: string | null }
}
interface RemoveAction {
  remove: { id: string }
}

export const uploadPlaceholderKey = new PluginKey<DecorationSet>('mediaUploadPlaceholder')

function buildWidget(previewUrl: string | null): HTMLElement {
  const el = document.createElement('div')
  el.className = 'tiptap-upload-placeholder'
  if (previewUrl) {
    const img = document.createElement('img')
    img.src = previewUrl
    el.appendChild(img)
  } else {
    el.textContent = '🎬'
  }
  const spinner = document.createElement('span')
  spinner.className = 'tiptap-upload-spinner'
  el.appendChild(spinner)
  return el
}

/** Placeholders d'upload : de simples décorations widget (aperçu estompé +
 *  spinner). La position suit les éditions concurrentes via le mapping, et
 *  une décoration n'apparaît jamais dans getHTML() — aucune URL blob ne peut
 *  donc fuir dans le contenu sauvegardé, même en sauvegardant pendant
 *  l'envoi. */
export const MediaUploadPlaceholder = Extension.create({
  name: 'mediaUploadPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: uploadPlaceholderKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            let next = set.map(tr.mapping, tr.doc)
            const action = tr.getMeta(uploadPlaceholderKey) as AddAction | RemoveAction | undefined
            if (action && 'add' in action) {
              const widget = Decoration.widget(action.add.pos, buildWidget(action.add.previewUrl), {
                id: action.add.id,
              })
              next = next.add(tr.doc, [widget])
            } else if (action && 'remove' in action) {
              next = next.remove(
                next.find(undefined, undefined, (spec) => spec.id === action.remove.id),
              )
            }
            return next
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

/** Position courante (mappée) du placeholder, ou null s'il a disparu
 *  (zone supprimée pendant l'envoi). */
export function findPlaceholder(state: EditorState, id: string): number | null {
  const set = uploadPlaceholderKey.getState(state)
  const found = set?.find(undefined, undefined, (spec) => spec.id === id) ?? []
  return found.length ? found[0].from : null
}
