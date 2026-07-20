import { NodeSelection } from '@tiptap/pm/state'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import type { FigureAlign } from './FigureImage'
import { MEDIA_GRID_NAME } from './MediaGrid'
import { MEDIA_TEXT_NAME, parentMediaTextPos, type MediaTextSide } from './MediaText'
import { SIZE_OPTIONS } from './mediaSizes'
import { MediaResizeHandles } from './MediaResizeHandles'
import { useMediaDrag } from './useMediaDrag'

/** Choix de disposition d'un média. `center` = média seul centré ; `left`/
 *  `right` = média flottant, le texte s'enroule de l'autre côté. */
type LayoutChoice = MediaTextSide | 'center'

const LAYOUT_OPTIONS: { value: LayoutChoice; label: string; title: string }[] = [
  { value: 'left', label: '◧', title: 'Média à gauche, texte enroulé à droite' },
  { value: 'center', label: '⬛', title: 'Média centré seul' },
  { value: 'right', label: '◨', title: 'Média à droite, texte enroulé à gauche' },
]

export function VideoView(props: NodeViewProps) {
  const { node, updateAttributes, editor, getPos } = props
  const { src, caption, width, align } = node.attrs as {
    src: string
    caption: string
    width: number | null
    align: FigureAlign
  }

  // Le prop `selected` de TipTap est vrai pour tout nœud couvert par une
  // sélection de plage : on ne veut réagir qu'à une vraie NodeSelection sur CE
  // nœud (sinon surligner du texte « sélectionne » toutes les vidéos).
  const isNodeSelected = useEditorState({
    editor,
    selector: ({ editor }) => {
      const sel = editor.state.selection
      return sel instanceof NodeSelection && sel.from === getPos()
    },
  })

  // Enfant d'une grille média : alignement/tailles n'ont plus de sens (la
  // rangée gère le layout), le resize ajuste la paire de voisins.
  const isGridItem = useEditorState({
    editor,
    selector: ({ editor }) => {
      const pos = getPos()
      if (typeof pos !== 'number' || pos > editor.state.doc.content.size) return false
      return editor.state.doc.resolve(pos).parent.type.name === MEDIA_GRID_NAME
    },
  })

  // Enfant d'un bloc 2 colonnes média+texte : le côté du média est un attribut
  // du bloc parent, le resize ajuste la répartition média/colonne.
  const mediaTextSide = useEditorState({
    editor,
    selector: ({ editor }): MediaTextSide | null => {
      const pos = getPos()
      if (typeof pos !== 'number' || pos > editor.state.doc.content.size) return null
      const $pos = editor.state.doc.resolve(pos)
      if ($pos.parent.type.name !== MEDIA_TEXT_NAME) return null
      return $pos.parent.attrs.imageSide === 'right' ? 'right' : 'left'
    },
  })
  const isMediaTextItem = mediaTextSide !== null

  const editable = editor.isEditable
  const { onPointerDown } = useMediaDrag({ editor, getPos, node })

  function handleResize(widthPercent: number, dir: 1 | -1) {
    if (!isGridItem) {
      updateAttributes({ width: widthPercent })
      return
    }
    const pos = getPos()
    if (typeof pos !== 'number') return
    editor.commands.setGridItemSize(pos, widthPercent, dir === 1 ? 'right' : 'left')
  }

  function handleLayout(choice: LayoutChoice) {
    const pos = getPos()
    if (typeof pos !== 'number') return
    // Article hérité (bloc 2 colonnes `MediaText`) : comportement d'origine conservé.
    if (isMediaTextItem) {
      const mtPos = parentMediaTextPos(editor.state.doc, pos)
      if (mtPos == null) return
      if (choice === 'center') editor.chain().focus().unwrapMediaText(mtPos).run()
      else editor.chain().focus().setMediaTextSide(mtPos, choice).run()
      return
    }
    // Média autonome : habillage par média flottant (le texte alentour s'enroule).
    if (choice === 'center') {
      updateAttributes({ align: 'center' })
      return
    }
    updateAttributes({
      align: choice === 'left' ? 'float-left' : 'float-right',
      width: width ?? 50,
    })
  }

  function handleLiftFromGrid() {
    const pos = getPos()
    if (typeof pos !== 'number') return
    editor.chain().focus().liftFromMediaGrid(pos).run()
  }

  function handleDelete() {
    const pos = getPos()
    if (typeof pos !== 'number') return
    // Dans un bloc 2 colonnes : retirer le média tout en gardant le texte.
    if (isMediaTextItem) {
      const mtPos = parentMediaTextPos(editor.state.doc, pos)
      if (mtPos != null) {
        editor.chain().focus().unwrapMediaText(mtPos, false).run()
        return
      }
    }
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
  }

  const activeLayout: LayoutChoice = isMediaTextItem
    ? (mediaTextSide as MediaTextSide)
    : align === 'float-left'
      ? 'left'
      : align === 'float-right'
        ? 'right'
        : 'center'
  const resizeContainer = isGridItem ? 'grid' : isMediaTextItem ? 'mediaText' : 'column'

  return (
    <NodeViewWrapper
      as="figure"
      className={`fig-${align}${width ? ' fig-sized' : ''} tiptap-figure${isNodeSelected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}`}
      style={width ? { width: `${width}%` } : undefined}
    >
      {/* La vidéo garde ses contrôles cliquables : seule la poignée ⠿ sert de
          prise pour le drag pointeur custom. */}
      <div className={`tiptap-media-wrap${isNodeSelected ? ' is-selected' : ''}`}>
        <video src={src} controls />
        {editable && (
          <span
            className="tiptap-drag-grip"
            contentEditable={false}
            title="Glisser pour déplacer"
            onPointerDown={onPointerDown}
          >
            ⠿
          </span>
        )}
        {editable && isNodeSelected && (
          <MediaResizeHandles container={resizeContainer} onResize={handleResize} />
        )}
      </div>

      {editable ? (
        <input
          className="tiptap-caption-input"
          value={caption ?? ''}
          placeholder="Légende (optionnelle)…"
          onChange={(e) => updateAttributes({ caption: e.target.value })}
        />
      ) : (
        caption && <figcaption>{caption}</figcaption>
      )}

      {editable && isNodeSelected && (
        <div className="tiptap-node-toolbar" contentEditable={false}>
          {!isGridItem && (
            <>
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  className={activeLayout === opt.value ? 'is-active' : ''}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleLayout(opt.value)
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <span className="tiptap-node-toolbar-sep" />
            </>
          )}
          {/* Tailles rapides : uniquement pour un média autonome (dans une grille
              ou un bloc 2 colonnes, la largeur se règle par glisser des poignées). */}
          {!isGridItem && !isMediaTextItem && (
            <>
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.width}
                  type="button"
                  title={opt.title}
                  className={width === opt.width ? 'is-active' : ''}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    updateAttributes({ width: opt.width })
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <span className="tiptap-node-toolbar-sep" />
            </>
          )}
          {isGridItem && (
            <>
              <button
                type="button"
                title="Sortir de la grille"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleLiftFromGrid()
                }}
              >
                ⇱
              </button>
              <span className="tiptap-node-toolbar-sep" />
            </>
          )}
          <button
            type="button"
            title="Supprimer"
            className="tiptap-node-toolbar-delete"
            onMouseDown={(e) => {
              e.preventDefault()
              handleDelete()
            }}
          >
            ✕
          </button>
        </div>
      )}
    </NodeViewWrapper>
  )
}
