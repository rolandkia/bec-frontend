import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Lightbox, type LightboxItem } from '../ui/Lightbox'

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption', 'img', 'video',
  // Grille média : <div class="media-grid" data-type="media-grid">.
  'div',
]
const ALLOWED_ATTR = [
  'href', 'title', 'src', 'alt', 'class', 'width', 'controls', 'rel', 'target', 'style',
  'data-type',
  // Mention d'athlète : <a data-mention="123">@Prénom Nom</a>.
  'data-mention',
]

export function BlogContent({
  html,
  enableLightbox = true,
}: {
  html: string
  enableLightbox?: boolean
}) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['controls'],
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null)

  // Un seul gestionnaire délégué : les mentions d'athlète naviguent en SPA,
  // et un clic sur une image/vidéo ouvre la visionneuse plein écran.
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement

    const mention = target.closest('a[data-mention]')
    if (mention) {
      // En aperçu (non interactif) on neutralise le lien sans naviguer pour ne
      // pas quitter l'éditeur et perdre le contenu en cours de rédaction.
      e.preventDefault()
      if (!enableLightbox) return
      const href = mention.getAttribute('href')
      if (href) navigate(href)
      return
    }

    if (!enableLightbox) return

    const media = target.closest('img, video')
    if (media && containerRef.current) {
      const all = Array.from(
        containerRef.current.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video'),
      )
      const items: LightboxItem[] = all.map((el) => ({
        url: el instanceof HTMLVideoElement ? el.currentSrc || el.src : el.src,
        type: el instanceof HTMLVideoElement ? 'video' : 'image',
      }))
      const index = all.indexOf(media as HTMLImageElement | HTMLVideoElement)
      if (index >= 0) setLightbox({ items, index })
    }
  }

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light">
      <div
        ref={containerRef}
        className={`blog-rendered${enableLightbox ? ' blog-rendered-zoomable' : ''}`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox((l) => (l ? { ...l, index } : l))}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
