import { groupesEntrainement } from '../data/infosPratiques'
import { GroupeCard } from '../components/club/GroupeCard'
import { Reveal } from '../components/ui/motion'

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
            Deux groupes, un stade : les créneaux d'entraînement du club, des plus jeunes aux
            Masters.
          </p>
        </div>
      </div>

      {/* Plus de sous-titres « Athlétisme jeunes » / « Adultes » : avec un seul
          groupe par public, ils répétaient mot pour mot le titre de la carte et
          sa pastille d'âge. Un en-tête, deux encarts, alternance photo gauche /
          droite — même dispositif que /palmares. */}
      <section>
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Les entraînements
          </p>
          <h2 className="section-title">Les groupes du club</h2>
        </div>
        <div className="space-y-6">
          {groupesEntrainement.map((groupe, i) => (
            // `direction="left"` va de pair avec la photo à droite : le contenu
            // entre du même côté que l'image (cf. PalmaresPage).
            <Reveal key={groupe.titre} direction={i % 2 === 0 ? 'up' : 'left'}>
              <GroupeCard groupe={groupe} imageSide={i % 2 === 0 ? 'left' : 'right'} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
