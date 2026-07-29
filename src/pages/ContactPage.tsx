import { Mail, MapPin, Phone, UserPlus } from 'lucide-react'
import { club } from '../data/club'
import { Reveal } from '../components/ui/motion'
import { SocialLinks } from '../components/ui/SocialLinks'
import { DemandeForm } from '../components/contact/DemandeForm'

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
            Une question ou l'envie de courir avec nous ? Écris-nous ici, on te répond.
          </p>
        </div>
      </div>

      {/* Le formulaire porte la page (il remplace l'ancien lien mailto) ; les
          coordonnées restent à côté comme voie de secours. */}
      <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Coordonnées — `lg:self-start` : la carte est bien plus courte que le
            formulaire, étirée elle laissait un grand vide bordé. */}
        <div className="card p-6 sm:p-8 lg:self-start">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Nous contacter</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
              <span className="text-[color:var(--color-muted)]">{club.contact.adresse}</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
              <a
                href={club.contact.telephoneLien}
                className="font-semibold text-[color:var(--color-fg)] transition hover:text-club-primary-light"
              >
                {club.contact.telephone}
              </a>
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
          {/* Voie directe : ouvre le client mail du visiteur avec l'objet
              prérempli. Le formulaire reste la voie principale, mais certains
              préfèrent écrire depuis leur propre boîte. */}
          <a
            href={`mailto:${club.contact.email}?subject=${encodeURIComponent('Contact depuis le site du BEC')}`}
            className="btn-outline tap mt-6 w-full"
          >
            <Mail aria-hidden className="h-4 w-4" strokeWidth={2} />
            Écrire un e-mail
          </a>
          <hr className="hairline my-6" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Suivre le club
          </p>
          <SocialLinks />
          <hr className="hairline my-6" />
          <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">
            Pour une inscription, précise ton âge et la discipline qui t'intéresse : on te répond
            avec les modalités d'adhésion, les tarifs et les documents à fournir.
          </p>
        </div>

        {/* Formulaire de demande */}
        <div className="card p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-club-accent-light" />
            <h2 className="font-display text-lg font-bold text-white">Nous écrire</h2>
          </div>
          <DemandeForm />
        </div>
      </Reveal>
    </div>
  )
}
