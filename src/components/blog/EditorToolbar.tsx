import { useRef } from 'react'
import type { Editor } from '@tiptap/react'

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`tb-btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({
  editor,
  uploading,
  uploadError,
  onUploadFiles,
}: {
  editor: Editor
  uploading: boolean
  uploadError: string | null
  /** L'upload (placeholder, erreurs, insertion) est orchestré par BlogEditor,
   *  partagé avec le drop de fichiers OS et le collage. */
  onUploadFiles: (files: File[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function triggerUpload() {
    requestAnimationFrame(() => fileInputRef.current?.click())
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length) onUploadFiles(files)
  }

  return (
    <div className="tiptap-toolbar">
      <ToolbarButton title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>G</strong>
      </ToolbarButton>
      <ToolbarButton title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Titre de section" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        T2
      </ToolbarButton>
      <ToolbarButton title="Sous-titre" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        T3
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • —
      </ToolbarButton>
      <ToolbarButton title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Insérer des images ou des vidéos" disabled={uploading} onClick={() => triggerUpload()}>
        🖼
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>

      {uploading && <span className="tb-status">Envoi en cours…</span>}
      {uploadError && <span className="tb-status tb-error">{uploadError}</span>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={handleFile}
      />
    </div>
  )
}
