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
import { PageHero, type HeroPhoto } from '../components/layout/PageHero'

const SAISON_EN_COURS = currentSaison()

/**
 * Le bandeau alterne, et il alterne dans l'ORDRE d'une course : les blocs, la
 * ligne droite, la lutte au coude à coude, le podium. Le fond raconte donc ce
 * que le calendrier en dessous ne fait que dater.
 */
const HERO_PHOTOS: HeroPhoto[] = [
  // Les blocs. La source porte un filigrane « LES INSIDERS » en bas de cadre ;
  // le .webp a été régénéré en coupant la source au-dessus (cf. README des
  // photos), parce que s'en remettre au recadrage ne tenait qu'en desktop : en
  // mobile `object-cover` cale sur la hauteur, montre toute l'image, et le
  // filigrane restait devinable sous le voile.
  { src: '/photos/gallery/start-5.webp', focus: 'center 45%' },
  { src: '/photos/race-wide.webp', focus: 'center 40%' },
  { src: '/photos/gallery/race-3.webp', focus: 'center 15%' },
  // Le podium, pancarte « Championne Gironde 2026 » : la fin de l'histoire.
  { src: '/photos/gallery/podium-4.webp', focus: 'center 12%' },
]

export function CalendarPage() {
  const [showPast, setShowPast] = useState(false)
  const reduce = useReducedMotion()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: listEvents })

  const { upcoming, past } = splitEvents(eventsQuery.data ?? [])
  const nextEvent = upcoming[0]

  return (
    <div>
      <PageHero
        eyebrow={`Calendrier · saison ${SAISON_EN_COURS}`}
        title={['Compétitions']}
        subtitle={
          eventsQuery.data
            ? upcoming.length === 0
              ? 'Aucune épreuve à venir pour le moment.'
              : `${upcoming.length} épreuve${upcoming.length > 1 ? 's' : ''} à venir cette saison.`
            : undefined
        }
        photos={HERO_PHOTOS}
      />

      {eventsQuery.isLoading && <Loading />}
      {eventsQuery.isError && <ErrorMessage message="Impossible de charger le calendrier." />}

      {eventsQuery.data && (
        <div className="space-y-8">
          {nextEvent ? (
            <Reveal>
              <NextEventCard event={nextEvent} />
            </Reveal>
          ) : (
            <p className="rounded-md border border-dashed border-[color:var(--color-line)] py-10 text-center text-[color:var(--color-muted)]">
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
                className="tap inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold text-[color:var(--color-muted)] transition hover:border-club-primary hover:text-[color:var(--color-fg)]"
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
