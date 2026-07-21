import { club } from '../data/club'

export function ContactPage() {
  return (
    <div className="animate-rise space-y-12">
      <header>
        <h1 className="section-title text-3xl">Contact & inscription</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Envie de nous rejoindre ou une question ? Voici comment nous joindre.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-club-primary dark:text-club-primary-light">
            Nous contacter
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{club.contact.adresse}</p>
          <a
            href={`mailto:${club.contact.email}`}
            className="mt-2 inline-block text-sm font-semibold text-club-primary hover:underline dark:text-club-primary-light"
          >
            {club.contact.email}
          </a>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-club-primary dark:text-club-primary-light">
            Inscription
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Les inscriptions en ligne seront bientôt disponibles. En attendant, écrivez-nous par
            e-mail pour connaître les modalités d'adhésion, les tarifs et les documents nécessaires.
          </p>
          <a
            href={`mailto:${club.contact.email}?subject=Demande d'inscription`}
            className="btn-accent mt-4 inline-block"
          >
            Demander à s'inscrire
          </a>
        </div>
      </section>

      <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        🚧 Un formulaire d'inscription en ligne sera ajouté ici prochainement.
      </p>
    </div>
  )
}
