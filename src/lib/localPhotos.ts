/**
 * Variantes LOCALES des photos éditoriales (`public/photos/w<largeur>/…`,
 * générées par scripts/photo-variants.mjs) : le `src` et le `srcset` que le site
 * émet tant que Cloudinary n'est pas activé pour ces photos.
 *
 * Module PUR — ni `import.meta`, ni DOM, imports suffixés `.ts` — parce qu'il a
 * deux clients : le site (`sitePhoto` / `sitePhotoSrcSet` dans lib/cloudinary.ts)
 * et `vite.config.ts`, qui écrit dans index.html le préchargement de la photo
 * d'ouverture de chaque page. Les deux doivent produire le MÊME srcset : s'ils
 * divergeaient, le navigateur téléchargerait deux fichiers au lieu d'un. Une
 * seule implémentation, ici, est ce qui le garantit.
 */

import { PHOTO_VARIANTS } from '../data/photoVariants.ts'

/** Largeurs visées par défaut par un `srcset` de photo éditoriale — celles des
 *  bandeaux et chapitres pleine page (cf. `sitePhotoSrcSet`). */
export const DEFAULT_SRCSET_WIDTHS: readonly number[] = [640, 1280, 1920]

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
export function localVariant(path: string, w: number): string {
  const local = PHOTO_VARIANTS[path]
  if (!local) return path
  const fit = local.variants.find((v) => v >= w)
  return fit === undefined ? path : variantPath(path, fit)
}

/**
 * `srcset` construit sur les variantes locales, ou `undefined` si la photo n'en
 * a pas (l'attribut doit alors être omis). `widths` filtre l'échelle disponible
 * au lieu de la remplacer — cf. `sitePhotoSrcSet`.
 */
export function localSrcSet(
  path: string,
  widths: readonly number[] = DEFAULT_SRCSET_WIDTHS,
): string | undefined {
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
