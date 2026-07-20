import { useState } from 'react'
import { isAxiosError } from 'axios'
import { uploadMedia } from '../../api/media'
import { createAlbum, updateAlbum } from '../../api/gallery'
import type { AlbumOut } from '../../api/types'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-club-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

/** Formulaire création/édition d'un album (titre, description, couverture). */
export function AlbumForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: AlbumOut
  onDone: () => void
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [coverUrl, setCoverUrl] = useState<string | null>(existing?.cover_image_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const { url } = await uploadMedia(file)
      setCoverUrl(url)
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Échec de l'envoi de la couverture.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Le titre est obligatoire.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      if (existing) {
        await updateAlbum(existing.id, {
          title,
          description: description || null,
          cover_image_url: coverUrl,
        })
      } else {
        await createAlbum({ title, description: description || null, cover_image_url: coverUrl })
      }
      onDone()
    } catch {
      setError("Échec de l'enregistrement de l'album.")
      setIsSaving(false)
    }
  }

  return (
    <div className="card space-y-4 p-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <div>
        <label className={labelClass}>Titre de l'album</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Couverture</label>
        <input type="file" accept="image/*" onChange={handleCoverChange} />
        {isUploading && <p className="mt-1 text-sm text-slate-500">Envoi en cours…</p>}
        {coverUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img src={coverUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              className="text-sm text-red-600 hover:underline dark:text-red-400"
              onClick={() => setCoverUrl(null)}
            >
              Retirer
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-primary" disabled={isSaving} onClick={handleSubmit}>
          {isSaving ? 'Enregistrement…' : existing ? 'Enregistrer' : "Créer l'album"}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}
