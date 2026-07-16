import { NodeSelection } from '@tiptap/pm/state'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import type { FigureAlign } from './FigureImage'
import { SIZE_OPTIONS } from './mediaSizes'
import { MediaResizeHandles } from './MediaResizeHandles'
import { useMediaDrag } from './useMediaDrag'

const ALIGN_OPTIONS: { value: FigureAlign; label: string; title: string }[] = [
  { value: 'left', label: '⬅', title: 'Aligner à gauche' },
  { value: 'center', label: '⬛', title: 'Centrer' },
  { value: 'right', label: '➡', title: 'Aligner à droite' },
  { value: 'float-left', label: '◧', title: 'Texte à droite de l’image' },
  { value: 'float-right', label: '◨', title: 'Texte à gauche de l’image' },
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

  const editable = editor.isEditable
  const { onPointerDown } = useMediaDrag({ editor, getPos, node })

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
          <span className="tiptap-drag-grip" contentEditable={false} title="Glisser pour déplacer">
            ⠿
          </span>
        )}
        {editable && isNodeSelected && (
          <MediaResizeHandles onResize={(w) => updateAttributes({ width: w })} />
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
