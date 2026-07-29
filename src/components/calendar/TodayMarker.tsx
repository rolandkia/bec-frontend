/**
 * Repère « aujourd'hui » sur la frise : sépare les épreuves à venir (au-dessus)
 * des épreuves passées (en dessous).
 */
export function TodayMarker({ today = new Date() }: { today?: Date }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full bg-club-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-club-primary)_20%,transparent)]"
      />
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-club-primary-light">
        Aujourd'hui
      </span>
      <span className="tabular text-xs text-[color:var(--color-muted)]">
        {today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-club-primary/50 to-transparent"
      />
    </div>
  )
}
