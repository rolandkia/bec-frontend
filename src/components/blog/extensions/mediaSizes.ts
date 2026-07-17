/** Largeurs rapides (en % de la colonne de contenu) partagées par les images
 *  et les vidéos. `width: null` = taille naturelle (plafonnée à 100 %).
 *  Deux médias flottants à 50 % s'alignent côte à côte. */
export const SIZE_OPTIONS: { label: string; title: string; width: number }[] = [
  { label: '⅓', title: 'Un tiers de la largeur', width: 33 },
  { label: '½', title: 'Moitié de la largeur', width: 50 },
  { label: '⅔', title: 'Deux tiers de la largeur', width: 66 },
  { label: '100%', title: 'Pleine largeur', width: 100 },
]

/** Largeur minimale/maximale (en % de la colonne) au redimensionnement souris. */
export const MEDIA_WIDTH_MIN = 10
export const MEDIA_WIDTH_MAX = 100

/** Borne une largeur en pourcentage dans [MIN, MAX] et l'arrondit à l'entier. */
export function clampMediaWidth(width: number): number {
  return Math.round(Math.min(MEDIA_WIDTH_MAX, Math.max(MEDIA_WIDTH_MIN, width)))
}

/** Largeur minimale (en % de la rangée) d'un élément de grille média : en
 *  dessous, la vignette devient illisible et sa poignée insaisissable. */
export const GRID_ITEM_WIDTH_MIN = 20

/** Borne la largeur d'un élément de grille dans [GRID_ITEM_WIDTH_MIN, max]
 *  (max = part restante de la paire redimensionnée) et l'arrondit à l'entier. */
export function clampGridItemWidth(width: number, max: number): number {
  return Math.round(Math.min(max, Math.max(GRID_ITEM_WIDTH_MIN, width)))
}

/** Lit la largeur (% de colonne) depuis le style inline `width:X%` puis, en
 *  repli, depuis l'ancienne classe `fig-w-N` (contenu déjà publié). */
export function parseFigureWidth(element: HTMLElement): number | null {
  const styleWidth = element.style?.width ?? ''
  const styleMatch = styleWidth.match(/([\d.]+)%/)
  if (styleMatch) return clampMediaWidth(parseFloat(styleMatch[1]))
  const cls = element.getAttribute('class') ?? ''
  const clsMatch = cls.match(/fig-w-(\d+)/)
  return clsMatch ? clampMediaWidth(parseInt(clsMatch[1], 10)) : null
}
