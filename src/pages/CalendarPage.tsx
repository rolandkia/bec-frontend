import { useQuery } from '@tanstack/react-query'
import type { EvenementOut } from '../api/types'
import { listEvents } from '../api/events'
import { splitEvents } from '../utils/events'
import { EventRow } from '../components/calendar/EventRow'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { motion, Reveal, RevealGroup, staggerItem } from '../components/ui/motion'

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
        <span className="h-5 w-1 rounded-full bg-club-primary" aria-hidden />
        <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-white">
          {title}
        </h2>
        <span
          className={`badge tabular ${
            accent
              ? 'border border-club-primary/40 bg-club-primary/15 text-club-primary-light'
              : 'bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]'
          }`}
        >
          {count}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-8 text-center text-[color:var(--color-muted)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="mb-2 text-xs font-semibold uppercase capitalize tracking-[0.14em] text-[color:var(--color-muted)]">
                {month}
              </h3>
              <RevealGroup className="space-y-3">
                {monthEvents.map((event) => (
                  <motion.div key={event.id} variants={staggerItem}>
                    <EventRow event={event} />
                  </motion.div>
                ))}
              </RevealGroup>
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
    <div className="space-y-12">
      {!embedded && (
        <Reveal>
          <h1 className="section-title text-3xl">Calendrier des compétitions</h1>
          <p className="mt-2 text-[color:var(--color-muted)]">
            Les prochaines échéances du club, mises à jour automatiquement selon la date du jour.
          </p>
        </Reveal>
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
