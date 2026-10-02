import { useRef, type CSSProperties } from 'react'
import {
  COVER_ZOOM_MAX,
  COVER_ZOOM_MIN,
  buildCoverPosition,
  coverImageStyle,
  coverObjectPosition,
  coverThumbStyle,
  coverZoom,
  type CoverPosition,
} from '../../api/types'
import { cldImage } from '../../lib/cloudinary'

/** Parse une valeur `object-position` ("x% y%") en pourcentages numériques. */
function parsePosition(value: CoverPosition): { x: number; y: number } {
  const css = coverObjectPosition(value)
  const parts = css.replace(/left|center|right|top|bottom/g, (kw) =>
    kw === 'left' || kw === 'top' ? '0%' : kw === 'right' || kw === 'bottom' ? '100%' : '50%',
  )
  const [rawX, rawY] = parts.split(/\s+/)
  const x = parseFloat(rawX)
  const y = parseFloat(rawY ?? rawX)
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  }
}

/**
 * Les cadres où la couverture apparaît RÉELLEMENT, avec leur ratio et leur
 * style — les mêmes que les composants qui les affichent :
 *   - BlogDetailPage : bandeau `aspect-[16/7]` dès sm, `aspect-[16/10]` dessous,
 *     avec le zoom (`coverImageStyle`) ;
 *   - BlogCard / FeaturedCard : `aspect-[4/3]`, et la vignette carrée des
 *     rangées mobiles, SANS le zoom (`coverThumbStyle`, cf. son commentaire).
 */
const FRAMES: { label: string; ratio: string; style: (v: CoverPosition) => CSSProperties }[] = [
  { label: 'Article · ordinateur', ratio: '16 / 7', style: coverImageStyle },
  { label: 'Article · téléphone', ratio: '16 / 10', style: coverImageStyle },
  { label: 'Carte du Mag', ratio: '4 / 3', style: coverThumbStyle },
  { label: 'Vignette', ratio: '1 / 1', style: coverThumbStyle },
]

/** Pas des flèches du clavier (%), et avec Maj. */
const KEY_STEP = 2
const KEY_STEP_FAST = 10

/**
 * Cadrage de la couverture : on désigne le SUJET sur la photo entière, et on
 * voit tout de suite ce que chaque format en garde.
 *
 * L'ancien sélecteur cadrait dans un aperçu 5:2 où la photo, plus étroite que
 * le cadre, en remplissait toute la largeur : bouger le point à gauche ou à
 * droite n'y changeait RIEN à l'écran (seul le haut/bas se voyait), alors que
 * c'est précisément ce qui décide du recadrage des cartes 4:3 et des vignettes
 * carrées. Le point était donc enregistré en X et en Y, mais réglé à l'aveugle
 * sur un des deux axes. Ici la photo est montrée en entier et les quatre cadres
 * réels suivent le point.
 *
 * La valeur reste au format historique (`"x% y%"` + zoom optionnel, cf.
 * `CoverPosition`) : rien à migrer, et les articles existants se rouvrent tels
 * qu'ils sont publiés.
 */
export function CoverFocalPicker({
  src,
  value,
  onChange,
}: {
  src: string
  value: CoverPosition
  onChange: (value: string) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const { x, y } = parsePosition(value)
  const zoom = coverZoom(value)
  const preview = cldImage(src, 1200)

  function setPoint(px: number, py: number) {
    const cx = Math.round(Math.min(100, Math.max(0, px)))
    const cy = Math.round(Math.min(100, Math.max(0, py)))
    onChange(buildCoverPosition(`${cx}% ${cy}%`, zoom))
  }

  function updateFromEvent(clientX: number, clientY: number) {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    setPoint(((clientX - rect.left) / rect.width) * 100, ((clientY - rect.top) / rect.height) * 100)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
    updateFromEvent(event.clientX, event.clientY)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    updateFromEvent(event.clientX, event.clientY)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? KEY_STEP_FAST : KEY_STEP
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    setPoint(x + move[0], y + move[1])
  }

  function setZoom(next: number) {
    const clamped = Math.min(COVER_ZOOM_MAX, Math.max(COVER_ZOOM_MIN, Math.round(next * 100) / 100))
    onChange(buildCoverPosition(`${x}% ${y}%`, clamped))
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <p className="mb-2 text-sm text-[color:var(--color-muted)]">
          Touchez le <strong className="text-[color:var(--color-fg)]">sujet</strong> de la photo
          (ou glissez le point) : chaque format le garde dans son cadre.
        </p>
        {/* Photo ENTIÈRE : le cadre colle à l'image (`w-fit`), donc une
            position dans le cadre est une position dans la photo. */}
        <div
          ref={boxRef}
          role="group"
          tabIndex={0}
          aria-label={`Point de cadrage : ${x} % depuis la gauche, ${y} % depuis le haut. Flèches pour le déplacer.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onKeyDown={onKeyDown}
          className="relative mx-auto w-fit max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-club-primary"
        >
          <img
            src={preview}
            alt="Photo de couverture entière"
            draggable={false}
            className="block h-auto max-h-80 w-auto max-w-full"
          />
          {/* Repère : réticule pleine hauteur/largeur + point. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-white/70 mix-blend-difference"
            style={{ left: `${x}%` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px bg-white/70 mix-blend-difference"
            style={{ top: `${y}%` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-club-primary shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.5)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor="cover-zoom" className="text-sm font-medium text-[color:var(--color-fg)]">
            Zoom du bandeau
          </label>
          <input
            id="cover-zoom"
            type="range"
            min={COVER_ZOOM_MIN}
            max={COVER_ZOOM_MAX}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="min-w-32 flex-1 accent-[color:var(--color-club-primary)]"
          />
          <span className="w-10 text-right text-sm tabular-nums text-[color:var(--color-muted)]">
            {zoom.toFixed(1)}×
          </span>
          {(zoom !== COVER_ZOOM_MIN || x !== 50 || y !== 50) && (
            <button
              type="button"
              className="text-sm font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:underline"
              onClick={() => onChange('50% 50%')}
            >
              Recentrer
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Le zoom ne s'applique qu'à l'en-tête de l'article : les cartes gardent la photo entière,
          centrée sur le point.
        </p>
      </div>

      <div className="grid grid-cols-2 content-start gap-3">
        {FRAMES.map((frame) => (
          <figure key={frame.label} className={frame.ratio === '1 / 1' ? 'max-w-28' : ''}>
            <div
              className="overflow-hidden rounded-md bg-[color:var(--color-surface-2)] ring-1 ring-[color:var(--color-line)]"
              style={{ aspectRatio: frame.ratio }}
            >
              <img
                src={preview}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={frame.style(value)}
              />
            </div>
            <figcaption className="mt-1 text-xs text-[color:var(--color-muted)]">{frame.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
