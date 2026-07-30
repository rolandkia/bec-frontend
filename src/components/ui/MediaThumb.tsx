import { cldPoster, cldThumb } from '../../lib/cloudinary'

/** Vignette d'un média de galerie, image comme vidéo.
 *
 *  Une vidéo est représentée par son IMAGE D'AFFICHE, pas par un `<video>` : les
 *  grilles utilisaient `<video preload="metadata">`, ce qui téléchargeait des
 *  octets vidéo pour chaque tuile — et rendait fréquemment un rectangle noir sur
 *  iOS. Les appelants ajoutent par-dessus leur propre indicateur « vidéo »
 *  (badge, bouton play).
 *
 *  Remplace quatre copies quasi identiques (grille de galerie, sélecteur de
 *  médias du blog, gestionnaire d'album, administration). */
export function MediaThumb({
  url,
  isVideo,
  alt = '',
  width = 400,
  className = 'h-full w-full object-cover',
}: {
  url: string
  isVideo: boolean
  alt?: string
  /** Largeur du dérivé Cloudinary demandé (la vignette est recadrée). */
  width?: number
  className?: string
}) {
  const poster = isVideo ? cldPoster(url, width) : null

  // Vidéo hors Cloudinary (URL posée à la main via l'API) : aucune affiche à
  // dériver. On retombe sur l'ancien rendu <video> plutôt que de mettre une URL
  // vidéo dans un <img>, ce qui donnerait une image cassée.
  if (isVideo && !poster) {
    return <video src={url} muted playsInline preload="metadata" className={className} />
  }

  return (
    <img
      src={poster ?? cldThumb(url, width)}
      alt={alt}
      loading="lazy"
      className={className}
    />
  )
}
