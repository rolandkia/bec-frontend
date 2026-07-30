import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMedia } from '../api/gallery'
import { MediaForm } from '../components/gallery/MediaForm'
import { Loading, ErrorMessage, NotFound } from '../components/ui/Status'
import { cldImage, cldPoster, cldVideo } from '../lib/cloudinary'

export function MediaEditPage() {
  const { id } = useParams<{ id: string }>()
  const mediaId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: media, isLoading, isError, error } = useQuery({
    queryKey: ['gallery-media-item', mediaId],
    queryFn: () => getMedia(mediaId),
    enabled: Number.isFinite(mediaId),
    retry: false,
  })

  function handleDone() {
    queryClient.invalidateQueries({ queryKey: ['gallery-media'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-media-admin'] })
    navigate('/galerie/admin')
  }

  if (isLoading) return <Loading />
  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return <NotFound title="Média introuvable" message="Ce média n'existe pas." />
    }
    return <ErrorMessage message="Impossible de charger ce média." />
  }
  if (!media) return null

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8">Modifier le média</h1>
      <div className="mb-6 aspect-video w-full max-w-md overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {media.resource_type === 'video' ? (
          <video
            src={cldVideo(media.url)}
            poster={cldPoster(media.url) ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <img src={cldImage(media.url)} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      <MediaForm existing={media} onDone={handleDone} />
    </div>
  )
}
