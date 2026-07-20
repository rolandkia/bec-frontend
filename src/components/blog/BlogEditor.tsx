import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { useQuery } from '@tanstack/react-query'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'
import { FigureImage } from './extensions/FigureImage'
import { Video } from './extensions/Video'
import { MediaGrid } from './extensions/MediaGrid'
import { MediaText, MediaTextColumn } from './extensions/MediaText'
import { MediaUploadPlaceholder } from './extensions/mediaUploadPlaceholder'
import { createAthleteMention } from './extensions/AthleteMention'
import { collectGaps, nearestGap } from './extensions/dropTarget'
import { insertMediaNodes, isSupportedMediaFile, uploadFileAt, type UploadCallbacks } from './extensions/uploadToEditor'
import { listAthletes } from '../../api/athletes'
import type { MentionItem } from './MentionPopup'

/** Poignée impérative exposée au parent (formulaire) pour donner le focus à
 *  l'éditeur — utilisée par la navigation clavier (Entrée depuis le Résumé). */
export interface BlogEditorHandle {
  focus: () => void
}

export const BlogEditor = forwardRef<
  BlogEditorHandle,
  {
    initialContent: string
    onChange: (html: string) => void
  }
>(function BlogEditor({ initialContent, onChange }, ref) {
  // État d'upload partagé entre la toolbar, le drop de fichiers et le collage.
  const [pendingUploads, setPendingUploads] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Liste des athlètes pour les mentions « @ ». Lue via une ref pour que
  // l'extension y accède sans recréer l'éditeur quand la requête se résout.
  const { data: athletes } = useQuery({ queryKey: ['athletes'], queryFn: listAthletes })
  const athletesRef = useRef<MentionItem[]>([])
  athletesRef.current = athletes ?? []
  const athleteMention = useMemo(
    () => createAthleteMention(() => athletesRef.current),
    [],
  )

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
      MediaTextColumn,
      MediaText,
      MediaUploadPlaceholder,
      athleteMention,
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

  useImperativeHandle(ref, () => ({ focus: () => editor?.commands.focus() }), [editor])

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
        onInsertFromGallery={(items) => {
          insertMediaNodes(
            editor.view,
            items.map((m) => ({
              url: m.url,
              resource_type: m.resource_type,
              alt: m.description,
            })),
          )
        }}
      />
      <EditorContent editor={editor} className="tiptap-content prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light" />
    </div>
  )
})
