import type { ResultatOut } from '../../api/types'

export function PerformanceTable({ resultats }: { resultats: ResultatOut[] }) {
  if (resultats.length === 0) {
    return (
      <p className="py-6 text-center text-slate-500 dark:text-slate-400">
        Aucun résultat pour cette sélection.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Épreuve</th>
            <th className="px-4 py-2">Performance</th>
            <th className="px-4 py-2">Vent</th>
            <th className="px-4 py-2">Lieu</th>
            <th className="px-4 py-2">Place</th>
            <th className="px-4 py-2">Niveau</th>
          </tr>
        </thead>
        <tbody>
          {resultats.map((r) => (
            <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2">
                {r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-4 py-2">{r.epreuve}</td>
              <td className="px-4 py-2 font-medium">
                {r.raw_performance ?? r.performance_valeur ?? '—'}
                {r.performance_dq && (
                  <span className="ml-1 text-red-500">({r.performance_dq})</span>
                )}
              </td>
              <td className="px-4 py-2">{r.vent ?? '—'}</td>
              <td className="px-4 py-2">{r.lieu ?? '—'}</td>
              <td className="px-4 py-2">{r.place ?? '—'}</td>
              <td className="px-4 py-2">{r.niveau ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
