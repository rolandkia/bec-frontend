import { Mail, MapPin, UserPlus, Info, ArrowRight } from 'lucide-react'
import { club } from '../data/club'
import { Reveal } from '../components/ui/motion'

export function ContactPage() {
  return (
    <div className="animate-rise space-y-12">
      {/* En-tête éditorial */}
      <div className="band border border-[color:var(--color-line)]">
        <img
          src="/photos/start-wide.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/45" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Nous rejoindre
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Contact &amp; inscription
          </h1>
          <p className="mt-3 max-w-xl text-[color:var(--color-muted)]">
            Une question ou l'envie de courir avec nous ? Voici comment nous joindre.
          </p>
        </div>
      </div>

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Coordonnées */}
        <div className="card p-6 sm:p-8">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Nous contacter</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
              <span className="text-[color:var(--color-muted)]">{club.contact.adresse}</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
              <a
                href={`mailto:${club.contact.email}`}
                className="font-semibold text-[color:var(--color-fg)] transition hover:text-club-primary-light"
              >
                {club.contact.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Inscription */}
        <div className="card flex flex-col p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-club-accent-light" />
            <h2 className="font-display text-lg font-bold text-white">Inscription</h2>
          </div>
          <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
            Les inscriptions en ligne seront bientôt disponibles. En attendant, écrivez-nous par
            e-mail pour connaître les modalités d'adhésion, les tarifs et les documents nécessaires.
          </p>
          <a
            href={`mailto:${club.contact.email}?subject=Demande d'inscription`}
            className="btn-primary mt-6 self-start"
          >
            Demander à s'inscrire
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Reveal>

      <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--color-line)] py-6 text-center text-sm text-[color:var(--color-muted)]">
        <Info className="h-4 w-4 shrink-0" />
        Un formulaire d'inscription en ligne sera ajouté ici prochainement.
      </p>
    </div>
  )
}
