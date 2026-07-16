import { useRef } from 'react'
import {
  COVER_ZOOM_MAX,
  COVER_ZOOM_MIN,
  buildCoverPosition,
  coverImageStyle,
  coverObjectPosition,
  coverZoom,
  type CoverPosition,
} from '../../api/types'

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

const ZOOM_STEP = 0.1

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
  const imgStyle = coverImageStyle(value)

  function updateFromEvent(clientX: number, clientY: number) {
    const box = boxRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    const px = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    const py = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
    onChange(buildCoverPosition(`${Math.round(px)}% ${Math.round(py)}%`, zoom))
  }

  function onPointerDown(event: React.PointerEvent) {
    event.preventDefault()
    updateFromEvent(event.clientX, event.clientY)

    function onMove(e: PointerEvent) {
      updateFromEvent(e.clientX, e.clientY)
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function setZoom(next: number) {
    const clamped = Math.min(COVER_ZOOM_MAX, Math.max(COVER_ZOOM_MIN, Math.round(next * 100) / 100))
    onChange(buildCoverPosition(`${x}% ${y}%`, clamped))
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
        Cadrage : cliquez ou glissez pour choisir la zone visible (aperçu du rendu réel).
      </p>
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        className="relative aspect-[5/2] w-full max-w-xl cursor-crosshair overflow-hidden rounded-lg border border-slate-300 bg-slate-100 select-none dark:border-slate-700 dark:bg-slate-800"
      >
        <img
          src={src}
          alt="Aperçu du cadrage de la couverture"
          draggable={false}
          className="h-full w-full object-cover"
          style={imgStyle}
        />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-club-primary shadow-md"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Zoom</span>
        <button
          type="button"
          title="Dézoomer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-lg leading-none text-slate-700 transition hover:border-club-primary disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          disabled={zoom <= COVER_ZOOM_MIN}
          onClick={() => setZoom(zoom - ZOOM_STEP)}
        >
          −
        </button>
        <span className="w-12 text-center text-sm tabular-nums text-slate-600 dark:text-slate-300">
          {zoom.toFixed(1)}×
        </span>
        <button
          type="button"
          title="Zoomer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-lg leading-none text-slate-700 transition hover:border-club-primary disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          disabled={zoom >= COVER_ZOOM_MAX}
          onClick={() => setZoom(zoom + ZOOM_STEP)}
        >
          +
        </button>
        {zoom !== COVER_ZOOM_MIN && (
          <button
            type="button"
            className="ml-1 text-sm text-slate-500 hover:underline dark:text-slate-400"
            onClick={() => setZoom(COVER_ZOOM_MIN)}
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
