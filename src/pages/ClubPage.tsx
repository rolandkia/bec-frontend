import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { club } from '../data/club'
import { partenaires, partenairesIntro } from '../data/partenaires'
import { listCoachs } from '../api/coachs'
import type { CoachOut } from '../api/types'
import { Reveal, RevealGroup, motion, staggerItem } from '../components/ui/motion'
import { Avatar } from '../components/ui/Avatar'
import { Loading, ErrorMessage } from '../components/ui/Status'

function MembreCard({ m }: { m: CoachOut }) {
  return (
    <motion.div
      variants={staggerItem}
      className="group card card-hover flex flex-col items-center p-8 text-center"
    >
      {/* Photo agrandie : anneau dégradé + zoom doux au survol. */}
      <div className="mb-5 rounded-full bg-gradient-to-br from-club-primary via-club-primary-light to-club-accent-light p-[3px] shadow-lg shadow-club-primary/20 transition duration-500 group-hover:shadow-club-primary/40">
        <div className="overflow-hidden rounded-full ring-4 ring-[color:var(--color-surface)]">
          <div className="transition-transform duration-500 ease-out group-hover:scale-110">
            <Avatar
              src={m.photo_url ?? undefined}
              alt={`${m.prenom} ${m.nom}`}
              initials={`${m.prenom[0] ?? ''}${m.nom[0] ?? ''}`}
              size="h-32 w-32 sm:h-36 sm:w-36"
              rounded="rounded-full"
              textSize="text-4xl"
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
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Le club
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
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
              <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {encadrement.map((m) => (
                  <MembreCard key={m.id} m={m} />
                ))}
              </RevealGroup>
            </section>
          )}
        </>
      )}

      {/* Partenaires */}
      <section>
        <h2 className="section-title mb-3">Nos partenaires</h2>
        <p className="mb-6 max-w-3xl text-[color:var(--color-muted)]">{partenairesIntro}</p>
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
          <p className="rounded-xl border border-dashed border-[color:var(--color-line)] py-8 text-center text-[color:var(--color-muted)]">
            Nos partenaires seront présentés ici prochainement. Vous souhaitez soutenir le club ?{' '}
            <Link to="/contact" className="font-semibold text-club-primary-light hover:text-white">
              Contactez-nous
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  )
}
