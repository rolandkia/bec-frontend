import { CalendarPage } from './CalendarPage'
import { RecordsPage } from './RecordsPage'
import { SectionTabs, useTabParam, type TabDef } from '../components/ui/SectionTabs'

const TABS: TabDef[] = [
  { key: 'calendrier', label: 'Calendrier' },
  { key: 'records', label: 'Records' },
]

export function CompetitionsPage() {
  const [tab, setTab] = useTabParam('calendrier')

  return (
    <div className="animate-rise">
      <h1 className="section-title mb-6 text-3xl">Compétitions</h1>
      <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'records' ? <RecordsPage embedded /> : <CalendarPage embedded />}
    </div>
  )
}
