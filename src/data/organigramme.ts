// Équipe du club (bureau dirigeant + encadrement) — données statiques.
// Photos servies depuis `public/photos/profil/*.webp` (converties depuis
// `bec-pictures/photo_profile/` via `cwebp -q 74 -resize 600 0`).
// `description` est optionnelle : la renseigner ici si besoin.

export type MembreEquipe = {
  role: string
  prenom: string
  nom: string
  description?: string
  photo: string
}

/** Rétro-compat : ancien nom du type. */
export type MembreBureau = MembreEquipe

export const bureau: MembreEquipe[] = [
  {
    role: 'Président',
    prenom: 'Moussa',
    nom: 'Moumini',
    photo: '/photos/profil/moussa-moumini.webp',
  },
  {
    role: 'Secrétaire',
    prenom: 'Stéphanie',
    nom: 'Desqueyroux',
    photo: '/photos/profil/stephanie-desqueyroux.webp',
  },
  {
    role: 'Trésorière',
    prenom: 'Ingrid',
    nom: 'Benedetti',
    photo: '/photos/profil/ingrid-benedetti.webp',
  },
]

export const encadrement: MembreEquipe[] = [
  {
    role: 'Entraîneur',
    prenom: 'Camille',
    nom: 'Béchet',
    photo: '/photos/profil/camille-bechet.webp',
  },
]
