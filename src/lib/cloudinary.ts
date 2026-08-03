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

import { PHOTO_VARIANTS } from '../data/photoVariants'

/** `$1` = base jusqu'à `/upload`, `$2` = image|video, `$3` = le reste. */
const CLOUDINARY_URL = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload)\/(.+)$/

/** Nos deux dossiers de public_id : `bec_media` pour les médias envoyés par le
 *  back (galerie, blog, portraits), `bec_site` pour les photos ÉDITORIALES du
 *  site (cf. `sitePhoto`). Un seul endroit, parce que la liste sert à trois
 *  expressions différentes ci-dessous. */
const ASSET_FOLDER = String.raw`bec_(?:media|site)`

/** Une queue NON transformée commence par le dossier (précédé au plus d'une
 *  version), ce qui donne un test exact, et évite le piège d'une heuristique
 *  générique du type `/^[a-z]{1,3}_/` sur le premier segment, qui reconnaîtrait
 *  `bec_media` comme une transformation (`bec` + `_media`) et rendrait tout
 *  l'helper inerte. */
const UNTRANSFORMED_TAIL = new RegExp(String.raw`^(?:v\d+\/)?${ASSET_FOLDER}\/`)

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
  const folderAt = parsed.tail.search(
    new RegExp(String.raw`(?:^|\/)(v\d+\/)?${ASSET_FOLDER}\/`),
  )
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

// --- Photos éditoriales du site ---------------------------------------------
/**
 * Les photos éditoriales (bandeaux, chapitres, portraits de l'organigramme,
 * logos) vivent dans `public/photos` et sont référencées par chemin absolu
 * (`/photos/gallery/race-1.webp`) partout dans le code et les fichiers de
 * `src/data`. Servies telles quelles, elles le sont depuis la VM américaine, en
 * une seule largeur fixe (jusqu'à 339 ko pour un fichier), sans négociation de
 * format et sans CDN. C'est la part « les images mettent du temps à charger »
 * du problème.
 *
 * `sitePhoto` traduit ce chemin en URL de livraison Cloudinary quand le compte
 * est configuré à la compilation (`VITE_CLOUDINARY_CLOUD_NAME`), et RENVOIE LE
 * CHEMIN LOCAL sinon. Ce repli est le cœur du dispositif : le site fonctionne à
 * l'identique tant que les photos ne sont pas envoyées, la bascule se fait par
 * une variable d'environnement, et le retour arrière aussi. Les chemins locaux
 * restent donc l'identité canonique d'une photo : il n'y a pas de manifeste
 * d'URL à maintenir en parallèle des fichiers.
 *
 * Envoi des fichiers : `task upload:site-photos` côté backend.
 */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined

/** Dossier des public_id, à garder aligné avec le script d'envoi. */
const SITE_FOLDER = 'bec_site'

/** `/photos/gallery/x.webp` + 640 → `/photos/w640/gallery/x.webp`. Un simple
 *  préfixe : c'est tout l'intérêt d'un dossier par largeur (cf. le script). */
function variantPath(path: string, w: number): string {
  return path.replace('/photos/', `/photos/w${w}/`)
}

/**
 * Variante locale la plus proche PAR EXCÈS d'une largeur d'affichage, ou le
 * chemin d'origine s'il n'y a rien de plus petit qui convienne.
 *
 * Sert les surfaces qui n'ont qu'un `src`, sans `srcset` : le logo de 40 px de la
 * navbar tirait les 22 ko du fichier 512×512 sur chaque page, et un logo de
 * partenaire ou un portrait d'organigramme la pleine résolution du bandeau.
 */
function localVariant(path: string, w: number): string {
  const local = PHOTO_VARIANTS[path]
  if (!local) return path
  const fit = local.variants.find((v) => v >= w)
  return fit === undefined ? path : variantPath(path, fit)
}

/**
 * Chemin local (`/photos/x.webp`) → URL Cloudinary CANONIQUE (sans
 * transformation), ou le chemin tel quel si le compte n'est pas configuré.
 *
 * Exporté pour les surfaces qui appliquent DÉJÀ leur propre transformation à
 * partir d'une URL brute : la visionneuse, par exemple, qui ne sait pas d'où
 * vient l'image et appelle `cldImage` elle-même. Leur passer une URL déjà
 * transformée marcherait (`cldUrl` est alors inerte), mais au prix d'une
 * largeur choisie par le mauvais composant.
 */
export function sitePhotoUrl(path: string): string {
  if (!CLOUD_NAME || !path.startsWith('/')) return path
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${SITE_FOLDER}${path}`
}

/** Photo éditoriale bornée en largeur, format et qualité négociés — ou, hors
 *  Cloudinary, la variante locale la plus proche par excès (cf. `localVariant`).
 *  Le paramètre `w` était jusqu'ici IGNORÉ dans ce second cas : tous les
 *  appelants demandaient déjà la bonne largeur, seule la livraison manquait. */
export function sitePhoto(path: string, w = 1600): string {
  const url = sitePhotoUrl(path)
  return url === path ? localVariant(path, w) : cldImage(url, w)
}

/**
 * `srcset` d'une photo éditoriale — par Cloudinary si le compte est configuré,
 * sinon par les VARIANTES LOCALES pré-générées (`public/photos/w<largeur>/…`,
 * cf. scripts/photo-variants.mjs). `undefined` seulement si la photo n'a ni
 * l'un ni l'autre : l'attribut doit alors être omis, pas rempli d'une valeur
 * inutile.
 *
 * Le repli local existe parce que la seule largeur servie était celle du plus
 * grand écran possible : 171 ko de hero pour un téléphone qui n'en affiche que
 * 1 080 px, sur un lien où les images pèsent 90 % de la page. Il ne dépend
 * d'aucun compte ni d'aucune variable d'environnement, donc il agit tout de
 * suite — et devient inerte le jour où Cloudinary est activé, sans rien à
 * défaire ici.
 *
 * `widths` filtre l'échelle disponible au lieu de la remplacer : un appelant
 * demande les largeurs de SA surface (384/768 pour une vignette de bande), et
 * seules les variantes qui existent réellement peuvent être proposées. Le
 * fichier original ferme toujours la liste, à sa largeur intrinsèque.
 */
export function sitePhotoSrcSet(
  path: string,
  widths: readonly number[] = [640, 1280, 1920],
): string | undefined {
  const url = sitePhotoUrl(path)
  if (url !== path) {
    // Trois largeurs comme `cldSrcSet` : les crédits du plan gratuit comptent
    // les transformations, et chaque largeur est un dérivé de plus.
    return cldSrcSet(url, widths, { crop: 'limit', quality: 'auto', format: 'auto' })
  }

  const local = PHOTO_VARIANTS[path]
  if (!local) return undefined
  const max = Math.max(...widths)
  // On garde les variantes utiles à la surface demandée, plus la première qui la
  // dépasse : c'est elle que choisira un écran à forte densité de pixels.
  const useful = local.variants.filter((w) => w <= max)
  const next = local.variants.find((w) => w > max)
  if (next !== undefined) useful.push(next)
  const entries = useful.map((w) => `${variantPath(path, w)} ${w}w`)
  // L'original en dernière marche, sauf s'il est déjà couvert : une variante à
  // la largeur intrinsèque n'existe pas (cf. MIN_GAIN du script).
  if (useful[useful.length - 1] !== local.w) entries.push(`${path} ${local.w}w`)
  return entries.length > 1 ? entries.join(', ') : undefined
}

/**
 * Première condition de `sizes` pour une PHOTOGRAPHIE pleine largeur sur
 * téléphone. À poser avant les autres conditions, qui sont évaluées dans
 * l'ordre.
 *
 * ATTENTION, `70vw` n'est PAS la largeur d'affichage : ces photos occupent bien
 * toute la largeur de l'écran. C'est un PLAFOND DE DENSITÉ, et c'est le seul
 * levier statique qui existe pour en poser un — le navigateur multiplie la
 * valeur de `sizes` par la densité réelle de l'écran, sans qu'aucun attribut ne
 * permette de borner ce facteur.
 *
 * Ce qu'il évite : un téléphone à 2,6× (Pixel 7, iPhone Pro…) réclame 1 080 px
 * pour 412 px d'écran. Comme presque toutes nos sources font 1 200 px de large,
 * AUCUNE variante n'est assez grande et le navigateur retombe sur l'original —
 * 319 ko pour une tuile de 380 px, alors que la variante 768 en fait 127. En
 * annonçant 70vw, la demande tombe à ~760 px, donc sur la marche 768, soit
 * 1,86× de densité réelle.
 *
 * Pourquoi c'est un bon échange ici : 1,86× sur une PHOTOGRAPHIE (aucun texte,
 * aucun trait fin, et le plus souvent sous un voile) est indiscernable de 2,6× à
 * distance de bras, alors que la différence de poids est du simple au triple sur
 * un lien mobile qui traverse déjà l'Atlantique. Le plafond ne s'applique QU'AUX
 * téléphones (`max-width: 639px`) : au-delà, la densité est de 1 à 2 et la
 * largeur annoncée redevient la vraie.
 */
export const PHONE_PHOTO_CAP = '(max-width: 639px) 70vw'

/**
 * Trio `src` / `srcSet` / `sizes` d'une photo éditoriale, prêt à étaler sur une
 * balise `<img>`. Existe pour que `sizes` ne soit JAMAIS posé sans `srcSet` :
 * seul, il ne sert à rien et brouille la lecture du rendu.
 *
 * `sizes` par défaut aux bandeaux et chapitres PLEINE PAGE, qui sont la majorité
 * des cas, plafond de densité téléphone compris (cf. `PHONE_PHOTO_CAP`). Une
 * surface plus étroite (portrait de l'organigramme, logo de partenaire, vignette
 * de bande) passe le sien avec les largeurs correspondantes.
 */
export function sitePhotoProps(
  path: string,
  {
    sizes = `${PHONE_PHOTO_CAP}, 100vw`,
    widths,
    w,
  }: { sizes?: string; widths?: readonly number[]; w?: number } = {},
): { src: string; srcSet?: string; sizes?: string } {
  const srcSet = sitePhotoSrcSet(path, widths)
  return { src: sitePhoto(path, w), srcSet, sizes: srcSet ? sizes : undefined }
}
