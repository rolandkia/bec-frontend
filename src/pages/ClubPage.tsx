import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Target } from 'lucide-react'
import { club } from '../data/club'
import { besoinsClub, partenaires, partenairesIntro } from '../data/partenaires'
import { listCoachs } from '../api/coachs'
import type { CoachOut } from '../api/types'
import { Reveal, RevealGroup, motion, staggerItem } from '../components/ui/motion'
import { Avatar } from '../components/ui/Avatar'
import { PartenaireCard } from '../components/club/PartenaireCard'
import { Loading, ErrorMessage } from '../components/ui/Status'

function MembreCard({ m }: { m: CoachOut }) {
  return (
    <motion.div
      variants={staggerItem}
      className="group card card-hover tap flex flex-col items-center p-5 text-center sm:p-8"
    >
      {/* Photo agrandie : anneau dégradé + zoom doux au survol. */}
      <div className="mb-4 rounded-full bg-gradient-to-br from-club-primary via-club-primary-light to-club-accent-light p-[3px] shadow-lg shadow-club-primary/20 transition duration-500 group-hover:shadow-club-primary/40 sm:mb-5">
        <div className="overflow-hidden rounded-full ring-4 ring-[color:var(--color-surface)]">
          <div className="transition-transform duration-500 ease-out group-hover:scale-110">
            <Avatar
              src={m.photo_url ?? undefined}
              alt={`${m.prenom} ${m.nom}`}
              initials={`${m.prenom[0] ?? ''}${m.nom[0] ?? ''}`}
              size="h-24 w-24 sm:h-36 sm:w-36"
              rounded="rounded-full"
              textSize="text-3xl sm:text-4xl"
            />
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-club-accent-light">
        {m.role}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-white">
        {m.prenom} {m.nom}
      </p>
      {m.bio && <p className="mt-2 text-sm text-[color:var(--color-muted)]">{m.bio}</p>}
    </motion.div>
  )
}

export function ClubPage() {
  const { data: coachs, isLoading, isError } = useQuery({
    queryKey: ['coachs'],
    queryFn: listCoachs,
  })

  const bureau = (coachs ?? []).filter((c) => c.categorie === 'bureau')
  const encadrement = (coachs ?? []).filter((c) => c.categorie === 'encadrement')

  return (
    <div className="animate-rise space-y-16">
      {/* En-tête éditorial */}
      <div className="band border border-[color:var(--color-line)]">
        <img
          src="/photos/group.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/40" />
        <div className="relative px-6 py-9 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Le club
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            {club.sigle} Athlétisme
          </h1>
          <p className="mt-3 max-w-xl text-[color:var(--color-muted)]">
            Son bureau, son encadrement et ses partenaires.
          </p>
        </div>
      </div>

      {/* Notre histoire — split photo + texte */}
      <section>
        <div className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal className="flex flex-col justify-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Notre histoire
            </p>
            <h2 className="section-title mb-4">Un collectif, une exigence</h2>
            <p className="max-w-2xl leading-relaxed text-[color:var(--color-muted)]">{club.histoire}</p>
          </Reveal>
          <Reveal
            direction="left"
            className="band relative min-h-[260px] border border-[color:var(--color-line)]"
          >
            <img
              src="/photos/concentration-01.webp"
              alt="Athlète du club à l'entraînement"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/70 to-transparent" />
          </Reveal>
        </div>
      </section>

      {/* Bureau + encadrement (issus de l'API /coachs) */}
      {isLoading ? (
        <Loading label="Chargement de l'équipe…" />
      ) : isError ? (
        <ErrorMessage message="Impossible de charger l'équipe du club." />
      ) : (
        <>
          {/* Bureau */}
          {bureau.length > 0 && (
            <section>
              <h2 className="section-title mb-5">Le bureau</h2>
              {/* 2 par ligne dès le mobile : la fiche est courte (photo, rôle,
                  nom), une colonne unique donnait une liste interminable. */}
              <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {bureau.map((m) => (
                  <MembreCard key={m.id} m={m} />
                ))}
              </RevealGroup>
            </section>
          )}

          {/* Encadrement */}
          {encadrement.length > 0 && (
            <section>
              <h2 className="section-title mb-5">L'encadrement</h2>
              {/* 2 par ligne dès le mobile : la fiche est courte (photo, rôle,
                  nom), une colonne unique donnait une liste interminable. */}
              <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {encadrement.map((m) => (
                  <MembreCard key={m.id} m={m} />
                ))}
              </RevealGroup>
            </section>
          )}
        </>
      )}

      {/* Partenaires + besoins du club */}
      <section>
        <h2 className="section-title mb-3">Nos partenaires</h2>
        <p className="mb-6 max-w-3xl text-[color:var(--color-muted)]">{partenairesIntro}</p>
        {partenaires.length > 0 ? (
          // Une seule colonne tant qu'il n'y a qu'un partenaire : la carte est un
          // split logo + description, elle a besoin de la pleine largeur.
          <div className={`grid gap-4 ${partenaires.length > 1 ? 'lg:grid-cols-2' : ''}`}>
            {partenaires.map((p) => (
              <PartenaireCard key={p.nom} partenaire={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-8 text-center text-[color:var(--color-muted)]">
            Nos partenaires seront présentés ici prochainement. Vous souhaitez soutenir le club ?{' '}
            <Link to="/contact" className="font-semibold text-club-primary-light hover:text-white">
              Contactez-nous
            </Link>
            .
          </p>
        )}

        {/* Ce à quoi sert concrètement un partenariat : la contrepartie chiffrée
            du paragraphe d'intro, sans laquelle « devenir partenaire » reste une
            formule creuse. */}
        <h3 className="section-title mb-4 mt-12">Nos besoins</h3>
        <RevealGroup className="grid gap-3 sm:grid-cols-2">
          {besoinsClub.map((besoin) => (
            <motion.div
              key={besoin}
              variants={staggerItem}
              className="card flex items-start gap-3 p-5"
            >
              <Target
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light"
                strokeWidth={2}
              />
              <p className="text-sm leading-relaxed text-[color:var(--color-muted)]">{besoin}</p>
            </motion.div>
          ))}
        </RevealGroup>
        <div className="mt-6">
          {/* Vers le formulaire du site plutôt qu'un `mailto:` : la page contact
              porte déjà le motif « Autre » (partenariat, presse), et la demande
              passe par le backend au lieu du client mail du visiteur. */}
          <Link to="/contact" className="btn-primary">
            Devenir partenaire
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  )
}
