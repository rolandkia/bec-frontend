import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import type { FigureAlign } from './FigureImage'
import { SIZE_OPTIONS } from './mediaSizes'
import { MediaResizeHandles } from './MediaResizeHandles'
import { useMediaDrag } from './useMediaDrag'

const ALIGN_OPTIONS: { value: FigureAlign; label: string; title: string }[] = [
  { value: 'left', label: '⬅', title: 'Aligner à gauche' },
  { value: 'center', label: '⬛', title: 'Centrer' },
  { value: 'right', label: '➡', title: 'Aligner à droite' },
  { value: 'float-left', label: '◧', title: 'Texte à droite de la vidéo' },
  { value: 'float-right', label: '◨', title: 'Texte à gauche de la vidéo' },
]

export function VideoView(props: NodeViewProps) {
  const { node, updateAttributes, selected, editor, getPos } = props
  const { src, caption, width, align } = node.attrs as {
    src: string
    caption: string
    width: number | null
    align: FigureAlign
  }

  const editable = editor.isEditable
  const { onPointerDown } = useMediaDrag({ editor, getPos, node })

  return (
    <NodeViewWrapper
      as="figure"
      className={`fig-${align}${width ? ' fig-sized' : ''} tiptap-figure${selected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}`}
      style={width ? { width: `${width}%` } : undefined}
    >
      {/* La vidéo garde ses contrôles cliquables : seule la poignée ⠿ sert de
          prise pour le drag pointeur custom. */}
      <div className="tiptap-media-wrap">
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
        {editable && selected && (
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

      {editable && selected && (
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
        </div>
      )}
    </NodeViewWrapper>
  )
}
