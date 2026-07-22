import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClassementEntry, ClassementParDiscipline } from '../../api/types'
import { LevelBadge } from './LevelBadge'

const PODIUM_SIZE = 3

function DisciplineGroup({ group }: { group: ClassementParDiscipline }) {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? group.classement : group.classement.slice(0, PODIUM_SIZE)
  const hiddenCount = group.classement.length - PODIUM_SIZE

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[color:var(--color-line)] px-4 py-3">
        <span className="h-4 w-1 rounded-full bg-club-primary" aria-hidden />
        <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          {group.discipline}
        </span>
      </div>

      {/* Liste empilée sur mobile : plus lisible qu'un tableau écrasé/à faire défiler. */}
      <ul className="md:hidden">
        {visible.map((entry, i) => (
          <li
            key={`${entry.athlete_id}-${entry.rang}`}
            className={`px-4 py-3 ${i === 0 ? 'bg-club-primary/[0.06]' : 'border-t border-[color:var(--color-line)]/60'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/athletes/${entry.athlete_id}`}
                className="min-w-0 truncate text-sm font-semibold text-slate-100 transition hover:text-club-primary-light"
              >
                <span className="tabular text-[color:var(--color-muted)]">#{entry.rang}</span>{' '}
                {entry.prenom} {entry.nom}
              </Link>
              <span
                className={`tabular shrink-0 font-display font-bold ${
                  i === 0 ? 'text-club-accent' : 'text-white'
                }`}
              >
                {entry.raw_performance ?? entry.performance_valeur}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-muted)]">
              {entry.niveau && <LevelBadge niveau={entry.niveau} />}
              {entry.date && <span className="tabular">{new Date(entry.date).toLocaleDateString('fr-FR')}</span>}
              {entry.lieu && <span>{entry.lieu}</span>}
              {entry.vent != null && <span>Vent {entry.vent}</span>}
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
          <col className="w-[14%]" />
          <col className="w-[12%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[color:var(--color-muted)]">
            <th className="px-4 py-2 font-semibold">Rang</th>
            <th className="px-4 py-2 font-semibold">Athlète</th>
            <th className="px-4 py-2 font-semibold">Performance</th>
            <th className="px-4 py-2 font-semibold">Vent</th>
            <th className="px-4 py-2 font-semibold">Niveau</th>
            <th className="px-4 py-2 font-semibold">Date</th>
            <th className="px-4 py-2 font-semibold">Lieu</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entry: ClassementEntry, i) => (
            <tr
              key={`${entry.athlete_id}-${entry.rang}`}
              className={`border-t border-[color:var(--color-line)]/60 ${i === 0 ? 'bg-club-primary/[0.06]' : ''}`}
            >
              <td className="tabular px-4 py-2.5 font-bold text-white">{entry.rang}</td>
              <td className="truncate px-4 py-2.5">
                <Link
                  to={`/athletes/${entry.athlete_id}`}
                  className="font-semibold text-slate-100 transition hover:text-club-primary-light"
                >
                  {entry.prenom} {entry.nom}
                </Link>
              </td>
              <td
                className={`tabular px-4 py-2.5 font-display font-bold ${
                  i === 0 ? 'text-club-accent' : 'text-white'
                }`}
              >
                {entry.raw_performance ?? entry.performance_valeur}
              </td>
              <td className="tabular px-4 py-2.5 text-[color:var(--color-muted)]">{entry.vent ?? '—'}</td>
              <td className="px-4 py-2.5">{entry.niveau ? <LevelBadge niveau={entry.niveau} /> : '—'}</td>
              <td className="tabular px-4 py-2.5 text-[color:var(--color-muted)]">
                {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="truncate px-4 py-2.5 text-[color:var(--color-muted)]">{entry.lieu ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hiddenCount > 0 && (
        <div className="border-t border-[color:var(--color-line)] px-4 py-2.5 text-center">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-sm font-semibold text-club-primary-light transition hover:text-white"
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
      <p className="py-8 text-center text-[color:var(--color-muted)]">
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
