import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cldImage, cldPoster, cldVideo } from '../../lib/cloudinary'
import { isFrugal } from '../../lib/prefetch'

export interface LightboxItem {
  url: string
  type: 'image' | 'video'
  id?: string | number
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRÉCHARGEMENT DES VOISINES

   Le problème : la visionneuse ne demandait QUE la photo affichée. Chaque appui
   sur « suivant » repartait donc d'une requête froide vers Cloudinary — et
   comme le public du club est en France pour un serveur aux États-Unis, feuilleter
   un album ou les photos d'un article revenait à attendre une à deux secondes
   par image, à chaque image.

   La correction tient en trois règles.

   1. ON PRÉCHARGE APRÈS, PAS PENDANT. Les voisines ne partent qu'une fois la
      photo AFFICHÉE arrivée (`onLoad`). Le site est servi sur IP nue, donc en
      HTTP/1.1 sans multiplexage : le navigateur ne tient que six connexions vers
      une origine, et chacune paie sa propre poignée de main. Lancer les voisines
      « en même temps » les ferait concourir avec la seule image que
      l'utilisateur regarde — on gagnerait sur la suivante en perdant sur la
      courante, ce qui est exactement le mauvais échange. Quand la photo
      courante est déjà en cache (cas normal dès la deuxième), `onLoad` est
      immédiat et la chaîne s'enclenche sans délai perceptible.

   2. MÊME URL QUE LE RENDU, AU CARACTÈRE PRÈS. Cloudinary indexe ses dérivés par
      chaîne de transformation et le cache HTTP par URL exacte : une largeur ou
      une option qui diverge, et le navigateur télécharge DEUX fichiers au lieu
      d'un — le préchargement coûterait alors de la bande passante sans jamais
      resservir. D'où `mediaSrc()` ci-dessous, appelé par le préchargement ET par
      le rendu, et `VIEW_WIDTH` en source unique.

   3. ON S'EFFACE DEVANT L'UTILISATEUR. `fetchPriority: 'low'` pour que la photo
      visible et les requêtes de la page passent devant, et rien du tout si le
      navigateur annonce un mode économie de données ou un lien 2G.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Largeur de livraison de la visionneuse — SOURCE UNIQUE (cf. règle 2). */
const VIEW_WIDTH = 1920

/**
 * Nombre de voisines préchargées DE CHAQUE CÔTÉ.
 *
 * Un seul cran : c'est le rapport gain/coût le plus favorable. La suivante
 * couvre le geste de très loin le plus fréquent (feuilleter vers l'avant), la
 * précédente couvre le retour en arrière immédiat, et on s'arrête là — à deux
 * crans on mobilise quatre des six connexions disponibles pour des photos que le
 * visiteur ne verra le plus souvent jamais, sur des forfaits mobiles.
 */
const PRELOAD_RADIUS = 1

/** Ce que la visionneuse affiche pour un élément : l'image, ou l'affiche de la
 *  vidéo. Utilisé par le rendu ET par le préchargement (cf. règle 2). */
function mediaSrc(item: LightboxItem): string {
  return cldImage(item.url, VIEW_WIDTH)
}

/**
 * Ce qu'on précharge pour un voisin. Pour une vidéo c'est son AFFICHE et jamais
 * le fichier vidéo : un mp4 de plusieurs mégaoctets tirerait à lui seul plus de
 * bande passante que tout le reste de l'album, pour un élément que le visiteur
 * n'atteindra peut-être pas — et `<video preload="metadata">` fait déjà le
 * nécessaire au moment où il y arrive. `null` ⇒ rien à précharger.
 */
function preloadTarget(item: LightboxItem | undefined): string | null {
  if (!item) return null
  return item.type === 'video' ? cldPoster(item.url) : mediaSrc(item)
}

/** URLs déjà demandées pendant la vie de l'onglet. Sans ce garde-fou, chaque
 *  aller-retour entre deux photos voisines relancerait un `new Image()` pour des
 *  fichiers que le navigateur a déjà — inoffensif mais inutile, et ça fausse la
 *  lecture de l'onglet réseau quand on vient vérifier le comportement. */
const warmed = new Set<string>()

function warm(url: string) {
  if (warmed.has(url)) return
  warmed.add(url)
  const img = new Image()
  img.fetchPriority = 'low'
  img.decoding = 'async'
  img.src = url
}

/** Visionneuse plein écran générique, réutilisée par la lecture de blog et la
 *  galerie. Contenu-agnostique : `renderCaption` (optionnel) permet à l'appelant
 *  d'afficher une légende (description, date, lieu, athlètes tagués…). */
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  renderCaption,
}: {
  items: LightboxItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  renderCaption?: (item: LightboxItem, index: number) => ReactNode
}) {
  const count = items.length
  const current = items[index]

  /* ─── Armement du préchargement (cf. le bloc PRÉCHARGEMENT plus haut) ─────
     `loadedKey` retient l'URL de l'élément qu'on a fini de charger. La comparer
     à celle de l'élément courant donne un « c'est arrivé » qui repasse à faux
     AU RENDU MÊME où l'index change — là où un `useEffect` de remise à zéro
     n'agirait qu'après coup, laissant les voisines partir en concurrence de la
     photo qu'on vient de demander, soit précisément ce qu'on veut éviter. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = current
    ? current.type === 'video'
      ? cldVideo(current.url)
      : mediaSrc(current)
    : null
  const ready = currentKey !== null && loadedKey === currentKey

  // Voisines, dans l'ordre de probabilité : la suivante d'abord, puis la
  // précédente. Les listes bouclent (`% count`), comme la navigation.
  const neighbours: string[] = []
  if (count > 1) {
    for (let step = 1; step <= PRELOAD_RADIUS; step++) {
      for (const i of [(index + step) % count, (index - step + count) % count]) {
        const target = preloadTarget(items[i])
        if (target && target !== currentKey && !neighbours.includes(target)) {
          neighbours.push(target)
        }
      }
    }
  }
  /* Dépendance d'effet STABLE. `items` est refabriqué à chaque rendu par
     plusieurs appelants (l'accueil et la galerie le construisent en ligne avec
     un `.map()`), donc le tableau lui-même ne peut pas servir de dépendance :
     il rejouerait l'effet à chaque rendu. La liste d'URL, elle, ne change que
     quand les voisines changent vraiment. Séparateur `\n` : impossible dans
     une URL, donc la découpe est sûre. */
  const neighbourKey = neighbours.join('\n')

  useEffect(() => {
    if (!ready) return
    /* L'élément affiché rejoint le registre : il est arrivé par le `<img>` du
       rendu, pas par `warm()`, donc sans cette ligne il serait re-préchargé dès
       qu'on revient dessus depuis un voisin. Le navigateur l'a en cache, la
       requête n'était donc pas refaite — mais on construisait un `Image()` pour
       rien à chaque aller-retour entre deux photos. */
    if (currentKey) warmed.add(currentKey)
    // Économie de données ou lien 2G : on ne télécharge que ce qui est regardé.
    if (!neighbourKey || isFrugal()) return
    for (const url of neighbourKey.split('\n')) warm(url)
  }, [ready, currentKey, neighbourKey])

  const goPrev = useCallback(() => {
    if (count > 1) onIndexChange((index - 1 + count) % count)
  }, [count, index, onIndexChange])

  const goNext = useCallback(() => {
    if (count > 1) onIndexChange((index + 1) % count)
  }, [count, index, onIndexChange])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    // Empêche le défilement de la page derrière l'overlay.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, goPrev, goNext])

  // Balayage horizontal — geste attendu sur une visionneuse mobile. Pointer
  // events, aucune dépendance ; seuil de 50 px pour ne pas confondre avec un
  // tap, et on ignore la souris pour ne pas gêner un cliquer-glisser.
  const swipeStartX = useRef<number | null>(null)

  function onPointerDown(e: ReactPointerEvent) {
    // Jamais de balayage démarré SUR la vidéo : tirer la barre de progression de
    // plus de 50 px déclenchait un `goNext()`, rendant le seek inutilisable au
    // doigt. Le balayage reste actif sur la zone sombre et via les flèches basses.
    if ((e.target as HTMLElement).closest('video')) {
      swipeStartX.current = null
      return
    }
    swipeStartX.current = e.pointerType === 'mouse' ? null : e.clientX
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (swipeStartX.current === null) return
    const dx = e.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)()
  }

  if (!current) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        type="button"
        aria-label="Fermer"
        className="tap absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        onClick={onClose}
      >
        ×
      </button>

      {/* Zone média (le clic sur le média ne ferme pas) */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
        {count > 1 && (
          // Flèches latérales réservées à sm : à 390 px, `left-2`/`right-2` les
          // posait SUR la photo et masquait le sujet (cf. barre basse).
          <button
            type="button"
            aria-label="Précédent"
            className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:flex"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            ‹
          </button>
        )}

        <div
          className="flex max-h-full max-w-full flex-col items-center"
          style={{ touchAction: 'pan-y' }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {current.type === 'video' ? (
            <video
              key={current.url}
              src={cldVideo(current.url)}
              poster={cldPoster(current.url) ?? undefined}
              controls
              // `autoPlay` sans `muted` est simplement ignoré par iOS (l'utilisateur
              // appuie sur lecture) ; ajouter `muted` couperait le son d'une vidéo
              // ouverte volontairement. `playsInline` est ce qui fait jouer la
              // vidéo DANS l'overlay au lieu de partir dans le lecteur iOS.
              autoPlay
              playsInline
              preload="metadata"
              // Arme le préchargement des voisines. Une vidéo n'a pas
              // d'événement « tout est là » (elle se diffuse en continu) :
              // l'arrivée des métadonnées est le moment où le lecteur est
              // utilisable, donc le bon moment pour laisser partir le reste.
              onLoadedMetadata={() => setLoadedKey(cldVideo(current.url))}
              onError={() => setLoadedKey(cldVideo(current.url))}
              className="max-h-[72dvh] max-w-full rounded-lg bg-black"
            />
          ) : (
            <img
              key={current.url}
              // `mediaSrc` et non un `cldImage(..., 1920)` écrit ici : c'est
              // l'appel que fait aussi le préchargement, et les deux DOIVENT
              // produire la même chaîne (cf. règle 2).
              src={mediaSrc(current)}
              alt=""
              // `onError` arme aussi : une URL morte ne doit pas bloquer
              // définitivement le préchargement du reste de l'album.
              onLoad={() => setLoadedKey(mediaSrc(current))}
              onError={() => setLoadedKey(mediaSrc(current))}
              className="max-h-[72dvh] max-w-full rounded-lg object-contain"
            />
          )}
          {renderCaption && (
            <div className="mt-3 max-w-2xl text-center text-sm text-white/85">
              {renderCaption(current, index)}
            </div>
          )}
        </div>

        {count > 1 && (
          <button
            type="button"
            aria-label="Suivant"
            className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:flex"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
          >
            ›
          </button>
        )}
      </div>

      {count > 1 && (
        // Barre basse : sur mobile elle porte les flèches (hors de la photo) de
        // part et d'autre du compteur. Dès sm, seul le compteur reste.
        <div
          className="flex items-center justify-center gap-6 pb-safe pt-2 sm:pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Précédent"
            className="tap flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:hidden"
            onClick={goPrev}
          >
            ‹
          </button>
          <p className="tabular text-sm text-white/60">
            {index + 1} / {count}
          </p>
          <button
            type="button"
            aria-label="Suivant"
            className="tap flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20 sm:hidden"
            onClick={goNext}
          >
            ›
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
