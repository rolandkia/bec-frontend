# Photos optimisées — BEC Athlétisme

Sélection curée depuis `../../../bec-pictures/`, optimisée en `.webp`
(`cwebp`, redimensionnée) pour la refonte design. Référencées dans le code par
`/photos/<nom>.webp`.

> **Règle absolue** : aucun chemin vers `bec-pictures/` ne doit apparaître dans
> le code du front. Toute image passe d'abord par une conversion `.webp` ici.

## Où ces fichiers sont-ils servis ?

Les chemins `/photos/...` restent l'**identité canonique** d'une photo dans tout
le code, mais ils ne disent pas d'où elle est servie. C'est
`sitePhoto()` / `sitePhotoProps()` ([`src/lib/cloudinary.ts`](../../src/lib/cloudinary.ts))
qui tranchent, au rendu :

* **sans `VITE_CLOUDINARY_CLOUD_NAME`** : ces fichiers, servis par Caddy depuis
  la VM (donc depuis `us-east1`), en une largeur unique ;
* **avec la variable** : les mêmes photos depuis Cloudinary, sous le public_id
  `bec_site/photos/<nom>`, en AVIF/WebP et à trois largeurs (`srcset`).

L'envoi est fait par `task upload:site-photos` côté `bec-backend`
([`src/scripts/upload_site_photos.py`](../../../bec-backend/src/scripts/upload_site_photos.py)),
qui dérive le public_id du chemin de fichier. **Une photo ajoutée ou remplacée ici
doit donc être renvoyée** (`task upload:site-photos -- --force` pour un
remplacement à nom identique), sinon le CDN continue de servir l'ancienne.

Ces fichiers restent dans le dépôt même après la bascule : ce sont eux la source
de l'envoi, et le repli si la variable est retirée.

## Photos porteuses du récit (refonte « hybride éditorial »)

Le scroll de l'accueil alterne des chapitres CLAIRS et NOIRS ; ces cinq photos
portent les moments forts. Elles ont été retenues sur leur **valeur narrative**,
pas sur leur netteté : ce sont les seules de la bibliothèque où le club apparaît
en collectif.

| Fichier | Source | Usage prévu |
|---|---|---|
| `hero-interclub.webp` | `photo-interclub/interclub_2026.png` (2400px, q78) | **Hero de l'accueil.** Le club au complet aux interclubs : fumigènes rouge et or, blason brandi, tout le monde en rouge. La photo la plus émotionnelle de la biblio. Cadrée `center 55%` (le groupe est au tiers bas) et voilée depuis le bas SEULEMENT — le ciel et les fumigènes doivent rester visibles. NB : `interclub_2024.png` est un doublon binaire (md5 identique), non converti. |
| `hero-studio-team.webp` | `photo_partage_groupe/photo_groupe_serieux.png` (2200px, q78) | **Chapitre « Rejoindre ».** Studio, 7 athlètes en rouge sur fond orange/or, qui pointent le lecteur du doigt. Qualité campagne — c'est LE visuel de recrutement, et il justifie à lui seul le duo rouge/or de la charte. |
| `club-famille.webp` | `photo_partage_groupe/photo_groupe_famille.png` (1800px, q74) | Section « La vie du club » : le groupe HORS piste (soirée annuelle). C'est ce que les photos de compétition ne racontent pas. |
| `interclub-drapeau.webp` | `photo-interclub/interclub_2025_1.jpg` (1200px, q74) | Tuile portrait « vie du club » — un athlète brandit le drapeau devant le groupe. Source portrait 1200×1600, donc pas de `-resize` utile au-delà. |
| `interclub-drapeau-wide.webp` | `photo-interclub/interclub_2025_1.jpg` **recadrée 16/9** (1200×675, q74) | **Bandeau de l'onglet Effectif / Tous** (`/athletes`). Même cliché que ci-dessus, mais la source est en portrait : recadrée sur sa bande centrale, `y` de 420 à 1095, ce qui garde le drapeau brandi, l'effectif entier agenouillé et l'athlète debout jusqu'aux pieds, et jette le tiers de ciel vide et le tiers de pelouse vide qui écrasaient le sujet. `cwebp -q 74 -crop 0 420 1200 675 <source> -o public/photos/interclub-drapeau-wide.webp` — **sans `-resize`** : la source ne fait que 1200 px de large, viser les 1500 px des autres fonds de bandeau n'inventerait que du flou. Elle est donc un peu plus douce que ses voisines sur grand écran, c'est la limite du fichier d'origine. |
| `jeune-medaille.webp` | `photo-info/photo-evan-athlete-enfant.png` (1400px, q74) | Section jeunes de `/rejoindre` : un enfant du club, sa médaille entre les dents. Photo de CONTENU (vrai `alt`), pas un fond. |

## Fonds de section et portraits (itération précédente)

| Fichier | Source | Usage prévu |
|---|---|---|
| `hero-sprint.webp` | `photo_starting_block/roland-400.png` | Fond de section large (2000px). N'est plus le hero : un athlète seul ne transmet pas l'esprit d'équipe, et la photo porte un filigrane « LES INSIDERS » en bas à masquer. |
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
| `gregory-afoy.webp` | `gregory-afoy/Capture…20.37.44.png` | Encart Grégory Afoy de `/palmares` — **c'est lui** (maillot FRANCE, dossard « AFOY / CALI 22 », témoin en main : relais des Mondiaux U20 de Cali 2022), donc vrai `alt`. Source paysage 1384×1008 recadrée en portrait avant conversion : `sips --cropToHeightWidth 1008 820`, puis `cwebp -q 74` **sans** `-resize` (820 px, on n'upscale pas) |
| `logo.webp` | `logo_bec.png` | Logo navbar/footer (alpha préservé) |

Pour régénérer / ajouter : `cwebp -q 74 -resize <largeur> 0 source.png -o sortie.webp`.

**Invariant : aucun fichier de ce dossier n'est orphelin.** Tout `.webp` ici est
référencé depuis `src/`. La refonte « hybride éditorial » a rendu inutiles huit
fichiers de l'itération précédente (`hero-sprint`, `group`, `concentration-02`,
`race-01`, `start-01`, `portrait-01`, `portrait-02`, `portrait-camille`) : ils ont
été supprimés plutôt que laissés à peser dans le bundle — `public/` est copié
verbatim au build. Ce sont des fichiers DÉRIVÉS, régénérables à l'identique
depuis `bec-pictures/` avec les commandes de ce README. Les mêmes sujets restent
d'ailleurs tous présents dans la collection `gallery/`.

Pour vérifier l'invariant :
```bash
for img in $(ls public/photos/*.webp | xargs -n1 basename); do
  [ "$(grep -rl "$img" src/ | wc -l)" = "0" ] && echo "ORPHELINE: $img"
done
```

## Variantes de largeur — `w384/` `w640/` `w768/` `w1024/` `w1280/` `w1920/`

**Ces dossiers sont GÉNÉRÉS**, en miroir de l'arborescence ci-dessus
(`w768/gallery/race-1.webp` est la version 768 px de `gallery/race-1.webp`), et
ils sont commités. Ils existent parce que chaque photo n'était servie qu'en UNE
largeur, celle du plus grand écran possible : sur l'accueil, mesuré sur un
Pixel 7 en 4G, 1 737 ko d'images pour 193 ko de JavaScript, dont la moitié des
octets jetés par le navigateur au redimensionnement. Le même parcours en télécharge
maintenant 761 ko.

```bash
node scripts/photo-variants.mjs           # génère ce qui manque + le manifeste
node scripts/photo-variants.mjs --force   # tout réencoder
node scripts/photo-variants.mjs --check   # vérifier (code 1 si à régénérer)
```

À LANCER après tout ajout, remplacement ou suppression d'une photo de ce dossier.
Le script écrit aussi `src/data/photoVariants.ts`, le manifeste que consulte
`sitePhotoSrcSet` — sans lui, aucun `srcset` n'est émis et le site retombe
simplement sur les originaux, sans rien casser.

L'invariant « aucun orphelin » ci-dessus n'a pas à en tenir compte : son `ls
public/photos/*.webp` ne descend pas dans les sous-dossiers, et les variantes ne
sont référencées par aucun nom dans `src/` — elles sont calculées à partir du
chemin de l'original. Le ménage complet est un `rm -rf public/photos/w*` suivi
d'une régénération.

Détails d'implémentation (échelle des largeurs, qualité, plafond de densité sur
téléphone) : en tête de `scripts/photo-variants.mjs` et sur `PHONE_PHOTO_CAP`
dans `src/lib/cloudinary.ts`.

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
| photo-interclub | `interclub-` | 3 |
| photo_starting_block | `start-` | 5 |
| photo_inside_race | `race-` | 6 |
| photo_podium | `podium-` | 6 |
| photo_partage_groupe | `group-` | 11 |
| photo_concentration | `concentration-` | 6 |
| photo_profile + photo-info | `portrait-` | 2 |

Les trois `interclub-*` OUVRENT la collection dans `clubPhotos.ts` : ce sont les
seules photos où le club apparaît au complet. `interclub_2024.png` étant un
doublon binaire de `interclub_2026.png`, il n'y a que 3 fichiers pour 4 sources.
`group-10` = soirée du club, `group-11` = portrait studio, `portrait-2` = jeune
athlète médaillé.

Régénérer : `cwebp -q 72 -resize 1500 0 <source> -o public/photos/gallery/<theme>-<n>.webp`.

**Exception — `start-5.webp` est RECADRÉE** (1500×793 au lieu de 845). Sa source
`roland-400.png` porte un filigrane « LES INSIDERS » en bas de cadre, occupant
les lignes 1358→1405 de ses 1438 px. Devenue fond de bandeau sur `/competitions`,
elle ne pouvait plus s'en remettre au recadrage du hero : en desktop le filigrane
tombe hors cadre, mais en mobile `object-cover` cale sur la hauteur, montre toute
l'image, et le filigrane restait devinable sous le voile. La source est coupée
8 px au-dessus :

```bash
cwebp -q 72 -crop 0 0 2554 1350 -resize 1500 0 \
  ../../../bec-pictures/photo_starting_block/roland-400.png \
  -o public/photos/gallery/start-5.webp
```
