import { useState } from 'react'
import { sitePhoto } from '../../lib/cloudinary'

/**
 * Avatar photo avec repli monogramme. Si `src` est absent OU si l'image échoue
 * à charger (URL morte / placeholder), on affiche les initiales sur un dégradé
 * rouge. Garantit qu'aucun glyphe « image cassée » n'apparaît (ex. photos de
 * bureau en données placeholder).
 */
export function Avatar({
  src,
  alt,
  initials,
  size = 'h-16 w-16',
  rounded = 'rounded-2xl',
  textSize = 'text-lg',
}: {
  src?: string | null
  alt: string
  initials: string
  size?: string
  rounded?: string
  textSize?: string
}) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        // `sitePhoto` est INERTE sur une URL Cloudinary, que l'appelant a déjà
        // transformée (photos de coachs, cf. ClubPage) : il n'agit que sur un
        // chemin local, pour le cas où cet avatar recevrait un fichier de
        // `public/photos/profil`. La plus grande taille d'affichage du site fait
        // 128 px, `400` couvre donc les écrans à forte densité.
        src={sitePhoto(src, 400)}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 ${rounded} object-cover object-top shadow-sm`}
      />
    )
  }

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden ${rounded} bg-gradient-to-br from-club-primary-light to-club-primary ${textSize} font-display font-bold uppercase text-white shadow-sm`}
      aria-hidden
    >
      {initials}
    </div>
  )
}
