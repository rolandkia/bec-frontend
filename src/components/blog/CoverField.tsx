import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { FolderOpen, ImageUp, Loader2, Trash2 } from 'lucide-react'
import { uploadMedia } from '../../api/media'
import type { CoverPosition } from '../../api/types'
import { ACCEPT_IMAGE, mediaKind } from '../../lib/mediaKind'
import { CoverFocalPicker } from './CoverFocalPicker'
import { GalleryMediaPicker } from './GalleryMediaPicker'

/**
 * Couverture d'un article : l'envoyer (bouton ou glisser-déposer), OU la
 * choisir dans la galerie — publications comme photos du club. Il fallait
 * jusqu'ici renvoyer vers Cloudinary une photo déjà en ligne pour en faire une
 * couverture, donc la stocker deux fois. Une fois posée, le cadrage s'affiche
 * dessous (CoverFocalPicker).
 *
 * Changer de couverture remet le cadrage au centre : le point choisi pour
 * l'ancienne photo ne désigne rien sur la nouvelle.
 */
export function CoverField({
  url,
  position,
  onChange,
  onPositionChange,
}: {
  url: string | null
  position: CoverPosition
  onChange: (url: string | null) => void
  onPositionChange: (position: CoverPosition) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function replace(next: string | null) {
    onChange(next)
    onPositionChange('50% 50%')
  }

  async function upload(file: File | undefined) {
    if (!file) return
    if (mediaKind(file) !== 'image') {
      setError('La couverture doit être une image (JPEG, PNG, WebP, HEIC…).')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const { url: uploaded } = await uploadMedia(file)
      replace(uploaded)
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Échec de l'envoi de l'image de couverture.",
      )
    } finally {
      setUploading(false)
    }
  }

  const actions = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className="btn-outline tap inline-flex items-center gap-2 px-4 py-2 text-sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImageUp className="h-4 w-4" aria-hidden />}
        {uploading ? 'Envoi…' : url ? 'Remplacer' : 'Envoyer une photo'}
      </button>
      <button
        type="button"
        className="btn-outline tap inline-flex items-center gap-2 px-4 py-2 text-sm"
        disabled={uploading}
        onClick={() => setGalleryOpen(true)}
      >
        <FolderOpen className="h-4 w-4" aria-hidden />
        Choisir dans la galerie
      </button>
      {url && (
        <button
          type="button"
          className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => replace(null)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Retirer
        </button>
      )}
    </div>
  )

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGE}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void upload(file)
        }}
      />

      {url ? (
        <div className="space-y-4">
          <CoverFocalPicker src={url} value={position} onChange={onPositionChange} />
          {actions}
        </div>
      ) : (
        // Zone de dépôt : tout le cadre accepte une image glissée depuis le
        // bureau, les boutons restent la voie au doigt.
        <div
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes('Files')) return
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void upload(e.dataTransfer.files[0])
          }}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? 'border-club-primary bg-club-primary/5'
              : 'border-[color:var(--color-line)] bg-[color:var(--color-surface-2)]/50'
          }`}
        >
          <p className="text-sm text-[color:var(--color-muted)]">
            Glissez une photo ici, ou :
          </p>
          {actions}
          <p className="text-xs text-[color:var(--color-muted)]">
            Facultative, mais c'est elle qui donne envie d'ouvrir l'article dans le Mag.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {galleryOpen && (
        <GalleryMediaPicker
          mode="single"
          onClose={() => setGalleryOpen(false)}
          onInsert={([picked]) => {
            setGalleryOpen(false)
            if (picked) replace(picked.url)
          }}
        />
      )}
    </div>
  )
}
