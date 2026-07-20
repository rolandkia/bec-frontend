import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { mediaTooLargeMessage, uploadMedia } from '../../api/media'
import { createMedia, listAlbums, updateMedia } from '../../api/gallery'
import type { MediaOut } from '../../api/types'
import { AthletePicker } from './AthletePicker'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-club-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

/** Formulaire de média de galerie. En création (`existing` absent) : envoi
 *  multi-fichiers vers Cloudinary puis création d'une entrée par fichier avec
 *  les métadonnées partagées. En édition : met à jour les métadonnées/tags. */
export function MediaForm({
  existing,
  onDone,
}: {
  existing?: MediaOut
  onDone: () => void
}) {
  const isEdit = Boolean(existing)
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState(existing?.description ?? '')
  const [date, setDate] = useState(existing?.date ?? '')
  const [lieu, setLieu] = useState(existing?.lieu ?? '')
  const [albumId, setAlbumId] = useState<number | null>(existing?.album_id ?? null)
  const [athleteIds, setAthleteIds] = useState<number[]>(
    existing?.athletes.map((a) => a.id) ?? [],
  )
  const [previews, setPreviews] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: albums } = useQuery({ queryKey: ['gallery-albums'], queryFn: listAlbums })

  // Aperçus locaux (object-URLs) régénérés à chaque changement de sélection ;
  // révoqués au changement/démontage pour ne pas fuir de mémoire.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const tooLarge = selected.map(mediaTooLargeMessage).find(Boolean)
    if (tooLarge) {
      setError(tooLarge)
      setFiles([])
      return
    }
    setError(null)
    setFiles(selected)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setError(null)

    if (isEdit && existing) {
      setIsSaving(true)
      try {
        await updateMedia(existing.id, {
          description: description || null,
          date: date || null,
          lieu: lieu || null,
          album_id: albumId,
          athlete_ids: athleteIds,
        })
        onDone()
      } catch {
        setError("Échec de l'enregistrement.")
        setIsSaving(false)
      }
      return
    }

    if (files.length === 0) {
      setError('Sélectionnez au moins un fichier.')
      return
    }
    setIsSaving(true)
    setProgress({ done: 0, total: files.length })
    try {
      for (const [i, file] of files.entries()) {
        const uploaded = await uploadMedia(file)
        await createMedia({
          url: uploaded.url,
          resource_type: uploaded.resource_type,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
          description: description || null,
          date: date || null,
          lieu: lieu || null,
          album_id: albumId,
          athlete_ids: athleteIds,
        })
        setProgress({ done: i + 1, total: files.length })
      }
      onDone()
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Échec de l'envoi des médias.",
      )
      setIsSaving(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!isEdit && (
        <div>
          <label className={labelClass}>Fichiers (images ou vidéos)</label>
          <input type="file" accept="image/*,video/*" multiple onChange={handleFilesChange} />
          {files.length > 0 && (
            <>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné
                {files.length > 1 ? 's' : ''}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {file.type.startsWith('video/') ? (
                      <video src={previews[i]} muted className="h-full w-full object-cover" />
                    ) : (
                      <img src={previews[i]} alt={file.name} className="h-full w-full object-cover" />
                    )}
                    {!isSaving && (
                      <button
                        type="button"
                        aria-label={`Retirer ${file.name}`}
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Une petite description…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Lieu</label>
          <input
            type="text"
            className={inputClass}
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Ex. Bordeaux"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Album</label>
        <select
          className={inputClass}
          value={albumId ?? ''}
          onChange={(e) => setAlbumId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Aucun (média autonome)</option>
          {albums?.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Athlètes tagués</label>
        <AthletePicker value={athleteIds} onChange={setAthleteIds} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={isSaving}
          onClick={handleSubmit}
        >
          {isSaving
            ? progress
              ? `Envoi ${progress.done}/${progress.total}…`
              : 'Enregistrement…'
            : isEdit
              ? 'Enregistrer'
              : 'Ajouter à la galerie'}
        </button>
      </div>
    </div>
  )
}
