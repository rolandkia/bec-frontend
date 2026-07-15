import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClassementEntry, ClassementParDiscipline } from '../../api/types'

const PODIUM_SIZE = 3

function DisciplineGroup({ group }: { group: ClassementParDiscipline }) {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? group.classement : group.classement.slice(0, PODIUM_SIZE)
  const hiddenCount = group.classement.length - PODIUM_SIZE

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-club-primary dark:border-slate-800 dark:bg-slate-900 dark:text-club-primary-light">
        {group.discipline}
      </div>

      {/* Liste empilée sur mobile : plus lisible qu'un tableau écrasé/à faire défiler. */}
      <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
        {visible.map((entry) => (
          <li key={`${entry.athlete_id}-${entry.rang}`} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/athletes/${entry.athlete_id}`}
                className="min-w-0 truncate font-medium text-club-primary underline dark:text-club-primary-light"
              >
                #{entry.rang} · {entry.prenom} {entry.nom}
              </Link>
              <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">
                {entry.raw_performance ?? entry.performance_valeur}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {entry.date && <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>}
              {entry.lieu && <span>{entry.lieu}</span>}
              {entry.vent != null && <span>Vent {entry.vent}</span>}
              {entry.niveau && <span>{entry.niveau}</span>}
            </div>
          </li>
        ))}
      </ul>

      {/* Tableau complet à partir de md : assez de largeur pour toutes les colonnes. */}
      <table className="hidden w-full table-fixed text-sm md:table">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[24%]" />
          <col className="w-[15%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400">
            <th className="px-4 py-2">Rang</th>
            <th className="px-4 py-2">Athlète</th>
            <th className="px-4 py-2">Performance</th>
            <th className="px-4 py-2">Vent</th>
            <th className="px-4 py-2">Niveau</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Lieu</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entry: ClassementEntry) => (
            <tr key={`${entry.athlete_id}-${entry.rang}`} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2 font-medium">{entry.rang}</td>
              <td className="truncate px-4 py-2">
                <Link to={`/athletes/${entry.athlete_id}`} className="text-club-primary underline dark:text-club-primary-light">
                  {entry.prenom} {entry.nom}
                </Link>
              </td>
              <td className="px-4 py-2">{entry.raw_performance ?? entry.performance_valeur}</td>
              <td className="px-4 py-2">{entry.vent ?? '—'}</td>
              <td className="px-4 py-2">{entry.niveau ?? '—'}</td>
              <td className="px-4 py-2">
                {entry.date
                  ? new Date(entry.date).toLocaleDateString('fr-FR')
                  : '—'}
              </td>
              <td className="truncate px-4 py-2">{entry.lieu ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hiddenCount > 0 && (
        <div className="border-t border-slate-100 px-4 py-2 text-center dark:border-slate-800">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-sm font-semibold text-club-primary hover:underline dark:text-club-primary-light"
          >
            {expanded ? 'Voir moins' : `Voir plus (${hiddenCount})`}
          </button>
        </div>
      )}
    </div>
  )
}

export function RecordsTable({ data }: { data: ClassementParDiscipline[] }) {
  const withResults = data.filter((d) => d.classement.length > 0)

  if (withResults.length === 0) {
    return (
      <p className="py-8 text-center text-slate-500 dark:text-slate-400">
        Aucun record trouvé pour ces critères.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {withResults.map((group) => (
        <DisciplineGroup key={group.discipline} group={group} />
      ))}
    </div>
  )
}
