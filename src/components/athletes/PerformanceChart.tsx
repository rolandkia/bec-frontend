import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ResultatOut } from '../../api/types'

type Row = {
  date: string
  t: number
  valeur: number
  raw: string | null
  tour: string | null
  best?: number
}

export function PerformanceChart({ resultats }: { resultats: ResultatOut[] }) {
  const points: Row[] = resultats
    .filter((r) => r.date && r.performance_valeur != null)
    .map((r) => ({
      date: r.date as string,
      t: new Date(r.date as string).getTime(),
      valeur: r.performance_valeur as number,
      raw: r.raw_performance,
      tour: r.tour,
    }))
    .sort((a, b) => a.t - b.t)

  const isTemps = resultats.find((r) => r.performance_metric)?.performance_metric === 'temps'

  // Plusieurs résultats possibles le même jour (ex. série + finale) : on garde
  // tous les points, et la courbe passe par la meilleure perf de chaque date.
  const byDate = new Map<number, Row[]>()
  for (const p of points) {
    const group = byDate.get(p.t)
    if (group) group.push(p)
    else byDate.set(p.t, [p])
  }
  for (const group of byDate.values()) {
    const best = group.reduce((a, b) =>
      (isTemps ? b.valeur < a.valeur : b.valeur > a.valeur) ? b : a,
    )
    best.best = best.valeur
  }

  const hasSameDayResults = Array.from(byDate.values()).some((g) => g.length > 1)

  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-slate-500 dark:text-slate-400">
        Pas assez de données pour tracer une courbe d'évolution.
      </p>
    )
  }

  return (
    <div className="card p-4">
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {isTemps
          ? 'Temps (en secondes) — la courbe descend quand l’athlète progresse (temps plus court).'
          : 'Distance / points — la courbe monte quand l’athlète progresse (valeur plus élevée).'}
        {hasSameDayResults &&
          ' Plusieurs résultats le même jour (séries, finales…) : la courbe suit la meilleure performance.'}
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="perfLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-club-primary)" />
                <stop offset="100%" stopColor="var(--color-club-accent)" />
              </linearGradient>
              <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-club-primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-club-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t) =>
                new Date(t).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
              }
              tick={{ fontSize: 12 }}
              tickMargin={8}
              stroke="currentColor"
              className="text-slate-400"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-slate-400"
              width={44}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-club-accent)', strokeWidth: 1 }}
              content={({ active, label }) => {
                if (!active || label == null) return null
                const group = byDate.get(Number(label))
                if (!group || group.length === 0) return null
                return (
                  <div
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px solid var(--tooltip-border)',
                      backgroundColor: 'var(--tooltip-bg)',
                      color: 'var(--tooltip-text)',
                      fontSize: '0.8rem',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      padding: '0.5rem 0.75rem',
                    }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: group.length > 1 ? '0.25rem' : 0 }}>
                      {new Date(Number(label)).toLocaleDateString('fr-FR')}
                    </p>
                    {group.map((row, i) => (
                      <p key={i} style={{ fontWeight: row.best != null && group.length > 1 ? 600 : 400 }}>
                        {row.raw ?? row.valeur}
                        {row.tour ? ` — ${row.tour}` : ''}
                        {row.best != null && group.length > 1 ? ' (meilleure)' : ''}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="best"
              connectNulls
              stroke="none"
              fill="url(#perfFill)"
              isAnimationActive
            />
            <Line
              type="monotone"
              dataKey="best"
              connectNulls
              stroke="url(#perfLine)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: 'var(--color-club-accent)', stroke: 'white', strokeWidth: 2 }}
            />
            <Scatter
              dataKey="valeur"
              fill="var(--color-club-primary)"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
