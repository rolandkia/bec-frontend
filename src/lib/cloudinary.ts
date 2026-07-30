/** Transformations Cloudinary appliquées À LA LIVRAISON.
 *
 *  Le backend stocke le `secure_url` BRUT (cf. media_service.upload_media) et ne
 *  le transforme jamais en base : le nettoyage des orphelins compare des URL, et
 *  une URL transformée stockée ferait considérer l'original comme non référencé —
 *  donc détruire un fichier encore affiché. Les optimisations sont donc
 *  reconstruites ici, au rendu. Avantage collatéral : elles s'appliquent
 *  rétroactivement à tous les médias déjà en base, sans migration.
 *
 *  Ces fonctions sont PURES et ne doivent jamais alimenter un chemin de
 *  sauvegarde. Si une URL transformée risque de repartir dans l'éditeur (copier /
 *  glisser depuis un article rendu), la normaliser avec `stripCldTransforms`. */

/** `$1` = base jusqu'à `/upload`, `$2` = image|video, `$3` = le reste. */
const CLOUDINARY_URL = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload)\/(.+)$/

/** Une queue NON transformée commence par le dossier (précédé au plus d'une
 *  version). Tous nos public_id vivent dans `bec_media/`, ce qui donne un test
 *  exact — et évite le piège d'une heuristique générique du type `/^[a-z]{1,3}_/`
 *  sur le premier segment, qui reconnaîtrait `bec_media` comme une
 *  transformation (`bec` + `_media`) et rendrait tout l'helper inerte. */
const UNTRANSFORMED_TAIL = /^(?:v\d+\/)?bec_media\//

export interface CldOptions {
  /** `w_` — largeur maximale (ou exacte avec `crop: 'fill'`). */
  w?: number
  /** `c_` — `limit` borne sans recadrer, `fill` remplit et recadre. */
  crop?: 'limit' | 'fill' | 'fit'
  /** `g_` — sujet privilégié au recadrage (`auto`, `face`). */
  gravity?: 'auto' | 'face'
  /** `q_` — `auto` laisse Cloudinary choisir le compromis poids/qualité. */
  quality?: 'auto' | 'auto:good' | 'auto:eco'
  /** `f_` — `auto` négocie webp/avif selon le navigateur. */
  format?: 'auto' | 'mp4' | 'jpg'
  /** `so_` — instant (en secondes) de l'image extraite d'une vidéo. */
  startOffset?: number
  /** `vc_` — codec vidéo. */
  videoCodec?: 'auto'
  /** Extension de sortie, si elle doit changer (poster JPEG d'une vidéo…). */
  extension?: string
}

interface ParsedUrl {
  base: string
  resourceType: 'image' | 'video'
  tail: string
}

function parse(url: string | null | undefined): ParsedUrl | null {
  if (!url) return null
  const match = CLOUDINARY_URL.exec(url)
  if (!match) return null
  return { base: match[1], resourceType: match[2] as 'image' | 'video', tail: match[3] }
}

/** Jetons triés alphabétiquement, comme le fait le SDK Python (`utils.py`,
 *  `sorted_params`) : c'est ce qui permet à la chaîne construite ici de
 *  correspondre EXACTEMENT au dérivé `eager` pré-généré à l'envoi. */
function transformation(opts: CldOptions): string {
  const tokens: string[] = []
  if (opts.crop) tokens.push(`c_${opts.crop}`)
  if (opts.format) tokens.push(`f_${opts.format}`)
  if (opts.gravity) tokens.push(`g_${opts.gravity}`)
  if (opts.quality) tokens.push(`q_${opts.quality}`)
  if (opts.startOffset !== undefined) tokens.push(`so_${opts.startOffset}`)
  if (opts.videoCodec) tokens.push(`vc_${opts.videoCodec}`)
  if (opts.w) tokens.push(`w_${opts.w}`)
  return tokens.sort().join(',')
}

function withExtension(tail: string, extension?: string): string {
  if (!extension) return tail
  // Sépare une éventuelle query/fragment avant de toucher à l'extension.
  const suffixAt = tail.search(/[?#]/)
  const path = suffixAt === -1 ? tail : tail.slice(0, suffixAt)
  const suffix = suffixAt === -1 ? '' : tail.slice(suffixAt)
  const lastSlash = path.lastIndexOf('/')
  const dot = path.indexOf('.', lastSlash + 1)
  const stem = dot === -1 ? path : path.slice(0, dot)
  return `${stem}.${extension}${suffix}`
}

/** Insère une transformation dans une URL Cloudinary. No-op (URL renvoyée telle
 *  quelle) si l'URL est absente, n'est pas un de nos assets, ou porte déjà une
 *  transformation — appelable sans condition sur n'importe quelle source. */
export function cldUrl(url: string | null | undefined, opts: CldOptions = {}): string {
  const parsed = parse(url)
  if (!parsed || !UNTRANSFORMED_TAIL.test(parsed.tail)) return url ?? ''
  const segment = transformation(opts)
  const tail = withExtension(parsed.tail, opts.extension)
  return segment ? `${parsed.base}/${segment}/${tail}` : `${parsed.base}/${tail}`
}

/** Retire toute transformation de livraison pour retrouver l'URL canonique. À
 *  utiliser sur tout chemin qui peut RE-ENREGISTRER une URL (parseHTML de
 *  l'éditeur), pour qu'une variante transformée ne se retrouve jamais en base. */
export function stripCldTransforms(url: string | null | undefined): string {
  const parsed = parse(url)
  if (!parsed) return url ?? ''
  if (UNTRANSFORMED_TAIL.test(parsed.tail)) return url ?? ''
  // Ne garde que la version (si présente) et le public_id.
  const folderAt = parsed.tail.search(/(?:^|\/)(v\d+\/)?bec_media\//)
  if (folderAt === -1) return url ?? ''
  const kept = parsed.tail.slice(folderAt).replace(/^\//, '')
  return `${parsed.base}/${kept}`
}

/** Dérivé vidéo canonique : mp4/h264 borné à 1280 px, qualité automatique.
 *
 *  DOIT produire la MÊME chaîne que VIDEO_EAGER côté backend
 *  (bec-backend/src/services/media_service.py) — `c_limit,q_auto,vc_auto,w_1280`
 *  + `.mp4`. Cloudinary indexe ses dérivés par chaîne de transformation : si les
 *  deux divergent, le dérivé pré-généré n'est jamais servi et chaque vidéo repart
 *  en transcodage à la volée, qui répond HTTP 423 tant qu'il n'est pas terminé —
 *  et un <video> qui reçoit un 423 échoue sans réessai.
 *
 *  Règle au passage les .mov/HEVC d'iPhone, lisibles par Safari mais pas par
 *  Chrome ni Firefox. */
export function cldVideo(url: string | null | undefined): string {
  return cldUrl(url, {
    crop: 'limit',
    quality: 'auto',
    videoCodec: 'auto',
    w: 1280,
    extension: 'mp4',
  })
}

/** Image d'affiche d'une vidéo (première frame), ou `null` si l'URL n'est pas une
 *  de nos vidéos Cloudinary.
 *
 *  Renvoie `null` plutôt qu'une URL devinée pour que l'appelant OMETTE `poster`
 *  au lieu d'en poser un cassé. Sans poster, un <video> se dessine à la taille
 *  intrinsèque par défaut (300×150) jusqu'à l'arrivée des métadonnées, et rend
 *  souvent un rectangle noir sur iOS. */
export function cldPoster(url: string | null | undefined, w = 1280): string | null {
  const parsed = parse(url)
  if (!parsed || parsed.resourceType !== 'video') return null
  const poster = cldUrl(url, { crop: 'limit', startOffset: 0, w, extension: 'jpg' })
  return poster === url ? null : poster
}

/** `srcset` pour une image responsive, ou `undefined` hors Cloudinary (l'attribut
 *  doit alors être omis, pas rempli avec une valeur inutile).
 *
 *  Volontairement limité à trois largeurs : les crédits du plan gratuit comptent
 *  les transformations, et chaque largeur est un dérivé de plus. */
export function cldSrcSet(
  url: string | null | undefined,
  widths: readonly number[],
  opts: CldOptions = {},
): string | undefined {
  if (!parse(url)) return undefined
  return widths.map((w) => `${cldUrl(url, { ...opts, w })} ${w}w`).join(', ')
}

// --- Préréglages ------------------------------------------------------------
// Un seul endroit pour les tailles de livraison, afin qu'une même surface ne
// dérive pas entre deux composants.

/** Vignette de grille : recadrée pour un rendu régulier. */
export const cldThumb = (url: string | null | undefined, w = 600): string =>
  cldUrl(url, { crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto', w })

/** Image affichée à sa forme naturelle, bornée en largeur. */
export const cldImage = (url: string | null | undefined, w = 1200): string =>
  cldUrl(url, { crop: 'limit', quality: 'auto', format: 'auto', w })

/** Portrait : recadrage centré sur le visage. */
export const cldPortrait = (url: string | null | undefined, w = 400): string =>
  cldUrl(url, { crop: 'fill', gravity: 'face', quality: 'auto', format: 'auto', w })
