import { NodeSelection } from '@tiptap/pm/state'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import type { FigureAlign } from './FigureImage'
import { MEDIA_GRID_NAME } from './MediaGrid'
import { SIZE_OPTIONS } from './mediaSizes'
import { MediaResizeHandles } from './MediaResizeHandles'
import { useMediaDrag } from './useMediaDrag'

const ALIGN_OPTIONS: { value: FigureAlign; label: string; title: string }[] = [
  { value: 'float-left', label: '◧', title: 'À gauche, texte à droite' },
  { value: 'center', label: '⬛', title: 'Centrer' },
  { value: 'float-right', label: '◨', title: 'À droite, texte à gauche' },
]

export function FigureImageView(props: NodeViewProps) {
  const { node, updateAttributes, editor, getPos } = props
  const { src, alt, caption, width, align } = node.attrs as {
    src: string
    alt: string | null
    caption: string
    width: number | null
    align: FigureAlign
  }

  // Le prop `selected` de TipTap est vrai pour tout nœud couvert par une
  // sélection de plage : on ne veut réagir qu'à une vraie NodeSelection sur CE
  // nœud (sinon surligner du texte « sélectionne » toutes les images).
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

  function handleLiftFromGrid() {
    const pos = getPos()
    if (typeof pos !== 'number') return
    editor.chain().focus().liftFromMediaGrid(pos).run()
  }

  function handleDelete() {
    const pos = getPos()
    if (pos === undefined) return
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`fig-${align}${width ? ' fig-sized' : ''} tiptap-figure${isNodeSelected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}`}
      style={width ? { width: `${width}%` } : undefined}
    >
      {/* Drag pointeur custom : cliquer-maintenir l'image et bouger pour la
          déplacer n'importe où (la ligne d'insertion montre l'habillage cible). */}
      <div
        className={`tiptap-media-wrap${isNodeSelected ? ' is-selected' : ''}${editable ? ' tiptap-grab' : ''}`}
        onPointerDown={editable ? onPointerDown : undefined}
      >
        <img src={src} alt={alt ?? ''} draggable={false} />
        {editable && (
          <span
            className="tiptap-drag-grip"
            contentEditable={false}
            title="Glisser pour déplacer (ou vers le bord d'un média pour les mettre côte à côte)"
          >
            ⠿
          </span>
        )}
        {editable && isNodeSelected && (
          <MediaResizeHandles container={isGridItem ? 'grid' : 'column'} onResize={handleResize} />
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
              {ALIGN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  className={align === opt.value ? 'is-active' : ''}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    updateAttributes({ align: opt.value })
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <span className="tiptap-node-toolbar-sep" />
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
