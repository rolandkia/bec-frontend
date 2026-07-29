import type { LucideIcon } from 'lucide-react'
import { LandPlot, Route, Trees, Medal } from 'lucide-react'
import type { EvenementOut } from '../../api/types'

/** Icône par type d'épreuve — partagée par la frise et les listes d'épreuves. */
export const typeIcon: Record<EvenementOut['type'], LucideIcon> = {
  Piste: LandPlot,
  Route: Route,
  Cross: Trees,
  Meeting: Medal,
}
