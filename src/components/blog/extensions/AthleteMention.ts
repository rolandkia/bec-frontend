import { Node, mergeAttributes } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import { createMentionRenderer } from '../mentionPopupRenderer'
import type { MentionItem } from '../MentionPopup'

const mentionPluginKey = new PluginKey('athleteMention')

/** Athlètes proposés pour une saisie « @… » — corps de l'article ET légendes
 *  (cf. CaptionInput) : même filtre, même plafond, donc mêmes suggestions. */
export function matchAthletes(all: MentionItem[], query: string, limit = 8): MentionItem[] {
  const q = query.trim().toLowerCase()
  const matches = q ? all.filter((a) => `${a.prenom} ${a.nom}`.toLowerCase().includes(q)) : all
  return matches.slice(0, limit)
}

/** Fabrique le nœud de mention d'athlète. `getAthletes` est lu paresseusement à
 *  chaque frappe : l'éditeur peut être créé avant que la liste (react-query) soit
 *  chargée, sans avoir à être recréé quand elle arrive. */
export function createAthleteMention(getAthletes: () => MentionItem[]) {
  return Node.create({
    name: 'athleteMention',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-mention'),
          renderHTML: (attrs) => (attrs.id ? { 'data-mention': String(attrs.id) } : {}),
        },
        label: {
          default: '',
          // Le texte stocké est « @Prénom Nom » : on retire le « @ » de tête.
          parseHTML: (element) => (element.textContent ?? '').replace(/^@/, ''),
          renderHTML: () => ({}),
        },
      }
    },

    parseHTML() {
      // Priorité au-dessus des 50 par défaut : une mention EST aussi un
      // `a[href]`, et la marque Link (réactivée dans BlogEditor) la lirait
      // sinon comme un simple lien — la pilule et l'id de l'athlète seraient
      // perdus à la réouverture de l'article.
      return [{ tag: 'a[data-mention]', priority: 100 }]
    },

    renderHTML({ node }) {
      const { id, label } = node.attrs
      return [
        'a',
        mergeAttributes({
          href: `/athletes/${id}`,
          'data-mention': String(id),
          class: 'mention',
        }),
        `@${label}`,
      ]
    },

    renderText({ node }) {
      return `@${node.attrs.label}`
    },

    addProseMirrorPlugins() {
      return [
        Suggestion<MentionItem>({
          editor: this.editor,
          pluginKey: mentionPluginKey,
          char: '@',
          allowSpaces: true,
          items: ({ query }) => matchAthletes(getAthletes(), query),
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'athleteMention',
                  attrs: { id: props.id, label: `${props.prenom} ${props.nom}` },
                },
                { type: 'text', text: ' ' },
              ])
              .run()
          },
          render: createMentionRenderer(),
        }),
      ]
    },
  })
}
