# Photos optimisées — BEC Athlétisme

Sélection curée depuis `../../../bec-pictures/`, optimisée en `.webp`
(`cwebp`, redimensionnée) pour la refonte design. Servies statiquement depuis
`/photos/<nom>.webp`.

| Fichier | Source | Usage prévu |
|---|---|---|
| `hero-sprint.webp` | `photo_starting_block/roland-400.png` | Hero plein-cadre (2000px) |
| `start-wide.webp` | `photo_starting_block/Capture…11.25.27` | Fond de section large |
| `race-wide.webp` | `photo_inside_race/Capture…11.22.50` | Fond de section large |
| `concentration-01/02.webp` | `photo_concentration/` | Tuiles bento (portrait) |
| `race-portrait.webp` | `photo_inside_race/Capture…11.24.05` | Tuile bento (portrait) + encart Clément Ducos de `/palmares` — **c'est lui** (dossard « CLEMENT DUCOS », maillot Tennessee, NCAA), donc traité comme photo de contenu avec un vrai `alt` |
| `race-01.webp` | `photo_inside_race/Capture…11.23.10` | Tuile bento (paysage) |
| `podium-01/02.webp` | `photo_podium/` | Tuiles bento / résultats |
| `start-01.webp` | `photo_starting_block/Capture…11.23.20` | Tuile bento |
| `group.webp` | `photo_partage_groupe/photo_groupe_serieux.png` | Tuile bento large |
| `portrait-camille.webp` | `photo_profile/camille_bechet.png` | Portrait athlète |
| `portrait-01.webp` | `photo_starting_block/IMG_6901.JPG` | Portrait athlète |
| `portrait-02.webp` | `photo_inside_race/IMG_6907.JPG` | Portrait athlète |
| `besson-maillot-bec.webp` | `photo_historique/collete-besson-portant-maillot-bec.webp` | Encart Colette Besson de `/palmares` — photo d'archive, donc de contenu avec un vrai `alt`. Retenue parce qu'elle y porte le maillot du club ; source 320×480 seulement, donc douce en 2× (pas de `-resize`, ça n'inventerait rien) |
| `logo.webp` | `logo_bec.png` | Logo navbar/footer (alpha préservé) |

Pour régénérer / ajouter : `cwebp -q 74 -resize <largeur> 0 source.png -o sortie.webp`.

Trois autres archives de Colette Besson dorment dans
`bec-pictures/photo_historique/` sans être converties : le portrait N&B de 1968
(667×1000, le plus net, mais maillot France), le podium de Mexico (1024×580) et
la réception triomphale à Bordeaux (`.bmp` — `cwebp` ne le lit pas, passer par
`sips -s format png`). La dernière est en paysage et ferait une bien meilleure
bande pleine largeur qu'une colonne de carte.

## Photos de profil — `profil/`

Membres du club (bureau + encadrement), source unique côté front :
`src/data/organigramme.ts` (section « Le bureau » et « L'encadrement » de la page
Club). Converties depuis `bec-pictures/photo_profile/` en `.webp` (affichées en
avatars ~80px, largeur 600px suffisante).

| Fichier | Source | Rôle |
|---|---|---|
| `profil/moussa-moumini.webp` | `photo_profile/moussa_moumini.png` | Président |
| `profil/stephanie-desqueyroux.webp` | `photo_profile/stephanie_desqueyroux.png` | Secrétaire |
| `profil/ingrid-benedetti.webp` | `photo_profile/ingrid_benedetti.png` | Trésorière |
| `profil/camille-bechet.webp` | `photo_profile/camille_bechet.png` | Entraîneur |

Régénérer : `cwebp -q 74 -resize 600 0 <source> -o public/photos/profil/<prenom-nom>.webp`.

## Collection complète — `gallery/`

Toutes les photos de `bec-pictures/` (33), regroupées par thème et converties
(`cwebp -q 72 -resize 1500 0`). Servies via `/photos/gallery/<theme>-<n>.webp`.
Source unique côté front : `src/data/clubPhotos.ts` (alimente la bande
« Le club en mouvement » de l'accueil + la section « Le club en images » de la
galerie, avec Lightbox).

| Thème (dossier source) | Préfixe | Nombre |
|---|---|---|
| photo_starting_block | `start-` | 5 |
| photo_inside_race | `race-` | 6 |
| photo_podium | `podium-` | 6 |
| photo_partage_groupe | `group-` | 9 |
| photo_concentration | `concentration-` | 6 |
| photo_profile | `portrait-` | 1 |

Régénérer : `cwebp -q 72 -resize 1500 0 <source> -o public/photos/gallery/<theme>-<n>.webp`.
