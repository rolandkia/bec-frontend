import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { MediaForm } from '../components/gallery/MediaForm'

export function MediaUploadPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function handleDone() {
    queryClient.invalidateQueries({ queryKey: ['gallery-media'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-media-admin'] })
    queryClient.invalidateQueries({ queryKey: ['gallery-albums'] })
    navigate('/galerie/admin')
  }

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-8 text-3xl">Ajouter des médias</h1>
      <MediaForm onDone={handleDone} />
    </div>
  )
}
