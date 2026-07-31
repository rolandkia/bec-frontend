import type { FaitPalmares } from '../../data/palmares'
import { RevealGroup, motion, staggerItem } from '../ui/motion'

/**
 * Frise chronologique du palmarès du club.
 *
 * Reprend l'idiome de `components/calendar/Timeline.tsx` (rail continu, nœuds
 * hiérarchisés) sans le réutiliser : ce composant-là est typé `EvenementOut` et
 * groupé par mois via `utils/events.ts`, alors qu'on affiche ici du contenu
 * éditorial daté à l'année. Ce qui est repris, et pourquoi :
 *  - une SEULE `<ol>` et un rail en `inset-y-0` : sinon le trait se coupe entre
 *    les lignes ;
 *  - la colonne du milieu porte le rail → l'alignement tient d'une ligne à
 *    l'autre quelle que soit la hauteur du contenu ;
 *  - nœud OR + halo pour les faits internationaux (JO, championnats d'Europe),
 *    nœud rouge sinon — la politique « OR = excellence » est documentée dans
 *    `index.css`.
 */

/* Gabarit commun à toutes les lignes. La 1re colonne est plus large que dans la
   frise du calendrier : elle porte une année ('1923-1935' au plus long). */
const ROW =
  'grid grid-cols-[3.5rem_1rem_1fr] gap-x-2 sm:grid-cols-[5.5rem_1.25rem_1fr] sm:gap-x-4'

/** Trait du rail — pleine hauteur de la ligne, donc continu de ligne en ligne. */
function Rail({ from = 'top', accent = false }: { from?: 'top' | 'middle'; accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute left-1/2 w-px -translate-x-1/2 ${
        from === 'middle' ? 'top-1/2 h-1/2' : 'inset-y-0'
      } ${accent ? 'bg-club-accent/40' : 'bg-[color:var(--color-line)]'}`}
    />
  )
}

function FaitNode({ fait, isFirst }: { fait: FaitPalmares; isFirst: boolean }) {
  return (
    <motion.li variants={staggerItem} className={ROW}>
      {/* Année : alignée à droite contre le rail, chiffres tabulaires pour que
          les colonnes restent d'aplomb d'une ligne à l'autre. */}
      <div className="pt-0.5 text-right">
        <span
          className={`stat text-sm leading-none sm:text-lg ${
            fait.majeur ? 'text-club-accent-light' : ''
          }`}
        >
          {fait.annee}
        </span>
      </div>

      <div className="relative flex h-full justify-center">
        {/* Le rail démarre au premier fait : pas de trait qui pend au-dessus. */}
        <Rail from={isFirst ? 'middle' : 'top'} accent={fait.majeur} />
        <span
          aria-hidden
          className={`relative mt-1 h-3 w-3 shrink-0 rounded-full ${
            fait.majeur
              ? 'bg-club-accent ring-4 ring-club-accent/20'
              : 'bg-club-primary/60'
          }`}
        />
      </div>

      <div className="min-w-0 pb-7 sm:pb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)] sm:text-xs">
          {fait.discipline}
        </p>
        <p
          className={`mt-1 font-display font-bold leading-snug ${
            fait.majeur ? 'text-club-accent-light' : ''
          }`}
        >
          {fait.titre}
        </p>
        {fait.athlete && (
          <p className="mt-1 text-sm font-semibold text-[color:var(--color-fg)]">{fait.athlete}</p>
        )}
        {fait.detail && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
            {fait.detail}
          </p>
        )}
      </div>
    </motion.li>
  )
}

export function PalmaresTimeline({ faits }: { faits: FaitPalmares[] }) {
  return (
    <RevealGroup>
      <ol>
        {faits.map((fait, i) => (
          <FaitNode key={`${fait.annee}-${fait.titre}`} fait={fait} isFirst={i === 0} />
        ))}
      </ol>
    </RevealGroup>
  )
}
