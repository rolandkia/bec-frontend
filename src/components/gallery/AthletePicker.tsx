import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../../api/athletes'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-club-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

/** Sélecteur d'athlètes tagués (multi-sélection). Réutilise le filtre par
 *  sous-chaîne « prénom nom » de la liste des athlètes (comme AthletesListPage).
 *  `value`/`onChange` portent la liste des ids sélectionnés. */
export function AthletePicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (ids: number[]) => void
}) {
  const [search, setSearch] = useState('')
  const { data: athletes } = useQuery({ queryKey: ['athletes'], queryFn: listAthletes })

  const filtered = useMemo(() => {
    if (!athletes) return []
    const query = search.trim().toLowerCase()
    const notSelected = athletes.filter((a) => !value.includes(a.id))
    if (!query) return notSelected.slice(0, 8)
    return notSelected
      .filter((a) => `${a.prenom} ${a.nom}`.toLowerCase().includes(query))
      .slice(0, 8)
  }, [athletes, search, value])

  const selected = useMemo(
    () => (athletes ?? []).filter((a) => value.includes(a.id)),
    [athletes, value],
  )

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-full bg-club-primary/10 px-3 py-1 text-sm text-club-primary dark:text-club-primary-light"
            >
              {a.prenom} {a.nom}
              <button
                type="button"
                aria-label={`Retirer ${a.prenom} ${a.nom}`}
                className="ml-1 font-bold"
                onClick={() => onChange(value.filter((id) => id !== a.id))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        className={inputClass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un athlète à taguer…"
      />
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtered.map((a) => (
            <button
              type="button"
              key={a.id}
              className="rounded-full border border-slate-300 px-3 py-1 text-sm transition hover:border-club-primary hover:text-club-primary dark:border-slate-700"
              onClick={() => {
                onChange([...value, a.id])
                setSearch('')
              }}
            >
              + {a.prenom} {a.nom}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
