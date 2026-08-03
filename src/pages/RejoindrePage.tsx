import { Mail, MapPin, Phone, UserPlus } from 'lucide-react'
import { club } from '../data/club'
import { groupesEntrainement } from '../data/infosPratiques'
import { GroupeCard } from '../components/club/GroupeCard'
import { sitePhotoProps } from '../lib/cloudinary'
import { PageHero } from '../components/layout/PageHero'
import { SectionHead } from '../components/ui/SectionHead'
import { Reveal, MaskReveal } from '../components/ui/motion'
import { SocialLinks } from '../components/ui/SocialLinks'
import { DemandeForm } from '../components/contact/DemandeForm'

/**
 * « Nous rejoindre » — fusion des anciennes pages /infos-pratiques et /contact.
 *
 * Les deux répondaient à UNE seule question du visiteur (« comment je viens
 * m'entraîner ici ? ») en la coupant en deux : les créneaux d'un côté, le
 * formulaire de l'autre, sans lien entre les deux. Le parcours va maintenant de
 * bout en bout : à quel groupe j'appartiens → quand ça s'entraîne → où c'est →
 * j'écris. Les anciennes URL redirigent ici (cf. App.tsx).
 */
export function RejoindrePage() {
  return (
    <div>
      <PageHero
        eyebrow="De l'initiation à la haute performance"
        title={['Nous', 'rejoindre']}
        subtitle="Deux groupes, une piste, et un club qui court depuis 1897. Que tu débutes ou que tu vises le podium, il y a une place pour toi."
        // Photo UNIQUE, volontairement : c'est LE visuel de recrutement (studio,
        // fond orange, les athlètes pointent le lecteur), et il est le seul à
        // tenir le voile uniforme `flat`. Un jeu qui alterne partagerait ce
        // voile, or aucune autre photo de la biblio n'en a besoin.
        photos={[{ src: '/photos/hero-studio-team.webp', focus: 'center 10%' }]}
        veil="flat"
      />

      <div className="space-y-16 sm:space-y-24">
        {/* ─── 1 · LES GROUPES ─────────────────────────────────────────────── */}
        {/* Plus de sous-titres « Athlétisme jeunes » / « Adultes » : avec un seul
            groupe par public, ils répétaient mot pour mot le titre de la carte et
            sa pastille d'âge. Un en-tête, deux encarts, alternance photo
            gauche / droite. */}
        <section>
          <SectionHead eyebrow="Les entraînements" title="Les groupes du club" />
          <div className="space-y-6">
            {groupesEntrainement.map((groupe, i) => (
              // `direction="left"` va de pair avec la photo à droite : le contenu
              // entre du même côté que l'image.
              <Reveal key={groupe.titre} direction={i % 2 === 0 ? 'up' : 'left'}>
                <GroupeCard groupe={groupe} imageSide={i % 2 === 0 ? 'left' : 'right'} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── 2 · LA RELÈVE (photo de contenu, pas un fond) ───────────────── */}
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <MaskReveal from="left" className="overflow-hidden rounded-md">
            <img
              {...sitePhotoProps('/photos/jeune-medaille.webp', {
                sizes: '(min-width: 1024px) 50vw, 100vw',
              })}
              alt="Jeune athlète du club, sa médaille entre les dents"
              width={1400}
              height={888}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </MaskReveal>
          <Reveal direction="left">
            <p className="eyebrow">La relève</p>
            <h2 className="section-title mb-4">On commence tous quelque part</h2>
            <p className="leading-relaxed text-[color:var(--color-muted)]">
              Chez les plus jeunes, on apprend à courir, sauter et lancer avant de se spécialiser.
              La première médaille compte autant que le premier record, et elle se mord toujours,
              pour vérifier.
            </p>
            {/* Ni tarif ni modalité ici : le club ne les a pas communiqués, et le
                formulaire ci-dessous demande déjà l'âge et la discipline pour y
                répondre au cas par cas (cf. data/infosPratiques.ts). */}
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
              Précise l'âge et la discipline dans ton message : on répond avec les modalités
              d'adhésion, les tarifs et les documents à fournir.
            </p>
          </Reveal>
        </section>

        {/* ─── 3 · ÉCRIRE AU CLUB ──────────────────────────────────────────── */}
        <section id="contact" className="scroll-mt-28">
          <SectionHead
            eyebrow="Une question, une inscription"
            title="Écrire au club"
          />
          {/* Le formulaire porte la section ; les coordonnées restent à côté
              comme voie de secours. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            {/* `lg:self-start` : la carte est bien plus courte que le formulaire,
                étirée elle laissait un grand vide bordé. */}
            <Reveal className="card p-6 sm:p-8 lg:self-start">
              <h3 className="mb-4 font-display text-xl font-bold uppercase">Nous contacter</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
                  <span className="text-[color:var(--color-muted)]">{club.contact.adresse}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
                  <a
                    href={club.contact.telephoneLien}
                    className="font-semibold transition hover:text-club-primary-light"
                  >
                    {club.contact.telephone}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-club-primary-light" />
                  <a
                    href={`mailto:${club.contact.email}`}
                    className="font-semibold transition hover:text-club-primary-light"
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
            </Reveal>

            <Reveal direction="left" className="card p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <UserPlus aria-hidden className="h-5 w-5 text-club-primary-light" />
                <h3 className="font-display text-xl font-bold uppercase">Nous écrire</h3>
              </div>
              <DemandeForm />
            </Reveal>
          </div>
        </section>
      </div>
    </div>
  )
}
