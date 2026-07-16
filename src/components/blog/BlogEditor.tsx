import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'
import { FigureImage } from './extensions/FigureImage'
import { Video } from './extensions/Video'

export function BlogEditor({
  initialContent,
  onChange,
}: {
  initialContent: string
  onChange: (html: string) => void
}) {
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
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  return (
    <div className="tiptap-editor card">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light" />
    </div>
  )
}
