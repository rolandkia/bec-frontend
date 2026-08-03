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
 */

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
function isFrugal(): boolean {
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

  let idleHandle: number | undefined
  let timer: number | undefined

  const warm = () => {
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
    ).requestIdleCallback
    const run = () => {
      for (const path of ['/club', '/athletes', '/competitions', '/mag', '/rejoindre']) {
        prefetchPath(path)
      }
    }
    if (ric) idleHandle = ric(run, { timeout: 3000 })
    else timer = window.setTimeout(run, 300)
  }

  // `load` est déjà passé si l'utilisateur arrive par une navigation interne.
  if (document.readyState === 'complete') timer = window.setTimeout(warm, 1200)
  else window.addEventListener('load', () => (timer = window.setTimeout(warm, 1200)), { once: true })

  return () => {
    if (timer) clearTimeout(timer)
    const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
    if (idleHandle && cic) cic(idleHandle)
  }
}
