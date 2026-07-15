import { Link } from 'react-router-dom'
import type { ClassementParDiscipline } from '../../api/types'

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
        <div key={group.discipline} className="rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-club-primary dark:border-slate-800 dark:bg-slate-900 dark:text-club-primary-light">
            {group.discipline}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2">Rang</th>
                <th className="px-4 py-2">Athlète</th>
                <th className="px-4 py-2">Performance</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Lieu</th>
              </tr>
            </thead>
            <tbody>
              {group.classement.slice(0, 3).map((entry) => (
                <tr key={`${entry.athlete_id}-${entry.rang}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2 font-medium">{entry.rang}</td>
                  <td className="px-4 py-2">
                    <Link to={`/athletes/${entry.athlete_id}`} className="text-club-primary underline dark:text-club-primary-light">
                      {entry.prenom} {entry.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{entry.raw_performance ?? entry.performance_valeur}</td>
                  <td className="px-4 py-2">
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-2">{entry.lieu ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
