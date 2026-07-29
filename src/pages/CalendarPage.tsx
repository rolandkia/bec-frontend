import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { listEvents } from '../api/events'
import { splitEvents } from '../utils/events'
import { currentSaison } from '../utils/saison'
import { NextEventCard } from '../components/calendar/NextEventCard'
import { Timeline } from '../components/calendar/Timeline'
import { TodayMarker } from '../components/calendar/TodayMarker'
import { Loading, ErrorMessage } from '../components/ui/Status'
import { motion, Reveal } from '../components/ui/motion'

const SAISON_EN_COURS = currentSaison()

export function CalendarPage() {
  const [showPast, setShowPast] = useState(false)
  const reduce = useReducedMotion()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: listEvents })

  const { upcoming, past } = splitEvents(eventsQuery.data ?? [])
  const nextEvent = upcoming[0]

  return (
    <div className="animate-rise">
      {/* En-tête éditorial — même parti que la liste des athlètes */}
      <div className="band mb-8 border border-[color:var(--color-line)]">
        <img
          src="/photos/race-wide.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/40" />
        <div className="relative px-6 py-9 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Calendrier · saison {SAISON_EN_COURS}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Compétitions
          </h1>
          {eventsQuery.data && (
            <p className="mt-2 text-[color:var(--color-muted)]">
              {upcoming.length === 0
                ? 'Aucune épreuve à venir pour le moment'
                : `${upcoming.length} épreuve${upcoming.length > 1 ? 's' : ''} à venir`}
            </p>
          )}
        </div>
      </div>

      {eventsQuery.isLoading && <Loading />}
      {eventsQuery.isError && <ErrorMessage message="Impossible de charger le calendrier." />}

      {eventsQuery.data && (
        <div className="space-y-8">
          {nextEvent ? (
            <Reveal>
              <NextEventCard event={nextEvent} />
            </Reveal>
          ) : (
            <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
              Aucune compétition à venir pour le moment.
            </p>
          )}

          {upcoming.length > 0 && <Timeline items={upcoming} nextId={nextEvent?.id} />}

          <TodayMarker />

          {past.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                aria-expanded={showPast}
                aria-controls="frise-passees"
                className="tap inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold text-[color:var(--color-muted)] transition hover:border-club-primary hover:text-white"
              >
                <ChevronDown
                  aria-hidden
                  className={`h-4 w-4 transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
                {showPast
                  ? 'Masquer les épreuves passées'
                  : `Voir les ${past.length} épreuve${past.length > 1 ? 's' : ''} passée${past.length > 1 ? 's' : ''}`}
              </button>

              {/* Même contrat que le menu mobile de la navbar : height auto animée,
                  simple fondu si `prefers-reduced-motion`. */}
              <AnimatePresence initial={false}>
                {showPast && (
                  <motion.div
                    id="frise-passees"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6">
                      <Timeline items={past} muted />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
