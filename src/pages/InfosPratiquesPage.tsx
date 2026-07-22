import { MapPin, CalendarClock } from 'lucide-react'
import { infosPratiques, type GroupeEntrainement } from '../data/infosPratiques'
import { RevealGroup, motion, staggerItem } from '../components/ui/motion'

function GroupeCard({ groupe }: { groupe: GroupeEntrainement }) {
  return (
    <motion.div variants={staggerItem} className="card card-hover flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-white">{groupe.titre}</h3>
        <span className="badge shrink-0 bg-club-primary/15 text-club-primary-light ring-1 ring-club-primary/30">
          {groupe.trancheAge}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
        {groupe.description}
      </p>
      <div className="mt-4 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-[color:var(--color-fg)]">
          <CalendarClock className="h-4 w-4 text-club-primary-light" />
          Créneaux
        </p>
        <ul className="mt-1.5 space-y-1 text-[color:var(--color-muted)]">
          {groupe.creneaux.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-club-primary-light" aria-hidden>
                ·
              </span>
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 text-[color:var(--color-muted)]">
          <MapPin className="h-4 w-4 shrink-0" />
          {groupe.lieu}
        </p>
      </div>
    </motion.div>
  )
}

export function InfosPratiquesPage() {
  return (
    <div className="animate-rise space-y-16">
      {/* En-tête éditorial */}
      <div className="band border border-[color:var(--color-line)]">
        <img
          src="/photos/race-wide.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/45" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            S'entraîner au club
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Infos pratiques
          </h1>
          <p className="mt-3 max-w-xl text-[color:var(--color-muted)]">
            Groupes, créneaux et lieux d'entraînement, des plus jeunes aux masters.
          </p>
        </div>
      </div>

      <section>
        <h2 className="section-title mb-5">Athlétisme jeunes</h2>
        <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {infosPratiques.jeunes.map((g) => (
            <GroupeCard key={g.titre} groupe={g} />
          ))}
        </RevealGroup>
      </section>

      <section>
        <h2 className="section-title mb-5">Adultes (U18 → Master)</h2>
        <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {infosPratiques.adultes.map((g) => (
            <GroupeCard key={g.titre} groupe={g} />
          ))}
        </RevealGroup>
      </section>
    </div>
  )
}
