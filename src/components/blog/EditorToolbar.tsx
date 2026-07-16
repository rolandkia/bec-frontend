import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { uploadMedia } from '../../api/media'

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

export function EditorToolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadKind, setUploadKind] = useState<'image' | 'video' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function triggerUpload(kind: 'image' | 'video') {
    setUploadKind(kind)
    setError(null)
    requestAnimationFrame(() => fileInputRef.current?.click())
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const { url, resource_type } = await uploadMedia(file)
      if (resource_type === 'video') {
        editor.chain().focus().setVideo({ src: url }).run()
      } else {
        editor.chain().focus().setFigureImage({ src: url, alt: file.name }).run()
      }
    } catch {
      setError("Échec de l'envoi du fichier.")
    } finally {
      setIsUploading(false)
    }
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

      <ToolbarButton title="Insérer une image" disabled={isUploading} onClick={() => triggerUpload('image')}>
        🖼
      </ToolbarButton>
      <ToolbarButton title="Insérer une vidéo" disabled={isUploading} onClick={() => triggerUpload('video')}>
        🎬
      </ToolbarButton>

      <span className="tb-sep" />

      <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>

      {isUploading && <span className="tb-status">Envoi en cours…</span>}
      {error && <span className="tb-status tb-error">{error}</span>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={uploadKind === 'video' ? 'video/*' : 'image/*'}
        onChange={handleFile}
      />
    </div>
  )
}
