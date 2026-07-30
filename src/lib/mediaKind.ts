/** Classification d'un fichier média : image, vidéo, ou rien.
 *
 *  Le type MIME est la source primaire, mais il n'est pas fiable : selon la
 *  plateforme et la manière dont le fichier arrive (sélecteur, glisser-déposer,
 *  collage), un `.mp4` peut être annoncé `application/octet-stream` ou même avec
 *  un type vide. Tout le pipeline se fiait au seul MIME, si bien qu'un tel
 *  fichier était rejeté par `accept`, ignoré en silence au drop/collage, et
 *  compté comme une IMAGE par le contrôle de taille — d'où le message « Image
 *  trop volumineuse (max 10 Mo) » sur une vidéo.
 *
 *  Les deux listes d'extensions doivent RESTER ALIGNÉES sur
 *  bec-backend/src/services/media_service.py (VIDEO_EXTENSIONS / IMAGE_EXTENSIONS). */

export type MediaKind = 'image' | 'video'

/** MIME génériques qui ne disent rien : on retombe alors sur l'extension. */
const OPAQUE_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream', '*/*'])

const VIDEO_EXTENSIONS = [
  'mp4',
  'm4v',
  'mov',
  'qt',
  'webm',
  'mkv',
  'avi',
  '3gp',
  '3g2',
  'ogv',
  'mpg',
  'mpeg',
  'mts',
  'm2ts',
  'wmv',
  'flv',
] as const

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'heic',
  'heif',
  'bmp',
  'tif',
  'tiff',
  'svg',
  'ico',
] as const

const VIDEO_SET: ReadonlySet<string> = new Set(VIDEO_EXTENSIONS)
const IMAGE_SET: ReadonlySet<string> = new Set(IMAGE_EXTENSIONS)

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

function kindFromExtension(name: string): MediaKind | null {
  const ext = extensionOf(name)
  if (VIDEO_SET.has(ext)) return 'video'
  if (IMAGE_SET.has(ext)) return 'image'
  return null
}

/** MIME canonique d'une extension, pour re-typer un fichier mal annoncé. */
function typeFromExtension(name: string): string | null {
  const ext = extensionOf(name)
  if (VIDEO_SET.has(ext)) return `video/${ext === 'mov' || ext === 'qt' ? 'quicktime' : ext}`
  if (IMAGE_SET.has(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`
  return null
}

/** `'image'`, `'video'`, ou `null` si le fichier n'est ni l'un ni l'autre. */
export function mediaKind(file: File): MediaKind | null {
  const type = (file.type || '').split(';')[0].trim().toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  // Un MIME explicite mais non-média (application/pdf…) est un refus net ; seuls
  // les types génériques justifient de regarder l'extension.
  if (!OPAQUE_TYPES.has(type)) return null
  return kindFromExtension(file.name)
}

/** Renvoie `file` avec un `type` correct quand le navigateur n'a pas su le
 *  déterminer, pour que le `Content-Type` de la part multipart soit juste côté
 *  serveur (le repli par extension y existe aussi, mais autant ne pas en
 *  dépendre). La construction depuis un blob existant est par référence : aucune
 *  copie des octets, même pour 100 Mo. */
export function withInferredType(file: File): File {
  const type = (file.type || '').trim().toLowerCase()
  if (!OPAQUE_TYPES.has(type)) return file
  const inferred = typeFromExtension(file.name)
  if (!inferred) return file
  return new File([file], file.name, { type: inferred, lastModified: file.lastModified })
}

/** Sépare une sélection en fichiers exploitables et fichiers refusés, pour que
 *  les seconds soient SIGNALÉS au lieu d'être filtrés en silence — c'était le cas
 *  au drop, au collage et dans le formulaire de galerie. */
export function partitionMediaFiles(files: File[]): { supported: File[]; rejected: File[] } {
  const supported: File[] = []
  const rejected: File[] = []
  for (const file of files) (mediaKind(file) ? supported : rejected).push(file)
  return { supported, rejected }
}

/** Message pour un ou plusieurs fichiers refusés faute de type reconnu. */
export function unsupportedFileMessage(files: File[]): string {
  const names = files.map((f) => `« ${f.name} »`).join(', ')
  return files.length > 1
    ? `Fichiers ignorés (ni image ni vidéo reconnue) : ${names}.`
    : `${names} n'est ni une image ni une vidéo reconnue.`
}

function acceptList(kinds: readonly string[], wildcard: string): string {
  // Le wildcard couvre les cas normaux ; la liste explicite rattrape les
  // plateformes où le navigateur ne mappe pas l'extension vers un MIME (sans
  // elle, le fichier est grisé dans le sélecteur de l'OS).
  return [wildcard, ...kinds.map((ext) => `.${ext}`)].join(',')
}

/** `accept` pour un champ acceptant images ET vidéos. */
export const ACCEPT_MEDIA = [
  acceptList(IMAGE_EXTENSIONS, 'image/*'),
  acceptList(VIDEO_EXTENSIONS, 'video/*'),
].join(',')

/** `accept` pour un champ image seule (couvertures d'article et d'album : leur
 *  URL est rendue dans un <img>). */
export const ACCEPT_IMAGE = acceptList(IMAGE_EXTENSIONS, 'image/*')
