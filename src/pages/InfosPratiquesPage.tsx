import { infosPratiques, type GroupeEntrainement } from '../data/infosPratiques'

function GroupeCard({ groupe }: { groupe: GroupeEntrainement }) {
  return (
    <div className="card card-hover p-6">
      <h3 className="font-display text-lg font-bold text-club-primary dark:text-club-primary-light">
        {groupe.titre}
      </h3>
      <p className="mt-1 text-sm font-medium text-club-accent">{groupe.trancheAge}</p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{groupe.description}</p>
      <div className="mt-4 text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Créneaux</p>
        <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
          {groupe.creneaux.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
        <p className="mt-3 text-slate-500 dark:text-slate-400">📍 {groupe.lieu}</p>
      </div>
    </div>
  )
}

export function InfosPratiquesPage() {
  return (
    <div className="animate-rise space-y-16">
      <header>
        <h1 className="section-title text-3xl">Infos pratiques</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Groupes, créneaux et lieux d'entraînement, des plus jeunes aux masters.
        </p>
      </header>

      <section>
        <h2 className="section-title mb-5">Athlétisme jeunes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {infosPratiques.jeunes.map((g) => (
            <GroupeCard key={g.titre} groupe={g} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-5">Adultes (U18 → Master)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {infosPratiques.adultes.map((g) => (
            <GroupeCard key={g.titre} groupe={g} />
          ))}
        </div>
      </section>
    </div>
  )
}
