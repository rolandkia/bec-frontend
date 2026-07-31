import { useEffect, useState } from 'react'
import type { ResultatOut } from '../../api/types'

const PAGE_SIZE = 20

export function PerformanceTable({ resultats }: { resultats: ResultatOut[] }) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [resultats])

  if (resultats.length === 0) {
    return (
      <p className="py-6 text-center text-[color:var(--color-muted)]">
        Aucun résultat pour cette sélection.
      </p>
    )
  }

  const pageCount = Math.ceil(resultats.length / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount)
  const pageItems = resultats.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div>
      {/* Liste empilée sur mobile : plus lisible qu'un tableau écrasé/à faire défiler. */}
      <ul className="divide-y divide-[color:var(--color-line)] rounded-md border border-[color:var(--color-line)] md:hidden">
        {pageItems.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{r.epreuve}</span>
              <span className="font-semibold text-[color:var(--color-fg)]">
                {r.raw_performance ?? r.performance_valeur ?? '—'}
                {r.performance_dq && (
                  <span className="ml-1 text-red-500">({r.performance_dq})</span>
                )}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[color:var(--color-muted)]">
              {r.date && <span>{new Date(r.date).toLocaleDateString('fr-FR')}</span>}
              {r.lieu && <span>{r.lieu}</span>}
              {r.place != null && <span>Place {r.place}</span>}
              {r.vent != null && <span>Vent {r.vent}</span>}
              {r.niveau && <span>{r.niveau}</span>}
            </div>
          </li>
        ))}
      </ul>

      {/* Tableau complet à partir de md : assez de largeur pour toutes les colonnes. */}
      <div className="hidden rounded-md border border-[color:var(--color-line)] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] text-left text-[color:var(--color-muted)]">
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
            {pageItems.map((r) => (
              <tr key={r.id} className="border-t border-[color:var(--color-line)]">
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

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[color:var(--color-muted)]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="tap rounded-md border border-[color:var(--color-line)] px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Précédent
          </button>
          <span>
            Page {currentPage} / {pageCount} · {resultats.length} résultats
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="tap rounded-md border border-[color:var(--color-line)] px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
