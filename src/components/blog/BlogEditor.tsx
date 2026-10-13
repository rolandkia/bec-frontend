import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import type { EditorView } from '@tiptap/pm/view'
import { useQuery } from '@tanstack/react-query'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { LayoutTemplate } from 'lucide-react'
import { EditorToolbar } from './EditorToolbar'
import { TemplatePicker } from './TemplatePicker'
import type { ArticleTemplate } from './templates'
import { FigureImage } from './extensions/FigureImage'
import { Video } from './extensions/Video'
import { MediaGrid } from './extensions/MediaGrid'
import { MediaText, MediaTextColumn } from './extensions/MediaText'
import { MediaUploadPlaceholder } from './extensions/mediaUploadPlaceholder'
import { MediaSlot, afterTopLevelBlock, slotPosFromEvent, slotTargets } from './extensions/MediaSlot'
import { TemplateHint } from './extensions/TemplateHint'
import { createAthleteMention } from './extensions/AthleteMention'
import { collectGaps, nearestGap } from './extensions/dropTarget'
import {
  insertMediaNodes,
  uploadFileAt,
  uploadFileIntoSlot,
  type UploadCallbacks,
} from './extensions/uploadToEditor'
import { partitionMediaFiles, unsupportedFileMessage } from '../../lib/mediaKind'
import { listAthletes } from '../../api/athletes'
import { STATIC_DATA } from '../../api/staleTime'
import type { MentionItem } from './MentionPopup'

/** Poignée impérative exposée au parent (formulaire) pour donner le focus à
 *  l'éditeur — utilisée par la navigation clavier (Entrée depuis le Résumé). */
export interface BlogEditorHandle {
  focus: () => void
  /** Remplace tout le contenu (restauration d'un brouillon local) ; déclenche
   *  `onChange` comme une saisie. */
  setContent: (html: string) => void
}

export const BlogEditor = forwardRef<
  BlogEditorHandle,
  {
    initialContent: string
    onChange: (html: string) => void
    /** Un modèle vient d'être appliqué : ses consignes de titre et de résumé
     *  concernent le formulaire. */
    onTemplateApplied?: (template: ArticleTemplate) => void
  }
>(function BlogEditor({ initialContent, onChange, onTemplateApplied }, ref) {
  // État d'upload partagé entre la toolbar, le drop de fichiers et le collage.
  const [pendingUploads, setPendingUploads] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  // Liste des athlètes pour les mentions « @ ». Lue via une ref pour que
  // l'extension y accède sans recréer l'éditeur quand la requête se résout.
  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: listAthletes,
    staleTime: STATIC_DATA,
  })
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

  /** Fichiers destinés à un emplacement photo (bouton du cadre ou dépôt dessus) :
   *  le premier le remplit, les suivants remplissent les emplacements vides qui
   *  le suivent dans sa grille, le reste s'insère après le bloc. */
  function uploadIntoSlots(view: EditorView, files: File[], slotPos: number) {
    const { supported, rejected } = partitionMediaFiles(files)
    if (rejected.length) setUploadError(unsupportedFileMessage(rejected))
    const targets = slotTargets(view.state.doc, slotPos)
    const after = afterTopLevelBlock(view.state.doc, slotPos)
    supported.forEach((file, i) => {
      void (i < targets.length
        ? uploadFileIntoSlot(view, file, targets[i], uploadCallbacks)
        : uploadFileAt(view, file, after, uploadCallbacks))
    })
  }
  // Lue via une ref : la configuration d'une extension est figée à la création
  // de l'éditeur.
  const uploadIntoSlotsRef = useRef(uploadIntoSlots)
  uploadIntoSlotsRef.current = uploadIntoSlots

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Marques/blocs non exposés dans la barre d'outils épurée : on les désactive
        // pour éviter que des raccourcis clavier ne produisent du HTML non souhaité.
        underline: false,
        strike: false,
        // Liens RÉACTIVÉS : désactivés, ils n'étaient pas seulement absents de
        // la barre d'outils — un article qui en contenait (« Nous rejoindre »
        // dans les articles d'exemple) les PERDAIT à la réouverture, puisque
        // ProseMirror ne garde d'un <a> inconnu que son texte. Pas de
        // `target="_blank"` : la plupart des liens du Mag sont internes
        // (/rejoindre, /competitions) et doivent rester dans l'onglet. Les
        // mentions d'athlète, qui sont aussi des <a>, gardent la main grâce à la
        // priorité de leur règle de lecture (cf. AthleteMention).
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: 'https',
          HTMLAttributes: { target: null, rel: null, class: null },
        },
        // `blockquote` reste ACTIF bien qu'absent de la barre d'outils : les deux
        // sanitizers l'autorisent, donc un article hérité peut en contenir, et le
        // désactiver le rétrogradait silencieusement en <p> dès la réouverture —
        // même perte que ci-dessous. Il est stylé explicitement dans index.css.
        // Ces trois-là produisaient une PERTE SILENCIEUSE : `---`, `` `x` `` ou
        // ``` créaient un <hr>/<code>/<pre> visible dans l'éditeur mais absent
        // des deux allowlists, donc évanoui à l'enregistrement.
        code: false,
        codeBlock: false,
        horizontalRule: false,
        // 1-4 seulement : les sanitizers retirent h5/h6 (même perte silencieuse
        // via Mod-Alt-5). h1 et h4 restent autorisés pour qu'un article hérité qui
        // en contient fasse l'aller-retour, au lieu d'être rétrogradé en <p>.
        heading: { levels: [1, 2, 3, 4] },
        // Trait indiquant le point d'insertion pendant le glisser-déposer d'un média.
        dropcursor: { color: 'var(--color-club-primary)', width: 3 },
      }),
      // Toutes les zones vides sont marquées (`is-empty`), pas seulement celle du
      // curseur : c'est ce qui affiche d'un coup les consignes d'un modèle
      // (cf. TemplateHint).
      Placeholder.configure({
        showOnlyCurrent: false,
        includeChildren: true,
        // Affiché pour l'article vierge seulement : cf. index.css.
        placeholder: 'Écrivez votre article ici…',
      }),
      TemplateHint,
      MediaSlot.configure({
        onUploadFiles: (view, pos, files) => uploadIntoSlotsRef.current(view, files, pos),
      }),
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
        const dropped = Array.from(event.dataTransfer?.files ?? [])
        // Aucun fichier du tout : on laisse ProseMirror gérer (texte, HTML…).
        if (!dropped.length) return false
        event.preventDefault()
        // Sur le cadre d'un emplacement photo : le fichier le remplit.
        const slotPos = slotPosFromEvent(view, event)
        if (slotPos != null) {
          uploadIntoSlots(view, dropped, slotPos)
          return true
        }
        const { supported, rejected } = partitionMediaFiles(dropped)
        if (rejected.length) setUploadError(unsupportedFileMessage(rejected))
        const gap = nearestGap(collectGaps(view), event.clientY)
        const pos = gap?.pos ?? view.state.doc.content.size
        for (const file of supported) void uploadFileAt(view, file, pos, uploadCallbacks)
        return true
      },
      // Coller une image (capture d'écran…) : upload inséré à la sélection.
      handlePaste: (view, event) => {
        const pasted = Array.from(event.clipboardData?.files ?? [])
        if (!pasted.length) return false
        event.preventDefault()
        const { supported, rejected } = partitionMediaFiles(pasted)
        if (rejected.length) setUploadError(unsupportedFileMessage(rejected))
        for (const file of supported) void uploadFileAt(view, file, view.state.selection.to, uploadCallbacks)
        return true
      },
    },
  })

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus(),
      setContent: (html) => editor?.commands.setContent(html),
    }),
    [editor],
  )

  const isEmpty = useEditorState({ editor, selector: ({ editor }) => editor?.isEmpty ?? true })

  function applyTemplate(template: ArticleTemplate) {
    if (!editor) return
    if (
      !editor.isEmpty &&
      !window.confirm(`Remplacer le contenu de l’article par le modèle « ${template.name} » ?`)
    ) {
      return
    }
    setTemplatesOpen(false)
    // `setContent` passe par l'historique : Ctrl/⌘ + Z rend le contenu remplacé.
    editor.chain().setContent(template.html).focus('start').run()
    onTemplateApplied?.(template)
  }

  if (!editor) return null

  return (
    <div className="tiptap-editor card">
      <EditorToolbar
        editor={editor}
        onOpenTemplates={() => setTemplatesOpen(true)}
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
            items.map((m) => ({ url: m.url, resource_type: m.resource_type, alt: m.alt })),
          )
        }}
      />
      {/* Article vierge : le point de départ le plus visible pour un modèle. */}
      {isEmpty && (
        <div className="tiptap-template-cta">
          <LayoutTemplate aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>Besoin d’un point de départ ?</span>
          <button type="button" onClick={() => setTemplatesOpen(true)}>
            Partir d’un modèle
          </button>
        </div>
      )}
      {/* `.tiptap-content` porte la colonne (max-w-3xl) ET le conteneur des
          container queries ; toute la typographie du corps est déclarée dans
          index.css, à la fois pour `.ProseMirror` et `.blog-rendered`. */}
      <EditorContent editor={editor} className="tiptap-content" />
      {templatesOpen && (
        <TemplatePicker
          replacing={!isEmpty}
          onChoose={applyTemplate}
          onClose={() => setTemplatesOpen(false)}
        />
      )}
    </div>
  )
})
