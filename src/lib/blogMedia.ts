import { cldImage, cldPoster, cldSrcSet, cldVideo } from './cloudinary'

/** Largeurs du `srcset` des images d'article. Trois seulement : chaque largeur
 *  est un dérivé Cloudinary supplémentaire, et les crédits du plan gratuit
 *  comptent les transformations. */
const IMAGE_WIDTHS = [480, 800, 1200] as const

/** La colonne d'article plafonne à 768 px (`max-w-3xl`) ; en dessous elle occupe
 *  toute la largeur. Approximation volontaire : une figure peut porter un
 *  `width:N%`, mais surestimer d'un cran ne coûte qu'un octet de plus. */
const IMAGE_SIZES = '(max-width: 800px) 100vw, 800px'

const IMAGE_OPTS = { crop: 'limit', quality: 'auto', format: 'auto' } as const

/**
 * Post-traitement du HTML d'article, APRÈS assainissement : URL de livraison
 * optimisées et attributs média normalisés.
 *
 * Pourquoi une passe sur la CHAÎNE plutôt qu'un hook DOMPurify ou un effet
 * post-rendu :
 *  - `DOMPurify.addHook` modifie un état GLOBAL du singleton, partagé avec
 *    `exportBlogPdf` : un hook posé pour l'article s'appliquerait aussi là-bas ;
 *  - un `useEffect` après rendu laisserait React poser le `src` d'origine, le
 *    navigateur commencerait à télécharger l'original pleine taille, puis
 *    l'effet le remplacerait — chaque image téléchargée DEUX fois.
 * Ici tout est en place avant que le HTML n'atteigne le DOM.
 *
 * C'est aussi ce qui répare les articles DÉJÀ PUBLIÉS sans migration : le
 * `playsinline` absent de leur HTML stocké est ajouté au rendu, de même que
 * l'image d'affiche.
 *
 * Les attributs ajoutés ici (`poster`, `srcset`, `playsinline`…) n'ont pas besoin
 * de figurer dans l'allowlist DOMPurify : ils arrivent après le nettoyage, à
 * partir de valeurs générées depuis une URL déjà assainie — aucune surface XSS.
 * `data-full-src` conserve l'URL d'origine pour la visionneuse, qui applique sa
 * propre taille plutôt que d'agrandir un dérivé de 1200 px.
 */
export function rewriteBlogMedia(html: string): string {
  if (!html) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')

  for (const img of Array.from(doc.querySelectorAll('img'))) {
    const raw = img.getAttribute('src')
    if (!raw) continue
    img.setAttribute('data-full-src', raw)
    img.setAttribute('src', cldImage(raw, 1200))
    const srcset = cldSrcSet(raw, IMAGE_WIDTHS, IMAGE_OPTS)
    if (srcset) {
      img.setAttribute('srcset', srcset)
      img.setAttribute('sizes', IMAGE_SIZES)
    }
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
  }

  for (const video of Array.from(doc.querySelectorAll('video'))) {
    const raw = video.getAttribute('src')
    if (!raw) continue
    video.setAttribute('data-full-src', raw)
    // Dérivé mp4/h264 : rend lisibles les .mov/HEVC d'iPhone, que Safari joue
    // mais que Chrome et Firefox refusent.
    video.setAttribute('src', cldVideo(raw))
    // Sans `playsinline`, iOS Safari bascule TOUJOURS dans son lecteur plein
    // écran — c'est ce qui empêchait de lancer une vidéo dans le fil de l'article.
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    // Un article retouché à la main pourrait ne pas avoir de contrôles : sans
    // eux, et sans la visionneuse, la vidéo serait injouable.
    video.setAttribute('controls', '')
    if (!video.hasAttribute('preload')) video.setAttribute('preload', 'metadata')
    const poster = cldPoster(raw)
    if (poster && !video.hasAttribute('poster')) video.setAttribute('poster', poster)
  }

  return doc.body.innerHTML
}

/** URL d'origine d'un média rendu, pour la visionneuse. */
export function fullSrcOf(el: Element): string {
  return el.getAttribute('data-full-src') ?? el.getAttribute('src') ?? ''
}
