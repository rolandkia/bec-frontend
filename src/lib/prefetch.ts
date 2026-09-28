/**
 * Préchargement des morceaux de code de pages, avant le clic.
 *
 * Trois déclencheurs, du plus sûr au plus spéculatif (cf. `usePrefetch` et
 * `warmNavRoutes`) :
 *   1. le doigt qui touche un lien (`touchstart`), le pointeur qui l'atteint
 *      (`pointerenter`) ou le focus clavier — l'intention est quasi certaine, et
 *      sur mobile `touchstart` précède le `click` d'environ 100 ms, largement de
 *      quoi entamer la requête ;
 *   2. un temps mort après le chargement complet de l'accueil, pour les quatre
 *      sections de la navbar (~15 ko compressés à elles quatre) ;
 *   3. rien du tout si la connexion se déclare limitée (voir `isFrugal`) : sur un
 *      forfait économe ou en 2G, dépenser des octets pour une page qui ne sera
 *      peut-être pas demandée est le mauvais échange.
 *
 * Les photos des vues suivantes (bandeau qui alterne, autre onglet) suivent la
 * même politique : `warmSitePhoto`, lancé depuis `afterPageLoad`.
 */

import { sitePhotoProps } from './cloudinary'
import { chunkForPath } from './routeChunks'

/** Morceaux déjà demandés — `import()` mémoïse déjà, ce garde-fou évite juste le
 *  bruit d'appels répétés à chaque `pointerenter`. */
const requested = new Set<() => Promise<unknown>>()

/**
 * `true` quand le navigateur annonce une connexion sur laquelle il ne faut PAS
 * spéculer. `navigator.connection` n'existe pas sur Safari : son absence est
 * traitée comme « connexion normale », le comportement le plus utile par défaut
 * (le préchargement est de toute façon annulable et sans effet de bord).
 */
export function isFrugal(): boolean {
  const c = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (!c) return false
  return Boolean(c.saveData) || /(^|-)2g$/.test(c.effectiveType ?? '')
}

/** Demande un morceau, une seule fois, en avalant l'échec : un préchargement qui
 *  rate ne doit rien casser — le clic refera la demande et affichera son erreur
 *  par le chemin normal. */
export function prefetchChunk(load: () => Promise<unknown>): void {
  if (requested.has(load) || isFrugal()) return
  requested.add(load)
  load().catch(() => requested.delete(load))
}

/** Précharge le morceau associé à une adresse interne, s'il y en a un. */
export function prefetchPath(path: string): void {
  const load = chunkForPath[path.split('?')[0].split('#')[0]]
  if (load) prefetchChunk(load)
}

/**
 * Gestionnaires à étaler sur un lien (`<Link {...intentProps('/athletes')}>`).
 *
 * Fonction ordinaire et non hook : ces attributs sont posés dans des `map()` de
 * liens, où un hook serait interdit. Rien à mémoïser de toute façon — les
 * fermetures créées ici ne servent qu'à appeler `prefetchPath`, qui est
 * idempotent.
 *
 * `onTouchStart` ET `onPointerEnter` : sur mobile un appui déclenche bien
 * `pointerenter`, mais au même instant que le `pointerdown`, alors que
 * `touchstart` part avant — et sur un écran non tactile c'est le survol qui donne
 * l'avance. `onFocus` couvre la navigation au clavier.
 */
export function intentProps(path: string) {
  const onIntent = () => prefetchPath(path)
  return { onPointerEnter: onIntent, onTouchStart: onIntent, onFocus: onIntent }
}

/**
 * Préchauffe les sections de la navbar une fois l'accueil VRAIMENT posé.
 *
 * Le délai n'est pas cosmétique : l'accueil garde le réseau occupé plusieurs
 * secondes (photos), et les six connexions HTTP/1.1 sont un budget partagé. Un
 * préchargement lancé trop tôt retarderait les images de la page en cours pour
 * gagner sur une page hypothétique. On attend donc l'évènement `load`, puis un
 * temps mort du thread principal.
 *
 * Renvoie sa fonction d'annulation (utile au démontage en développement, où le
 * mode strict monte deux fois).
 */
export function warmNavRoutes(): () => void {
  if (isFrugal()) return () => {}
  return afterPageLoad(() => {
    for (const path of ['/club', '/athletes', '/competitions', '/mag', '/rejoindre']) {
      prefetchPath(path)
    }
  })
}

/**
 * Exécute `run` une fois la page VRAIMENT posée : après l'évènement `load`, puis
 * `delayMs`, puis un temps mort du fil principal. Tout ce qui est spéculatif
 * (morceaux de pages, photos des vues suivantes) doit passer par ici : avant,
 * les six connexions HTTP/1.1 servent encore la page en cours.
 *
 * `load` seul ne suffit pas, d'où le délai par défaut : dans une application
 * monopage il tombe TÔT, dès le JavaScript initial arrivé, avant le morceau de
 * la page et les images qu'il demande (mesuré sur /club : `load` à ~450 ms, les
 * photos de la page partent juste après).
 *
 * Renvoie sa fonction d'annulation, à rendre depuis un `useEffect` (le mode
 * strict monte deux fois en développement, et un composant peut disparaître
 * avant `load`).
 */
export function afterPageLoad(run: () => void, delayMs = 1200): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }
  let idleHandle: number | undefined
  let timer: number | undefined

  const idle = () => {
    if (w.requestIdleCallback) idleHandle = w.requestIdleCallback(run, { timeout: 3000 })
    else timer = window.setTimeout(run, 300)
  }
  const start = () => {
    timer = window.setTimeout(idle, delayMs)
  }

  // `load` est déjà passé si l'utilisateur arrive par une navigation interne.
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  return () => {
    window.removeEventListener('load', start)
    if (timer) clearTimeout(timer)
    if (idleHandle && w.cancelIdleCallback) w.cancelIdleCallback(idleHandle)
  }
}

/** Photos déjà demandées par `warmSitePhoto` pendant la vie de l'onglet. */
const warmedPhotos = new Set<string>()

/**
 * Télécharge en tâche de fond une photo éditoriale qui n'est pas encore
 * affichée (la suivante d'un bandeau qui alterne, celle d'un autre onglet), pour
 * que son fondu enchaîné ne parte pas sur une image encore en vol.
 *
 * Le piège évité ici : précharger `path` tel quel (`new Image().src = path`)
 * télécharge l'ORIGINAL, alors que `<Chapter>` affiche une variante choisie dans
 * son `srcset` (`/photos/w768/…` sur un téléphone). Le préchargement ne
 * resservait donc jamais, et la photo était téléchargée DEUX fois : 84 ko
 * d'original pour rien sur /club, 186 ko sur /athletes, au moment même où la
 * photo du bandeau se chargeait. On pose ici le même `srcset` et les mêmes
 * `sizes` que le rendu : le navigateur fait le même choix, au fichier près.
 *
 * Mêmes `sizes` que `<Chapter>`, c'est-à-dire ceux par défaut de
 * `sitePhotoProps` : à ne pas utiliser pour une photo rendue avec d'autres.
 * À appeler depuis `afterPageLoad`, et rien du tout sur une connexion économe.
 */
export function warmSitePhoto(path: string): void {
  if (warmedPhotos.has(path) || isFrugal()) return
  warmedPhotos.add(path)
  const { src, srcSet, sizes } = sitePhotoProps(path)
  const img = new Image()
  img.fetchPriority = 'low'
  img.decoding = 'async'
  if (sizes) img.sizes = sizes
  if (srcSet) img.srcset = srcSet
  img.src = src
}
