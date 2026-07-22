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
| `race-portrait.webp` | `photo_inside_race/Capture…11.24.05` | Tuile bento (portrait) |
| `race-01.webp` | `photo_inside_race/Capture…11.23.10` | Tuile bento (paysage) |
| `podium-01/02.webp` | `photo_podium/` | Tuiles bento / résultats |
| `start-01.webp` | `photo_starting_block/Capture…11.23.20` | Tuile bento |
| `group.webp` | `photo_partage_groupe/photo_groupe_serieux.png` | Tuile bento large |
| `portrait-camille.webp` | `photo_profile/camille_bechet.png` | Portrait athlète |
| `portrait-01.webp` | `photo_starting_block/IMG_6901.JPG` | Portrait athlète |
| `portrait-02.webp` | `photo_inside_race/IMG_6907.JPG` | Portrait athlète |
| `logo.webp` | `logo_bec.png` | Logo navbar/footer (alpha préservé) |

Pour régénérer / ajouter : `cwebp -q 74 -resize <largeur> 0 source.png -o sortie.webp`.

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
