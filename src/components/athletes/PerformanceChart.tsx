import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ResultatOut } from '../../api/types'

export function PerformanceChart({ resultats }: { resultats: ResultatOut[] }) {
  const points = resultats
    .filter((r) => r.date && r.performance_valeur != null)
    .map((r) => ({
      date: r.date as string,
      valeur: r.performance_valeur as number,
      raw: r.raw_performance,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const isTemps = resultats.find((r) => r.performance_metric)?.performance_metric === 'temps'

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
              dataKey="date"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
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
              labelFormatter={(d) => new Date(d as string).toLocaleDateString('fr-FR')}
              formatter={(_value, _name, item) => [item.payload.raw ?? item.payload.valeur, 'Performance']}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid rgba(148,163,184,0.3)',
                fontSize: '0.8rem',
              }}
            />
            <Area
              type="monotone"
              dataKey="valeur"
              stroke="none"
              fill="url(#perfFill)"
              isAnimationActive
            />
            <Line
              type="monotone"
              dataKey="valeur"
              stroke="url(#perfLine)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--color-club-primary)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--color-club-accent)', stroke: 'white', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
