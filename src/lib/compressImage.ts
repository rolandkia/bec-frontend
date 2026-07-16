/** Seuil au-delà duquel on tente une compression (1,5 Mo). */
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024
/** Dimension maximale (largeur ou hauteur) après compression. */
const MAX_DIMENSION = 2560
const JPEG_QUALITY = 0.85

/** Formats à ne pas recompresser : animation (gif) ou vectoriel (svg). */
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml'])

/**
 * Compresse une image côté client (canvas natif, aucune dépendance) avant
 * upload : downscale à 2560 px max et ré-encodage JPEG (ou PNG si la source
 * est un PNG, pour préserver la transparence). En cas d'échec ou si le
 * résultat est plus gros que l'original, renvoie le fichier d'origine — la
 * limite de 10 Mo reste vérifiée côté serveur.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (file.size < COMPRESS_THRESHOLD && scale === 1) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const isPng = file.type === 'image/png'
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : JPEG_QUALITY),
    )
    if (!blob || blob.size >= file.size) return file

    const name = isPng ? file.name : file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: blob.type })
  } catch {
    return file
  }
}
