import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../api/athletes'
import { AthleteCard } from '../components/athletes/AthleteCard'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { RevealGroup, motion, staggerItem } from '../components/ui/motion'
import type { Sexe } from './AthletesPage'

/**
 * `sexe` est piloté par le hub <AthletesPage> (et stocké dans l'URL) : ce filtre
 * choisit aussi la PHOTO du hero, qui ne vit pas dans ce composant. La recherche
 * texte, elle, n'a pas d'effet visuel au-dessus et reste locale.
 */
export function AthletesListPage({
  embedded = false,
  sexe,
  onSexeChange,
}: {
  embedded?: boolean
  sexe: Sexe
  onSexeChange: (sexe: Sexe) => void
}) {
  const [search, setSearch] = useState('')

  const { data: athletes, isLoading, isError } = useQuery({
    queryKey: ['athletes'],
    queryFn: listAthletes,
  })

  const filtered = useMemo(() => {
    if (!athletes) return []
    const query = search.trim().toLowerCase()
    return athletes.filter((a) => {
      const matchesSearch =
        !query || `${a.prenom} ${a.nom}`.toLowerCase().includes(query)
      const matchesSexe = sexe === 'tous' || a.sexe === sexe
      return matchesSearch && matchesSexe
    })
  }, [athletes, search, sexe])

  return (
    // Embarquée dans le hub <AthletesPage> : c'est lui qui porte la bande
    // photo d'en-tête et l'animation d'entrée.
    <div className={embedded ? '' : 'animate-rise'}>
      {/* Filtres */}
      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un athlète…"
          className="w-full min-w-0 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-2 text-sm text-[color:var(--color-fg)] shadow-sm transition placeholder:text-[color:var(--color-muted)] focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30 sm:w-72"
        />
        <div className="segmented">
          {(['tous', 'homme', 'femme'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={sexe === s} onClick={() => onSexeChange(s)}>
              {s === 'tous' ? 'Tous' : s === 'homme' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorMessage message="Impossible de charger les athlètes." />}
      {filtered.length === 0 && !isLoading && !isError && (
        <p className="text-[color:var(--color-muted)]">
          Aucun athlète ne correspond à ces critères.
        </p>
      )}
      {/* Grille montée seulement quand il y a des cartes : le message « aucun
          athlète » ci-dessus la remplace. Le cas « cartes ajoutées après la
          révélation du groupe » (filtre, recherche) est désormais traité dans
          `RevealGroup` lui-même — il n'y a plus de carte invisible à opacité 0. */}
      {filtered.length > 0 && (
        <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((athlete) => (
            <motion.div key={athlete.id} variants={staggerItem}>
              <AthleteCard athlete={athlete} />
            </motion.div>
          ))}
        </RevealGroup>
      )}
    </div>
  )
}
