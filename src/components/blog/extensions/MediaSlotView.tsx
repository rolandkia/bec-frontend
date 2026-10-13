import { useRef, useState } from 'react'
import { NodeSelection } from '@tiptap/pm/state'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { FolderOpen, ImagePlus, ImageUp } from 'lucide-react'
import { ACCEPT_MEDIA } from '../../../lib/mediaKind'
import { GalleryMediaPicker } from '../GalleryMediaPicker'
import type { MediaSlotOptions } from './MediaSlot'

/** Cadre d'un emplacement photo dans l'éditeur : consigne + deux voies de
 *  remplissage, les mêmes que la couverture (envoi, galerie). Un fichier déposé
 *  sur le cadre le remplit aussi (cf. `handleDrop` de BlogEditor). */
export function MediaSlotView({ node, editor, getPos, extension }: NodeViewProps) {
  const { hint, width } = node.attrs as { hint: string | null; width: number | null }
  const { onUploadFiles } = extension.options as MediaSlotOptions
  const inputRef = useRef<HTMLInputElement>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Même règle que FigureImageView : seule une vraie NodeSelection sur CE nœud
  // compte (une sélection de texte qui le traverse ne le « sélectionne » pas).
  const isNodeSelected = useEditorState({
    editor,
    selector: ({ editor }) => {
      const sel = editor.state.selection
      return sel instanceof NodeSelection && sel.from === getPos()
    },
  })
  const editable = editor.isEditable

  function currentPos(): number | null {
    const pos = getPos()
    return typeof pos === 'number' ? pos : null
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`media-slot${width ? ' fig-sized' : ''} tiptap-figure${isNodeSelected ? ' is-selected' : ''}`}
      style={width ? { width: `${width}%` } : undefined}
    >
      <div
        className={`media-slot-box${isNodeSelected ? ' is-selected' : ''}${dragOver ? ' is-drop-target' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
        }}
        onDrop={() => setDragOver(false)}
      >
        <ImagePlus className="media-slot-icon" aria-hidden />
        {hint && <span className="media-slot-hint">{hint}</span>}
        {editable && (
          <div className="media-slot-actions" contentEditable={false}>
            <button type="button" className="btn-outline gap-1.5 px-2.5 py-1.5 text-xs" onClick={() => inputRef.current?.click()}>
              <ImageUp aria-hidden className="h-3.5 w-3.5" />
              Envoyer
            </button>
            <button type="button" className="btn-outline gap-1.5 px-2.5 py-1.5 text-xs" onClick={() => setGalleryOpen(true)}>
              <FolderOpen aria-hidden className="h-3.5 w-3.5" />
              Galerie
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_MEDIA}
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          const pos = currentPos()
          if (files.length && pos != null) onUploadFiles(editor.view, pos, files)
        }}
      />

      {editable && isNodeSelected && (
        <div className="tiptap-node-toolbar" contentEditable={false}>
          <button
            type="button"
            title="Supprimer l’emplacement"
            className="tiptap-node-toolbar-delete"
            onMouseDown={(e) => {
              e.preventDefault()
              const pos = currentPos()
              if (pos != null) editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
            }}
          >
            ✕
          </button>
        </div>
      )}

      {galleryOpen && (
        <GalleryMediaPicker
          onClose={() => setGalleryOpen(false)}
          onInsert={(items) => {
            setGalleryOpen(false)
            const pos = currentPos()
            if (pos != null) editor.chain().focus().fillMediaSlots(pos, items).run()
          }}
        />
      )}
    </NodeViewWrapper>
  )
}
