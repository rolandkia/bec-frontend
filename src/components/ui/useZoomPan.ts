import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   ZOOM ET DÉPLACEMENT D'UNE IMAGE (visionneuse)

   Une seule transformation `translate(x, y) scale(z)` sur l'image, origine au
   centre : le navigateur la compose sur le GPU, aucune remise en page pendant
   le geste. Tous les gestes passent par `zoomAt`, qui garde FIXE le point
   désigné (curseur, milieu des deux doigts) : c'est ce qui donne l'impression
   d'entrer dans la photo à l'endroit visé plutôt qu'au centre.

   Gestes pris en charge, sans dépendance :
     - molette (et pincement du pavé tactile, qui arrive en `wheel` + ctrlKey) ;
     - pincement à deux doigts ;
     - double appui au doigt, clic à la souris : 1× ↔ DOUBLE_TAP_ZOOM ;
     - glisser pour se déplacer une fois zoomé.
   À 1×, un balayage horizontal au doigt reste la navigation de la visionneuse
   (`onSwipe`) : le zoom ne le capte qu'une fois l'image agrandie.

   Le déplacement est BORNÉ : l'image ne peut pas quitter la scène, au pire un
   de ses bords touche le bord opposé. Sans borne, un glisser trop appuyé
   envoyait la photo hors champ et il fallait dézoomer pour la retrouver.
   ═══════════════════════════════════════════════════════════════════════════ */

export const ZOOM_MAX = 5
const DOUBLE_TAP_ZOOM = 2.5
/** Facteur d'un cran des boutons et du clavier. */
const STEP = 1.6
/** Fenêtre d'un double appui (ms) et tolérance de position (px). */
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_SLOP = 30
/** Au-delà de ce déplacement, un appui est un glisser : pas de clic ensuite. */
const DRAG_SLOP = 6
/** Seuil du balayage de navigation (px), repris de la visionneuse d'origine. */
const SWIPE_MIN = 50

type View = { z: number; x: number; y: number }
const IDENTITY: View = { z: 1, x: 0, y: 0 }

export function useZoomPan({
  enabled,
  resetKey,
  onSwipe,
}: {
  /** Faux pour une vidéo : aucun geste n'est capté, la lecture garde la main. */
  enabled: boolean
  /** Toute nouvelle valeur (changement de photo) ramène à 1×. */
  resetKey: unknown
  onSwipe: (dir: 'prev' | 'next') => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [view, setView] = useState<View>(IDENTITY)
  /** Vrai pendant un geste : la transition CSS est coupée, l'image suit le doigt. */
  const [live, setLive] = useState(false)
  const viewRef = useRef(view)
  viewRef.current = view

  // Changement de photo : on repart à 1×. Ajustement PENDANT le rendu (et non
  // dans un effet) : la nouvelle photo ne doit pas apparaître, même une image,
  // au zoom et au décalage de la précédente.
  const [seenKey, setSeenKey] = useState(resetKey)
  if (seenKey !== resetKey) {
    setSeenKey(resetKey)
    setView(IDENTITY)
  }

  /** Borne le décalage pour que l'image ne quitte jamais la scène. */
  const clamp = useCallback((v: View): View => {
    const img = imgRef.current
    const stage = stageRef.current
    if (!img || !stage || v.z <= 1) return IDENTITY
    // `offsetWidth` : taille de mise en page, NON transformée (l'image à 1×).
    const maxX = Math.max(0, (img.offsetWidth * v.z - stage.clientWidth) / 2)
    const maxY = Math.max(0, (img.offsetHeight * v.z - stage.clientHeight) / 2)
    return {
      z: v.z,
      x: Math.min(maxX, Math.max(-maxX, v.x)),
      y: Math.min(maxY, Math.max(-maxY, v.y)),
    }
  }, [])

  /** Centre de l'image à 1× (le `translate` courant retiré), en coordonnées écran. */
  const baseCenter = useCallback(() => {
    const r = imgRef.current?.getBoundingClientRect()
    const v = viewRef.current
    if (!r) return { cx: 0, cy: 0 }
    return { cx: r.left + r.width / 2 - v.x, cy: r.top + r.height / 2 - v.y }
  }, [])

  /** Zoome à `z` en gardant fixe le point écran (px, py), à partir de `from`. */
  const zoomAt = useCallback(
    (z: number, px: number, py: number, from: View = viewRef.current) => {
      const next = Math.min(ZOOM_MAX, Math.max(1, z))
      const { cx, cy } = baseCenter()
      const k = next / from.z
      setView(
        clamp({
          z: next,
          x: px - cx - (px - cx - from.x) * k,
          y: py - cy - (py - cy - from.y) * k,
        }),
      )
    },
    [baseCenter, clamp],
  )

  /** Zoom au centre de la scène (boutons, clavier). */
  const zoomBy = useCallback(
    (factor: number) => {
      const r = stageRef.current?.getBoundingClientRect()
      if (!r) return
      zoomAt(viewRef.current.z * factor, r.left + r.width / 2, r.top + r.height / 2)
    },
    [zoomAt],
  )
  const zoomIn = useCallback(() => zoomBy(STEP), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(1 / STEP), [zoomBy])
  const reset = useCallback(() => setView(IDENTITY), [])

  // Molette : écouteur NON passif, posé à la main — celui de React est passif,
  // donc incapable d'empêcher le défilement. Un cran de souris vaut ~100 de
  // `deltaY`, un pas de pincement de pavé tactile ~1 à 5 : deux sensibilités.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !enabled) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
      zoomAt(viewRef.current.z * k, e.clientX, e.clientY)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [enabled, zoomAt])

  // Redimensionnement (rotation du téléphone, plein écran) : le décalage borné
  // pour l'ancienne taille peut sortir de la nouvelle.
  useEffect(() => {
    function onResize() {
      setView((v) => clamp(v))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  /* ─── Pointeurs : glisser, pincer, double appui, balayage ─────────────────── */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    startView: View
    // glisser à un pointeur
    startX: number
    startY: number
    // pincement
    startDist: number
    startMidX: number
    startMidY: number
    moved: boolean
    pinched: boolean
  } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  /** Lu par l'appelant pour annuler le clic qui suit un glisser. */
  const dragged = useRef(false)

  function startGesture() {
    const pts = [...pointers.current.values()]
    const g = {
      startView: viewRef.current,
      startX: pts[0].x,
      startY: pts[0].y,
      startDist: 0,
      startMidX: 0,
      startMidY: 0,
      moved: gesture.current?.moved ?? false,
      pinched: gesture.current?.pinched ?? false,
    }
    if (pts.length >= 2) {
      g.startDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1
      g.startMidX = (pts[0].x + pts[1].x) / 2
      g.startMidY = (pts[0].y + pts[1].y) / 2
      g.pinched = true
    }
    gesture.current = g
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (!enabled) return
    // Un clic droit ou molette ne démarre rien.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      gesture.current = null
      dragged.current = false
    }
    startGesture()
    setLive(true)
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!enabled || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]

    if (pts.length >= 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      const z = Math.min(ZOOM_MAX, Math.max(1, g.startView.z * (dist / g.startDist)))
      // Le point sous les doigts au départ du pincement reste sous les doigts :
      // zoom autour du milieu de départ, puis translation du milieu.
      const { cx, cy } = baseCenter()
      const k = z / g.startView.z
      setView(
        clamp({
          z,
          x: g.startMidX - cx - (g.startMidX - cx - g.startView.x) * k + (midX - g.startMidX),
          y: g.startMidY - cy - (g.startMidY - cy - g.startView.y) * k + (midY - g.startMidY),
        }),
      )
      g.moved = true
      dragged.current = true
      return
    }

    const dx = pts[0].x - g.startX
    const dy = pts[0].y - g.startY
    if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) {
      g.moved = true
      dragged.current = true
    }
    // À 1×, rien à déplacer : le geste est un balayage, traité au relâcher.
    if (g.startView.z > 1) {
      setView(clamp({ z: g.startView.z, x: g.startView.x + dx, y: g.startView.y + dy }))
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (!enabled || !pointers.current.has(e.pointerId)) return
    const g = gesture.current
    const point = pointers.current.get(e.pointerId)!
    pointers.current.delete(e.pointerId)

    if (pointers.current.size > 0) {
      // Un doigt levé sur deux : le restant reprend un glisser depuis l'état
      // courant, sans saut.
      startGesture()
      return
    }
    setLive(false)
    gesture.current = null
    if (!g) return

    // Pincement relâché presque à 1× : on se recale exactement à 1×.
    if (viewRef.current.z < 1.05) setView(IDENTITY)

    const isTouch = e.pointerType !== 'mouse'
    const dx = point.x - g.startX

    // Balayage de navigation : à 1×, au doigt, sans pincement.
    if (isTouch && !g.pinched && g.startView.z <= 1 && Math.abs(dx) > SWIPE_MIN) {
      onSwipe(dx < 0 ? 'next' : 'prev')
      return
    }
    if (g.moved || g.pinched) return

    if (isTouch) {
      // Double appui : bascule 1× ↔ DOUBLE_TAP_ZOOM au point touché.
      const prev = lastTap.current
      const now = performance.now()
      if (
        prev &&
        now - prev.t < DOUBLE_TAP_MS &&
        Math.hypot(point.x - prev.x, point.y - prev.y) < DOUBLE_TAP_SLOP
      ) {
        lastTap.current = null
        if (viewRef.current.z > 1) setView(IDENTITY)
        else zoomAt(DOUBLE_TAP_ZOOM, point.x, point.y)
      } else {
        lastTap.current = { t: now, x: point.x, y: point.y }
      }
      return
    }
    // Souris : un clic simple bascule (zoom au point / retour à 1×).
    if (viewRef.current.z > 1) setView(IDENTITY)
    else zoomAt(DOUBLE_TAP_ZOOM, point.x, point.y)
  }

  function onPointerCancel(e: ReactPointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) {
      gesture.current = null
      setLive(false)
    }
  }

  return {
    stageRef,
    imgRef,
    zoom: view.z,
    zoomed: view.z > 1,
    zoomIn,
    zoomOut,
    reset,
    dragged,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    style: {
      transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.z})`,
      transition: live ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: !enabled ? undefined : view.z > 1 ? (live ? 'grabbing' : 'grab') : 'zoom-in',
      // `none` : le navigateur ne doit ni défiler ni zoomer la PAGE pendant un
      // pincement — c'est l'image qui zoome.
      touchAction: enabled ? 'none' : 'pan-y',
    } as const,
  }
}
