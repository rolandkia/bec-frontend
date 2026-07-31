import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { uploadMedia } from '../../api/media'
import { coverImageStyle, type CoverPosition } from '../../api/types'
import { ACCEPT_IMAGE } from '../../lib/mediaKind'
import { cldImage } from '../../lib/cloudinary'
import { BlogEditor, type BlogEditorHandle } from './BlogEditor'
import { BlogContent } from './BlogContent'
import { CoverFocalPicker } from './CoverFocalPicker'

/** Largeur d'un téléphone courant, pour l'aperçu contraint. */
const PHONE_PREVIEW_WIDTH = 390

const inputClass =
  'w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-fg)] focus:border-club-primary focus:outline-none'

export interface BlogFormValues {
  title: string
  summary: string | null
  cover_image_url: string | null
  cover_position: CoverPosition
  content_html: string
}

export function BlogPostForm({
  initial,
  onSubmit,
  onDelete,
  submitLabelDraft = 'Enregistrer comme brouillon',
  submitLabelPublish = 'Publier',
}: {
  initial?: Partial<BlogFormValues>
  onSubmit: (values: BlogFormValues, publish: boolean) => Promise<void>
  onDelete?: () => Promise<void>
  submitLabelDraft?: string
  submitLabelPublish?: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.cover_image_url ?? null,
  )
  const [coverPosition, setCoverPosition] = useState<CoverPosition>(
    initial?.cover_position ?? '50% 50%',
  )
  const [content, setContent] = useState(initial?.content_html ?? '')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewWidth, setPreviewWidth] = useState<'phone' | 'desktop'>('desktop')

  // Navigation clavier : Entrée valide le champ et passe au suivant
  // (Titre → Résumé → éditeur de contenu).
  const summaryRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<BlogEditorHandle>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIsUploadingCover(true)
    setError(null)
    try {
      const { url } = await uploadMedia(file)
      setCoverImageUrl(url)
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Échec de l'envoi de l'image de couverture.",
      )
    } finally {
      setIsUploadingCover(false)
    }
  }

  async function handleSubmit(publish: boolean) {
    if (!title.trim() || !content.trim()) {
      setError('Le titre et le contenu sont obligatoires.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit(
        {
          title,
          summary: summary || null,
          cover_image_url: coverImageUrl,
          cover_position: coverPosition,
          content_html: content,
        },
        publish,
      )
    } catch {
      setError("Échec de l'enregistrement de l'article.")
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!window.confirm('Supprimer définitivement cet article ?')) return
    setIsSaving(true)
    try {
      await onDelete()
    } catch {
      setError('Échec de la suppression.')
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-fg)]">
          Titre
        </label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              summaryRef.current?.focus()
            }
          }}
          placeholder="Titre de l'article"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-fg)]">
          Résumé
        </label>
        <input
          ref={summaryRef}
          className={inputClass}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              editorRef.current?.focus()
            }
          }}
          placeholder="Court résumé affiché dans la liste des articles"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-fg)]">
          Image de couverture
        </label>
        <input type="file" accept={ACCEPT_IMAGE} onChange={handleCoverChange} />
        {isUploadingCover && <p className="mt-1 text-sm text-[color:var(--color-muted)]">Envoi en cours…</p>}
        {coverImageUrl && (
          <>
            <div className="mt-2">
              <button
                type="button"
                className="text-sm text-red-600 hover:underline dark:text-red-400"
                onClick={() => setCoverImageUrl(null)}
              >
                Retirer l'image
              </button>
            </div>
            <CoverFocalPicker src={coverImageUrl} value={coverPosition} onChange={setCoverPosition} />
          </>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-fg)]">
          Contenu de l'article
        </label>
        <BlogEditor ref={editorRef} initialContent={initial?.content_html ?? ''} onChange={setContent} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-outline tap" disabled={isSaving} onClick={() => handleSubmit(false)}>
          {submitLabelDraft}
        </button>
        <button type="button" className="btn-primary tap" disabled={isSaving} onClick={() => handleSubmit(true)}>
          {submitLabelPublish}
        </button>
        {onDelete && (
          <button
            type="button"
            className="ml-auto text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
            disabled={isSaving}
            onClick={handleDelete}
          >
            Supprimer l'article
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-[color:var(--color-muted)]">Aperçu</p>
          {/* Les règles responsive de l'article réagissent désormais à la largeur
              de sa COLONNE (container queries), pas à celle du viewport : contraindre
              l'aperçu à 390 px affiche donc le VRAI rendu mobile, sur un écran de
              bureau et sans redimensionner la fenêtre. */}
          <div className="segmented" role="group" aria-label="Largeur de l'aperçu">
            <button
              type="button"
              aria-pressed={previewWidth === 'phone'}
              onClick={() => setPreviewWidth('phone')}
            >
              Téléphone
            </button>
            <button
              type="button"
              aria-pressed={previewWidth === 'desktop'}
              onClick={() => setPreviewWidth('desktop')}
            >
              Ordinateur
            </button>
          </div>
        </div>
        {/* py-5 sans padding horizontal : le contenu de l'aperçu occupe la même
            largeur utile que l'article publié pour un rendu identique. */}
        <div className="card py-5">
          <div
            className="mx-auto w-full max-w-3xl"
            style={previewWidth === 'phone' ? { maxWidth: PHONE_PREVIEW_WIDTH } : undefined}
          >
            {coverImageUrl && (
              <div className="mb-4 aspect-[5/2] w-full overflow-hidden rounded-lg bg-[color:var(--color-surface-2)]">
                <img
                  src={cldImage(coverImageUrl, 1200)}
                  alt=""
                  className="h-full w-full object-cover"
                  style={coverImageStyle(coverPosition)}
                />
              </div>
            )}
            <h2 className="mb-3 text-3xl font-bold text-club-primary dark:text-club-primary-light">
              {title || 'Titre de l’article'}
            </h2>
            {summary && (
              <p className="mb-4 text-lg text-[color:var(--color-muted)]">{summary}</p>
            )}
            <BlogContent
              html={content || '<p><em>Le contenu apparaîtra ici…</em></p>'}
              enableLightbox={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
