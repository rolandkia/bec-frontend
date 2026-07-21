import { useQuery } from '@tanstack/react-query'
import type { EvenementOut } from '../api/types'
import { listEvents } from '../api/events'
import { splitEvents } from '../utils/events'
import { EventRow } from '../components/calendar/EventRow'
import { Loading, ErrorMessage } from '../components/ui/Status'

function groupByMonth(items: EvenementOut[]) {
  const groups = new Map<string, EvenementOut[]>()
  for (const event of items) {
    const key = new Date(event.date).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })
    const group = groups.get(key) ?? []
    group.push(event)
    groups.set(key, group)
  }
  return groups
}

function CalendarSection({
  title,
  count,
  items,
  emptyLabel,
  accent,
}: {
  title: string
  count: number
  items: EvenementOut[]
  emptyLabel: string
  accent?: boolean
}) {
  const groups = groupByMonth(items)

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-club-primary dark:text-club-primary-light">
          {title}
        </h2>
        <span
          className={`badge ${
            accent
              ? 'bg-club-accent/15 text-club-accent'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="mb-2 text-sm font-semibold capitalize text-slate-400 dark:text-slate-500">
                {month}
              </h3>
              <div className="space-y-3">
                {monthEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function CalendarPage({ embedded = false }: { embedded?: boolean }) {
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: listEvents })

  const { upcoming, past } = splitEvents(eventsQuery.data ?? [])

  return (
    <div className={`space-y-12 ${embedded ? '' : 'animate-rise'}`}>
      {!embedded && (
        <header>
          <h1 className="section-title text-3xl">Calendrier des compétitions</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Les prochaines échéances du club, mises à jour automatiquement selon la date du jour.
          </p>
        </header>
      )}

      {eventsQuery.isLoading && <Loading />}
      {eventsQuery.isError && (
        <ErrorMessage message="Impossible de charger le calendrier." />
      )}

      {eventsQuery.data && (
        <>
          <CalendarSection
            title="À venir"
            count={upcoming.length}
            items={upcoming}
            emptyLabel="Aucune compétition à venir pour le moment."
            accent
          />

          <CalendarSection
            title="Passées"
            count={past.length}
            items={past}
            emptyLabel="Aucune compétition passée."
          />
        </>
      )}
    </div>
  )
}
