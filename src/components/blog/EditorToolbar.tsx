import { useRef, useState } from 'react'
import { FolderOpen, ImagePlus, List, ListOrdered, Redo2, Undo2 } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { MediaOut } from '../../api/types'
import { ACCEPT_MEDIA } from '../../lib/mediaKind'
import { GalleryMediaPicker } from './GalleryMediaPicker'

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
  onInsertFromGallery,
}: {
  editor: Editor
  uploading: boolean
  uploadError: string | null
  /** L'upload (placeholder, erreurs, insertion) est orchestré par BlogEditor,
   *  partagé avec le drop de fichiers OS et le collage. */
  onUploadFiles: (files: File[]) => void
  /** Insère dans l'éditeur des médias déjà hébergés (choisis dans la galerie). */
  onInsertFromGallery: (items: MediaOut[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)

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
        <List aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Insérer des images ou des vidéos" disabled={uploading} onClick={() => triggerUpload()}>
        <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton title="Insérer depuis la galerie" onClick={() => setGalleryOpen(true)}>
        <FolderOpen aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 aria-hidden className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>

      {uploading && <span className="tb-status">Envoi en cours…</span>}
      {uploadError && <span className="tb-status tb-error">{uploadError}</span>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_MEDIA}
        multiple
        onChange={handleFile}
      />

      {galleryOpen && (
        <GalleryMediaPicker
          onClose={() => setGalleryOpen(false)}
          onInsert={(items) => {
            onInsertFromGallery(items)
            setGalleryOpen(false)
          }}
        />
      )}
    </div>
  )
}
