import { useState } from 'react'

/**
 * Avatar photo avec repli monogramme. Si `src` est absent OU si l'image échoue
 * à charger (URL morte / placeholder), on affiche les initiales sur un dégradé
 * rouge, avec le blason club estompé. Garantit qu'aucun glyphe « image cassée »
 * n'apparaît (ex. photos de bureau en données placeholder).
 */
export function Avatar({
  src,
  alt,
  initials,
  size = 'h-16 w-16',
  rounded = 'rounded-2xl',
  textSize = 'text-lg',
  withLogo = true,
}: {
  src?: string | null
  alt: string
  initials: string
  size?: string
  rounded?: string
  textSize?: string
  withLogo?: boolean
}) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className={`${size} shrink-0 ${rounded} object-cover object-top shadow-sm`}
      />
    )
  }

  return (
    <div
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden ${rounded} bg-gradient-to-br from-club-primary-light to-club-primary ${textSize} font-display font-bold uppercase text-white shadow-sm`}
      aria-hidden
    >
      {withLogo && (
        <img
          src="/photos/logo.webp"
          alt=""
          className="absolute inset-0 m-auto h-3/4 w-3/4 object-contain opacity-[0.12]"
        />
      )}
      <span className="relative">{initials}</span>
    </div>
  )
}
