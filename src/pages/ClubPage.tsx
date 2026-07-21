import { Link } from 'react-router-dom'
import { CoachesPage } from './CoachesPage'
import { bureau } from '../data/organigramme'
import { partenaires, partenairesIntro } from '../data/partenaires'

export function ClubPage() {
  return (
    <div className="animate-rise space-y-16">
      <header>
        <h1 className="section-title text-3xl">Le club</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          L'organisation du BEC Athlétisme : son bureau, son encadrement et ses partenaires.
        </p>
      </header>

      {/* Bureau */}
      <section>
        <h2 className="section-title mb-5">Le bureau</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bureau.map((m) => (
            <div
              key={m.role}
              className="card card-hover flex flex-col items-center p-6 text-center"
            >
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={`${m.prenom} ${m.nom}`}
                  className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-club-primary-light to-club-primary text-xl font-bold text-white shadow-sm">
                  {m.prenom[0]}
                  {m.nom[0]}
                </div>
              )}
              <p className="mt-4 text-sm font-medium text-club-accent">{m.role}</p>
              <p className="font-semibold text-club-primary dark:text-club-primary-light">
                {m.prenom} {m.nom}
              </p>
              {m.description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {m.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Encadrement */}
      <section>
        <h2 className="section-title mb-5">L'encadrement</h2>
        <CoachesPage embedded />
      </section>

      {/* Partenaires */}
      <section>
        <h2 className="section-title mb-3">Nos partenaires</h2>
        <p className="mb-6 max-w-3xl text-slate-600 dark:text-slate-300">{partenairesIntro}</p>
        {partenaires.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {partenaires.map((p) => {
              const logo = (
                <div className="card card-hover flex h-28 items-center justify-center p-4">
                  <img src={p.logo} alt={p.nom} className="max-h-16 max-w-full object-contain" />
                </div>
              )
              return p.url ? (
                <a key={p.nom} href={p.url} target="_blank" rel="noreferrer" title={p.nom}>
                  {logo}
                </a>
              ) : (
                <div key={p.nom} title={p.nom}>
                  {logo}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Nos partenaires seront présentés ici prochainement. Vous souhaitez soutenir le club ?{' '}
            <Link
              to="/contact"
              className="font-semibold text-club-primary hover:underline dark:text-club-primary-light"
            >
              Contactez-nous
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  )
}
