import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'
import { FigureImage } from './extensions/FigureImage'
import { Video } from './extensions/Video'
import { MediaGrid } from './extensions/MediaGrid'
import { MediaUploadPlaceholder } from './extensions/mediaUploadPlaceholder'
import { collectGaps, nearestGap } from './extensions/dropTarget'
import { isSupportedMediaFile, uploadFileAt, type UploadCallbacks } from './extensions/uploadToEditor'

export function BlogEditor({
  initialContent,
  onChange,
}: {
  initialContent: string
  onChange: (html: string) => void
}) {
  // État d'upload partagé entre la toolbar, le drop de fichiers et le collage.
  const [pendingUploads, setPendingUploads] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadCallbacks: UploadCallbacks = {
    onStart: () => {
      setPendingUploads((n) => n + 1)
      setUploadError(null)
    },
    onError: (message) => setUploadError(message),
    onSettled: () => setPendingUploads((n) => n - 1),
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Marques/blocs non exposés dans la barre d'outils épurée : on les désactive
        // pour éviter que des raccourcis clavier ne produisent du HTML non souhaité.
        underline: false,
        strike: false,
        link: false,
        blockquote: false,
        // Trait indiquant le point d'insertion pendant le glisser-déposer d'un média.
        dropcursor: { color: 'var(--color-club-primary)', width: 3 },
      }),
      Placeholder.configure({ placeholder: 'Écrivez votre article ici…' }),
      FigureImage,
      Video,
      MediaGrid,
      MediaUploadPlaceholder,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      // Déposer des fichiers depuis l'OS : upload vers Cloudinary, inséré au
      // gap le plus proche du pointeur (`moved` = déplacement interne, déjà
      // géré par le drag pointeur custom).
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? []).filter(isSupportedMediaFile)
        if (!files.length) return false
        event.preventDefault()
        const gap = nearestGap(collectGaps(view), event.clientY)
        const pos = gap?.pos ?? view.state.doc.content.size
        for (const file of files) void uploadFileAt(view, file, pos, uploadCallbacks)
        return true
      },
      // Coller une image (capture d'écran…) : upload inséré à la sélection.
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(isSupportedMediaFile)
        if (!files.length) return false
        event.preventDefault()
        for (const file of files) void uploadFileAt(view, file, view.state.selection.to, uploadCallbacks)
        return true
      },
    },
  })

  if (!editor) return null

  return (
    <div className="tiptap-editor card">
      <EditorToolbar
        editor={editor}
        uploading={pendingUploads > 0}
        uploadError={uploadError}
        onUploadFiles={(files) => {
          for (const file of files) {
            void uploadFileAt(editor.view, file, editor.state.selection.to, uploadCallbacks)
          }
        }}
      />
      <EditorContent editor={editor} className="tiptap-content prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light" />
    </div>
  )
}
