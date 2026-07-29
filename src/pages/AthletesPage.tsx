import { useQuery } from '@tanstack/react-query'
import { listAthletes } from '../api/athletes'
import { AthletesListPage } from './AthletesListPage'
import { RecordsPage } from './RecordsPage'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'effectif', label: 'Effectif' },
  { key: 'records', label: 'Records' },
]

/**
 * Hub « Athlètes » : l'effectif et les records du club sont deux vues des mêmes
 * données de performance (les noms du tableau de records pointent d'ailleurs vers
 * `/athletes/:id`). Les records vivaient auparavant sous « Compétitions », qui ne
 * porte plus que le calendrier.
 */
export function AthletesPage() {
  const [tab, setTab] = useTabParam('effectif')
  const isRecords = tab === 'records'

  // Même clé de requête que <AthletesListPage> : le compte est gratuit (cache).
  const { data: athletes } = useQuery({ queryKey: ['athletes'], queryFn: listAthletes })

  return (
    <div className="animate-rise">
      {/* En-tête éditorial — photo du groupe */}
      <div className="band mb-8 border border-[color:var(--color-line)]">
        <img
          src="/photos/group.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/40" />
        <div className="relative px-6 py-9 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            {isRecords ? 'Les meilleures performances du club' : "L'effectif"}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            {isRecords ? 'Records' : 'Athlètes'}
          </h1>
          {!isRecords && athletes && (
            <p className="mt-2 text-[color:var(--color-muted)]">
              {athletes.length} athlètes licenciés
            </p>
          )}
        </div>
      </div>

      <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

      {isRecords ? <RecordsPage embedded /> : <AthletesListPage embedded />}
    </div>
  )
}
