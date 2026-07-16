import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBlog } from '../api/blogs'
import { uploadMedia } from '../api/media'
import { BlogContent } from '../components/blog/BlogContent'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-club-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export function BlogEditorPage() {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingInline, setIsUploadingInline] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    setError(null)
    try {
      const { url } = await uploadMedia(file)
      setCoverImageUrl(url)
    } catch {
      setError("Échec de l'upload de l'image de couverture.")
    } finally {
      setIsUploadingCover(false)
    }
  }

  async function handleInsertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingInline(true)
    setError(null)
    try {
      const { url } = await uploadMedia(file)
      const markdown = `\n![${file.name}](${url})\n`
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const next = content.slice(0, start) + markdown + content.slice(end)
        setContent(next)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = start + markdown.length
        })
      } else {
        setContent((prev) => prev + markdown)
      }
    } catch {
      setError("Échec de l'upload de l'image.")
    } finally {
      setIsUploadingInline(false)
      e.target.value = ''
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
      const post = await createBlog({
        title,
        summary: summary || null,
        cover_image_url: coverImageUrl,
        content_markdown: content,
        publish,
      })
      navigate(`/blog/${post.slug}`)
    } catch {
      setError("Échec de l'enregistrement de l'article.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8 text-3xl">Nouvel article</h1>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Titre
            </label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Résumé
            </label>
            <input
              className={inputClass}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Résumé affiché dans la liste des articles"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Image de couverture
            </label>
            <input type="file" accept="image/*" onChange={handleCoverImageChange} />
            {isUploadingCover && <p className="mt-1 text-sm text-slate-500">Envoi en cours…</p>}
            {coverImageUrl && (
              <img src={coverImageUrl} alt="Couverture" className="mt-2 h-32 rounded-lg object-cover" />
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contenu (Markdown)
              </label>
              <label className="cursor-pointer text-sm font-medium text-club-primary hover:underline dark:text-club-primary-light">
                {isUploadingInline ? 'Envoi…' : 'Insérer une image/vidéo'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleInsertImage}
                  disabled={isUploadingInline}
                />
              </label>
            </div>
            <textarea
              ref={textareaRef}
              className={`${inputClass} h-80 font-mono`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre article en Markdown…"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn-outline"
              disabled={isSaving}
              onClick={() => handleSubmit(false)}
            >
              Enregistrer comme brouillon
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isSaving}
              onClick={() => handleSubmit(true)}
            >
              Publier
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Aperçu</p>
          <div className="card p-5">
            {coverImageUrl && (
              <img src={coverImageUrl} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />
            )}
            <h2 className="mb-4 text-2xl font-bold text-club-primary dark:text-club-primary-light">
              {title || 'Titre de l’article'}
            </h2>
            <BlogContent markdown={content || '*Le contenu apparaîtra ici…*'} />
          </div>
        </div>
      </div>
    </div>
  )
}
