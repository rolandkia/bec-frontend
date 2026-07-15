export interface ClubEvent {
  id: string
  nom: string
  date: string // ISO date
  lieu: string
  type: 'Piste' | 'Route' | 'Cross' | 'Meeting'
}

export const events: ClubEvent[] = [
  {
    id: 'event-1',
    nom: 'Meeting régional en salle',
    date: '2026-01-18',
    lieu: 'Bordeaux',
    type: 'Meeting',
  },
  {
    id: 'event-2',
    nom: 'Championnats départementaux de cross',
    date: '2026-02-08',
    lieu: 'Mérignac',
    type: 'Cross',
  },
  {
    id: 'event-3',
    nom: 'Meeting national printemps',
    date: '2026-04-12',
    lieu: 'Bordeaux',
    type: 'Meeting',
  },
  {
    id: 'event-4',
    nom: 'Championnats régionaux',
    date: '2026-06-06',
    lieu: 'Pau',
    type: 'Piste',
  },
  {
    id: 'event-5',
    nom: '10 km de Bordeaux',
    date: '2026-09-20',
    lieu: 'Bordeaux',
    type: 'Route',
  },
]
