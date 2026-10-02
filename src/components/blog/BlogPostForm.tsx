import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ExternalLink } from 'lucide-react'
import { coverImageStyle, type CoverPosition } from '../../api/types'
import { cldImage } from '../../lib/cloudinary'
import { BlogEditor, type BlogEditorHandle } from './BlogEditor'
import { BlogContent } from './BlogContent'
import { CoverField } from './CoverField'
import { useLocalDraft } from './useLocalDraft'

/** Largeur d'un téléphone courant, pour l'aperçu contraint. */
const PHONE_PREVIEW_WIDTH = 390

/** Longueur conseillée du résumé : au-delà, les cartes du Mag le coupent. */
const SUMMARY_ADVISED = 160

export interface BlogFormValues {
  title: string
  summary: string | null
  cover_image_url: string | null
  cover_position: CoverPosition
  content_html: string
}

export type BlogFormStatus = 'new' | 'draft' | 'published'

/** Un article sans texte ni média : TipTap rend `<p></p>` pour un document vide. */
function isEmptyHtml(html: string): boolean {
  return !/<(img|video)\b/i.test(html) && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === ''
}

/** Temps de lecture estimé (≈200 mots/min), même calcul que BlogDetailPage. */
function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formulaire de rédaction d'un article (création ET modification).
 *
 * Ce qui a changé par rapport à la version précédente, et pourquoi :
 *  - les boutons d'enregistrement vivent dans une BARRE COLLÉE en bas de
 *    l'écran : ils étaient entre l'éditeur et l'aperçu, donc hors de vue dès
 *    qu'un article dépassait un écran ;
 *  - l'aperçu est un MODE (Rédiger / Aperçu) qui reproduit la page publiée —
 *    couverture au ratio réel, titre en surimpression — au lieu d'un bloc collé
 *    sous le formulaire, au cadre 5:2 qui n'existe nulle part sur le site ;
 *  - enregistrer garde l'auteur DANS l'éditeur (Ctrl/⌘ + S compris) ; le
 *    retour à la liste est un choix, plus une conséquence ;
 *  - une copie de secours locale survit à un onglet fermé (cf. useLocalDraft),
 *    et quitter la page avec des modifications non enregistrées demande
 *    confirmation.
 */
export function BlogPostForm({
  initial,
  status,
  draftKey,
  onSave,
  onDelete,
  viewHref,
  savedAt,
}: {
  initial?: Partial<BlogFormValues>
  status: BlogFormStatus
  /** Clé de la copie locale : une par article (et une pour « nouveau »). */
  draftKey: string
  /** Enregistre l'article ; `publish` est l'état voulu APRÈS l'enregistrement. */
  onSave: (values: BlogFormValues, publish: boolean) => Promise<void>
  onDelete?: () => Promise<void>
  /** Lien vers l'article publié. */
  viewHref?: string
  /** Enregistrement qui vient d'avoir lieu sur la page précédente (création). */
  savedAt?: number
}) {
  const initialValues = useMemo<BlogFormValues>(
    () => ({
      title: initial?.title ?? '',
      summary: initial?.summary ?? '',
      cover_image_url: initial?.cover_image_url ?? null,
      cover_position: initial?.cover_position ?? '50% 50%',
      content_html: initial?.content_html ?? '',
    }),
    // Lu une seule fois : le formulaire possède ensuite ses valeurs.
    [],
  )

  const [title, setTitle] = useState(initialValues.title)
  const [summary, setSummary] = useState(initialValues.summary ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialValues.cover_image_url)
  const [coverPosition, setCoverPosition] = useState<CoverPosition>(initialValues.cover_position)
  const [content, setContent] = useState(initialValues.content_html)
  /** Dernière version enregistrée : la référence de « non enregistré ». */
  const [baseline, setBaseline] = useState(initialValues)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(savedAt ? new Date(savedAt) : null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string }>({})
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [previewWidth, setPreviewWidth] = useState<'phone' | 'desktop'>('desktop')

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const summaryRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<BlogEditorHandle>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Hauteur des deux champs texte au contenu. `field-sizing: content` le fait
  // seul dans Chrome et Safari récents ; ceci couvre Firefox, qui l'ignore.
  useLayoutEffect(() => {
    for (const el of [titleRef.current, summaryRef.current]) {
      if (!el || CSS.supports('field-sizing', 'content')) continue
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [title, summary, mode])

  const values = useMemo<BlogFormValues>(
    () => ({
      title,
      summary: summary || null,
      cover_image_url: coverImageUrl,
      cover_position: coverPosition,
      content_html: content,
    }),
    [title, summary, coverImageUrl, coverPosition, content],
  )
  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify({ ...baseline, summary: baseline.summary || null }),
    [values, baseline],
  )

  /* ─── Copie de secours locale ─────────────────────────────────────────────── */
  const { found: localDraft, clear: clearLocalDraft } = useLocalDraft(draftKey, values, dirty)
  // Proposée seulement si elle diffère de ce qui est enregistré.
  const [restoreOffer, setRestoreOffer] = useState(() =>
    localDraft && JSON.stringify(localDraft.values) !== JSON.stringify(values) ? localDraft : null,
  )

  function restore() {
    if (!restoreOffer) return
    const v = restoreOffer.values
    setTitle(v.title ?? '')
    setSummary(v.summary ?? '')
    setCoverImageUrl(v.cover_image_url ?? null)
    setCoverPosition(v.cover_position ?? '50% 50%')
    setContent(v.content_html ?? '')
    editorRef.current?.setContent(v.content_html ?? '')
    setRestoreOffer(null)
  }

  function dismissRestore() {
    clearLocalDraft()
    setRestoreOffer(null)
  }

  /* ─── Enregistrement ──────────────────────────────────────────────────────── */
  async function save(publish: boolean) {
    if (saving) return
    const errors: typeof fieldErrors = {}
    if (!title.trim()) errors.title = 'Donnez un titre à l’article.'
    if (isEmptyHtml(content)) errors.content = 'L’article est vide : écrivez au moins un paragraphe.'
    setFieldErrors(errors)
    if (errors.title || errors.content) {
      setMode('edit')
      requestAnimationFrame(() => {
        if (errors.title) titleRef.current?.focus()
        else contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }
    setSaving(publish ? 'publish' : 'draft')
    setError(null)
    try {
      await onSave(values, publish)
      setBaseline(values)
      setLastSaved(new Date())
      clearLocalDraft()
      setRestoreOffer(null)
    } catch {
      setError('Échec de l’enregistrement. Vos modifications sont conservées sur cet appareil : réessayez.')
    } finally {
      setSaving(null)
    }
  }

  // Ctrl/⌘ + S : enregistre sans changer l'état (brouillon reste brouillon).
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current(status === 'published')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status])

  // Quitter l'onglet avec des modifications non enregistrées : confirmation du
  // navigateur. (La copie locale reste de toute façon disponible.)
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  async function handleDelete() {
    if (!onDelete) return
    if (!window.confirm('Supprimer définitivement cet article ? Cette action est irréversible.')) return
    setSaving('draft')
    try {
      clearLocalDraft()
      await onDelete()
    } catch {
      setError('Échec de la suppression.')
      setSaving(null)
    }
  }

  function unpublish() {
    if (window.confirm('Repasser en brouillon ? L’article ne sera plus visible dans le Mag.')) void save(false)
  }

  const saveState = saving
    ? 'Enregistrement…'
    : dirty
      ? 'Modifications non enregistrées'
      : lastSaved
        ? `Enregistré à ${formatTime(lastSaved)}`
        : status === 'new'
          ? 'Nouvel article'
          : 'À jour'

  const statusBadge =
    status === 'published'
      ? { label: 'Publié', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' }
      : { label: 'Brouillon', className: 'bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]' }

  const summaryLength = summary.length

  return (
    <div>
      {restoreOffer && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="mr-auto">
            Une version non enregistrée de cet article ({formatDateTime(restoreOffer.savedAt)}) a été
            retrouvée sur cet appareil.
          </p>
          <button type="button" className="btn-primary tap px-4 py-1.5 text-sm" onClick={restore}>
            Restaurer
          </button>
          <button type="button" className="tap text-sm font-semibold hover:underline" onClick={dismissRestore}>
            Ignorer
          </button>
        </div>
      )}

      {error && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented sm:w-fit" role="tablist" aria-label="Mode">
          <button type="button" role="tab" aria-selected={mode === 'edit'} onClick={() => setMode('edit')}>
            Rédiger
          </button>
          <button type="button" role="tab" aria-selected={mode === 'preview'} onClick={() => setMode('preview')}>
            Aperçu
          </button>
        </div>
        {mode === 'preview' && (
          <div className="segmented sm:w-fit" role="group" aria-label="Largeur de l'aperçu">
            <button type="button" aria-pressed={previewWidth === 'phone'} onClick={() => setPreviewWidth('phone')}>
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
        )}
      </div>

      {/* L'éditeur reste MONTÉ en mode aperçu (`hidden`) : le démonter perdrait
          l'historique d'annulation et la position du curseur. */}
      <div className={mode === 'edit' ? 'space-y-8' : 'hidden'}>
        <div>
          <label htmlFor="blog-title" className="sr-only">
            Titre
          </label>
          <textarea
            id="blog-title"
            ref={titleRef}
            rows={1}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, ' '))
              if (fieldErrors.title) setFieldErrors((f) => ({ ...f, title: undefined }))
            }}
            onKeyDown={(e) => {
              // Entrée : passer au résumé (un titre tient sur une ligne).
              if (e.key === 'Enter') {
                e.preventDefault()
                summaryRef.current?.focus()
              }
            }}
            placeholder="Titre de l’article"
            aria-invalid={Boolean(fieldErrors.title)}
            className="field-sizing-content w-full resize-none border-0 border-b-2 border-[color:var(--color-line)] bg-transparent pb-2 font-display text-3xl font-bold leading-tight text-[color:var(--color-fg)] placeholder:text-[color:var(--color-muted)]/60 focus:border-club-primary focus:outline-none sm:text-4xl"
          />
          {fieldErrors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.title}</p>}
        </div>

        <div>
          <label htmlFor="blog-summary" className="mb-1 block text-sm font-semibold text-[color:var(--color-fg)]">
            Résumé
          </label>
          <textarea
            id="blog-summary"
            ref={summaryRef}
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                editorRef.current?.focus()
              }
            }}
            placeholder="Une ou deux phrases qui donnent envie de lire : affichées sous le titre et sur les cartes du Mag."
            className="field-sizing-content w-full resize-none rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] focus:border-club-primary focus:outline-none"
          />
          <p
            className={`mt-1 text-right text-xs tabular-nums ${
              summaryLength > SUMMARY_ADVISED ? 'text-amber-700 dark:text-amber-400' : 'text-[color:var(--color-muted)]'
            }`}
          >
            {summaryLength} / {SUMMARY_ADVISED}
            {summaryLength > SUMMARY_ADVISED && ' — sera coupé sur les cartes'}
          </p>
        </div>

        <section aria-labelledby="blog-cover-label">
          <h2 id="blog-cover-label" className="mb-2 text-sm font-semibold text-[color:var(--color-fg)]">
            Couverture
          </h2>
          <CoverField
            url={coverImageUrl}
            position={coverPosition}
            onChange={setCoverImageUrl}
            onPositionChange={setCoverPosition}
          />
        </section>

        <section aria-labelledby="blog-content-label" ref={contentRef}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="blog-content-label" className="text-sm font-semibold text-[color:var(--color-fg)]">
              Contenu
            </h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Glissez ou collez des photos · @ pour mentionner un athlète · Ctrl/⌘ + S pour enregistrer
            </p>
          </div>
          <BlogEditor
            ref={editorRef}
            initialContent={initialValues.content_html}
            onChange={(html) => {
              setContent(html)
              if (fieldErrors.content) setFieldErrors((f) => ({ ...f, content: undefined }))
            }}
          />
          {fieldErrors.content && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.content}</p>}
        </section>

        {onDelete && (
          <div className="border-t border-[color:var(--color-line)] pt-6">
            <button
              type="button"
              className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              disabled={saving !== null}
              onClick={handleDelete}
            >
              Supprimer l’article
            </button>
          </div>
        )}
      </div>

      {mode === 'preview' && <ArticlePreview values={values} phone={previewWidth === 'phone'} />}

      {/* Barre d'enregistrement, collée en bas de l'écran. */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-[color:var(--color-line)] bg-[color:var(--color-canvas)]/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:mx-0 sm:rounded-t-2xl sm:border-x sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto flex min-w-0 items-center gap-2 text-sm">
            <span className={`badge shrink-0 ${statusBadge.className}`}>{statusBadge.label}</span>
            <span className={`truncate ${dirty ? 'text-amber-700 dark:text-amber-400' : 'text-[color:var(--color-muted)]'}`}>
              {saveState}
            </span>
            {viewHref && status === 'published' && (
              <Link
                to={viewHref}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-[color:var(--color-fg)] hover:underline"
              >
                Voir <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {status === 'published' ? (
              <>
                <button
                  type="button"
                  className="tap px-2 text-sm font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:underline disabled:opacity-50"
                  disabled={saving !== null}
                  onClick={unpublish}
                >
                  <span className="sm:hidden">Dépublier</span>
                  <span className="hidden sm:inline">Repasser en brouillon</span>
                </button>
                <button
                  type="button"
                  className="btn-primary tap px-5 py-2 text-sm disabled:opacity-50"
                  disabled={saving !== null || (!dirty && status === 'published')}
                  onClick={() => void save(true)}
                >
                  {saving === 'publish' ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-outline tap px-4 py-2 text-sm disabled:opacity-50"
                  disabled={saving !== null}
                  onClick={() => void save(false)}
                >
                  {saving === 'draft' ? 'Enregistrement…' : (
                    <>
                      <span className="sm:hidden">Brouillon</span>
                      <span className="hidden sm:inline">Enregistrer le brouillon</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-primary tap px-5 py-2 text-sm disabled:opacity-50"
                  disabled={saving !== null}
                  onClick={() => void save(true)}
                >
                  {saving === 'publish' ? 'Publication…' : 'Publier'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Aperçu fidèle à la page publiée (BlogDetailPage) : couverture au ratio réel
 * (16:7, 16:10 au téléphone) et cadrée comme en ligne, titre en surimpression
 * sur ordinateur et dessous au téléphone, puis résumé et corps. Les tailles
 * sont posées selon le MODE d'aperçu et non selon l'écran, pour qu'un aperçu
 * « Téléphone » sur un ordinateur montre bien la mise en page du téléphone.
 */
function ArticlePreview({ values, phone }: { values: BlogFormValues; phone: boolean }) {
  const { title, summary, cover_image_url, cover_position, content_html } = values
  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[color:var(--color-muted)]">
      <span className="font-semibold uppercase tracking-[0.14em] text-club-primary-light">
        {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4" aria-hidden />
        {readingMinutes(content_html)} min de lecture
      </span>
    </div>
  )
  const heading = (
    <h1
      className={`mt-2 font-display font-bold leading-[1.1] ${cover_image_url ? 'text-white' : 'text-[color:var(--color-fg)]'}`}
      style={{ fontSize: phone ? '1.75rem' : 'clamp(1.75rem, 3.5vw, 3rem)' }}
    >
      {title || 'Titre de l’article'}
    </h1>
  )

  return (
    <div className="mx-auto" style={phone ? { maxWidth: PHONE_PREVIEW_WIDTH } : undefined}>
      <div className="card overflow-hidden">
        {cover_image_url ? (
          <div className="chapter-dark">
            <div className="relative overflow-hidden">
              <img
                src={cldImage(cover_image_url, 1600)}
                alt=""
                className="block w-full object-cover"
                style={{ aspectRatio: phone ? '16 / 10' : '16 / 7', ...coverImageStyle(cover_position) }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/40 to-transparent" />
              {!phone && (
                <div className="absolute inset-x-0 bottom-0 px-10 pb-10">
                  <div className="mx-auto max-w-3xl">
                    {meta}
                    {heading}
                  </div>
                </div>
              )}
            </div>
            {phone && (
              <div className="px-4 pb-6 pt-4">
                {meta}
                {heading}
              </div>
            )}
          </div>
        ) : (
          <header className={`mx-auto max-w-3xl ${phone ? 'px-4 pt-6' : 'px-8 pt-10'}`}>
            {meta}
            {heading}
          </header>
        )}
        <div className={`mx-auto max-w-3xl ${phone ? 'px-4 py-6' : 'px-8 py-8'}`}>
          {summary && (
            <p className={`leading-relaxed text-[color:var(--color-fg)]/90 ${phone ? 'text-base' : 'text-lg'}`}>
              {summary}
            </p>
          )}
          <hr className="rule-gold my-6" />
          <BlogContent html={content_html || '<p><em>Le contenu apparaîtra ici…</em></p>'} enableLightbox={false} />
        </div>
      </div>
    </div>
  )
}
