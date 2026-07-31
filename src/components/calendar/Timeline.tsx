import { Fragment } from 'react'
import { MapPin } from 'lucide-react'
import type { EvenementOut } from '../../api/types'
import { groupByMonth, parseLocalDate } from '../../utils/events'
import { RevealGroup, motion, staggerItem } from '../ui/motion'
import { typeIcon } from './eventType'

/* Gabarit commun aux séparateurs de mois et aux nœuds : la colonne du milieu
   porte le rail, donc la ligne reste alignée d'une ligne à l'autre. */
const ROW = 'grid grid-cols-[2.5rem_1rem_1fr] gap-x-2 sm:grid-cols-[3rem_1.25rem_1fr] sm:gap-x-4'

/** Trait du rail — pleine hauteur de la ligne, donc continu de ligne en ligne. */
function Rail({ from = 'top', accent = false }: { from?: 'top' | 'middle'; accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute left-1/2 w-px -translate-x-1/2 ${
        from === 'middle' ? 'top-1/2 h-1/2' : 'inset-y-0'
      } ${accent ? 'bg-club-primary/40' : 'bg-[color:var(--color-line)]'}`}
    />
  )
}

function MonthSeparator({ month, isFirst }: { month: string; isFirst: boolean }) {
  return (
    <motion.li variants={staggerItem} className={ROW} aria-hidden>
      <div />
      <div className="relative flex h-full justify-center">
        {/* Le rail démarre au premier mois : pas de trait qui pend au-dessus. */}
        <Rail from={isFirst ? 'middle' : 'top'} />
      </div>
      <div className="pb-3 text-xs font-semibold uppercase capitalize leading-none tracking-[0.14em] text-[color:var(--color-muted)]">
        {month}
      </div>
    </motion.li>
  )
}

function TimelineNode({
  event,
  isNext,
  muted,
}: {
  event: EvenementOut
  isNext: boolean
  muted: boolean
}) {
  const date = parseLocalDate(event.date)
  const Icon = typeIcon[event.type]

  return (
    <motion.li variants={staggerItem} className={`${ROW} ${muted ? 'opacity-60' : ''}`}>
      {/* Jour + mois : alignés à droite contre le rail, chiffres tabulaires. */}
      <div className="pt-0.5 text-right">
        <span className="tabular font-display text-lg font-bold leading-none sm:text-xl">
          {date.toLocaleDateString('fr-FR', { day: '2-digit' })}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase leading-none tracking-wide text-[color:var(--color-muted)]">
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
      </div>

      <div className="relative flex h-full justify-center">
        <Rail accent={isNext} />
        <span
          aria-hidden
          className={`relative mt-1 h-3 w-3 shrink-0 rounded-full ${
            muted
              ? 'border border-[color:var(--color-line)] bg-[color:var(--color-surface)]'
              : isNext
                ? 'bg-club-primary ring-4 ring-club-primary/20'
                : 'bg-club-primary/60'
          }`}
        />
      </div>

      <div className="min-w-0 pb-6">
        <p className="line-clamp-2 font-display font-bold leading-snug">{event.nom}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--color-muted)]">
          <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{event.lieu}</span>
          <span className="opacity-40">·</span>
          <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="uppercase tracking-wide">{event.type}</span>
        </p>
      </div>
    </motion.li>
  )
}

/**
 * Frise chronologique verticale : UNE seule liste, rail continu, les mois en
 * séparateurs. La lisibilité vient de la hiérarchie des nœuds — plein + halo
 * pour la prochaine épreuve, plein pour les suivantes, creux pour le passé.
 */
export function Timeline({
  items,
  nextId,
  muted = false,
}: {
  items: EvenementOut[]
  /** Id de l'épreuve à mettre en avant (la prochaine). */
  nextId?: number
  /** Frise du passé : nœuds creux et contenu estompé. */
  muted?: boolean
}) {
  return (
    <RevealGroup>
      <ol>
        {groupByMonth(items).map(([month, monthEvents], groupIndex) => (
          <Fragment key={month}>
            <MonthSeparator month={month} isFirst={groupIndex === 0} />
            {monthEvents.map((event) => (
              <TimelineNode
                key={event.id}
                event={event}
                isNext={event.id === nextId}
                muted={muted}
              />
            ))}
          </Fragment>
        ))}
      </ol>
    </RevealGroup>
  )
}
