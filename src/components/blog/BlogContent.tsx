import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { fullSrcOf, rewriteBlogMedia } from '../../lib/blogMedia'
import { Lightbox, type LightboxItem } from '../ui/Lightbox'

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption', 'img', 'video',
  // Grille média : <div class="media-grid" data-type="media-grid">.
  'div',
]
const ALLOWED_ATTR = [
  'href', 'title', 'src', 'alt', 'class', 'controls', 'preload', 'playsinline',
  'rel', 'target', 'style',
  'data-type',
  // Mention d'athlète : <a data-mention="123">@Prénom Nom</a>.
  'data-mention',
  // Pas de `width` : la largeur d'un média est portée par sa <figure> (en %).
  // Un `width` en px sur l'<img>/<video> échappait à la règle mobile — qui cible
  // la figure — et produisait un rendu différent entre téléphone et ordinateur.
  // Pas de `poster`/`srcset` non plus : ils sont ajoutés APRÈS l'assainissement
  // par rewriteBlogMedia, depuis des valeurs générées (cf. blogMedia.ts).
]

export function BlogContent({
  html,
  enableLightbox = true,
}: {
  html: string
  enableLightbox?: boolean
}) {
  // Mémoïsé : l'assainissement tournait à CHAQUE rendu, y compris à chaque
  // changement d'index de la visionneuse.
  const clean = useMemo(
    () =>
      rewriteBlogMedia(
        DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR }),
      ),
    [html],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null)

  // Un seul gestionnaire délégué : les mentions d'athlète naviguent en SPA,
  // et un clic sur une image ouvre la visionneuse plein écran.
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

    // IMAGES SEULEMENT. Une vidéo se lit EN PLACE : l'ouvrir dans la visionneuse
    // rendait la lecture inline impossible et interceptait jusqu'aux clics sur la
    // barre de contrôle native. Le plein écran reste accessible par le bouton
    // natif du lecteur — affordance de plateforme, accessible au clavier, avec
    // AirPlay et PiP en prime. `closest('img')` ne peut pas matcher un clic parti
    // d'une <video>, donc ses contrôles sont désormais pleinement utilisables.
    const media = target.closest('img')
    if (media && containerRef.current) {
      // Même sélecteur pour la collecte et pour la recherche d'index : la
      // correspondance est juste par construction.
      const all = Array.from(containerRef.current.querySelectorAll<HTMLImageElement>('img'))
      const items: LightboxItem[] = all.map((el) => ({
        url: fullSrcOf(el),
        type: 'image',
      }))
      const index = all.indexOf(media)
      if (index >= 0) setLightbox({ items, index })
    }
  }

  return (
    <div className="blog-container">
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
