# BEC — Frontend

Site public du **Bordeaux Étudiants Club** (athlétisme) : présentation du club, effectif et records
FFA, calendrier des compétitions, magazine (articles et galerie photo/vidéo) et inscription.
Une SPA React qui consomme l'API [`bec-backend`](../bec-backend).

**Stack** : React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · TanStack Query · React Router 7 ·
Framer Motion · Recharts · Tiptap (éditeur d'articles) · DOMPurify · jsPDF · Axios · lucide-react ·
oxlint. Servi en production par Caddy.

Vue d'ensemble du projet, provenance des contenus et déploiement : [README du dépôt parent](../README.md).

---

## Démarrage rapide

Prérequis : Node 22+. Le backend doit tourner sur `http://127.0.0.1:8000` (`task run:api`).

```bash
npm install
npm run dev     # http://localhost:5173
```

| Script | Description |
| --- | --- |
| `npm run dev` | Serveur de développement Vite (HMR) + proxy `/api`. |
| `npm run build` | Vérification TypeScript (`tsc -b`), build de production dans `dist/`, puis pré-compression brotli/zstd/gzip ([`scripts/precompress.mjs`](scripts/precompress.mjs)). |
| `npm run preview` | Sert le build de production localement. |
| `npm run lint` | oxlint. |

## Configuration

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | URL de base de l'API côté navigateur. À laisser vide en dev (le proxy s'en charge) et en prod (Caddy sert `/api` sur la même origine). |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8000` | Backend visé par le proxy Vite en développement. |
| `VITE_CLOUDINARY_CLOUD_NAME` | *(vide)* | Sert les photos éditoriales de `public/` depuis Cloudinary au lieu de la VM. Voir ci-dessous. |

Le front n'appelle **que des URLs relatives `/api/...`** ([`src/api/client.ts`](src/api/client.ts)).
En développement, Vite relaie ces requêtes vers le backend
([`vite.config.ts`](vite.config.ts)) ; en production, Caddy fait le même reverse proxy
([`Caddyfile`](Caddyfile)). Les requêtes restent donc same-origin : aucun problème de CORS ni
d'ambiguïté `localhost` / `127.0.0.1` / IPv6.

### Photos éditoriales — variantes de largeur

Les 58 photos de `public/photos` sont servies **en plusieurs largeurs** (`srcset`), à partir de
variantes pré-générées et commitées dans `public/photos/w<largeur>/` :

```bash
node scripts/photo-variants.mjs          # après tout ajout / remplacement de photo
node scripts/photo-variants.mjs --check  # vérifie que variantes et manifeste sont à jour
```

Sans elles, chaque photo partait dans la largeur du plus grand écran possible : un accueil parcouru
sur un Pixel 7 en 4G téléchargeait 1 737 ko d'images pour 193 ko de JavaScript, la moitié des octets
étant jetés au redimensionnement. Il en télécharge 761 ko, et le LCP de l'accueil passe de ~2,2 s à
~1,7 s (mêmes conditions, VM simulée à 110 ms d'aller-retour). Détails et compromis (échelle des
largeurs, plafond de densité sur téléphone) : en tête de
[`scripts/photo-variants.mjs`](scripts/photo-variants.mjs) et
[`public/photos/README.md`](public/photos/README.md).

### Photos éditoriales sur CDN

La VM est en `us-east1` alors que le public du club est à Bordeaux, et elle sert sans CDN ni
négociation de format. Les photos peuvent être servies par Cloudinary, où le compte est déjà en
place pour les médias du back — ce qui remplace alors les variantes locales et supprime en plus
l'aller-retour transatlantique sur 90 % du poids des pages.

```bash
# 1. envoi (côté bec-backend, idempotent, --dry-run pour voir sans envoyer)
task upload:site-photos
# 2. bascule : compiler le front avec le cloud name
VITE_CLOUDINARY_CLOUD_NAME=<cloud name> npm run build
```

**Sans la variable, rien ne change** : `sitePhoto()` ([`src/lib/cloudinary.ts`](src/lib/cloudinary.ts))
renvoie le chemin local. C'est ce repli qui rend la bascule et le retour arrière sans risque : les
chemins `/photos/...` restent l'identité canonique d'une photo, dans le code comme dans
`src/data`, et il n'y a aucun manifeste d'URL à maintenir à côté des fichiers. Avec la variable,
les mêmes chemins sont livrés en AVIF/WebP, à trois largeurs (`srcset`), depuis un point de
présence proche — et `sitePhotoSrcSet` cesse d'elle-même d'utiliser les variantes locales, sans
rien à défaire.

## Structure

```
src/
├── api/          # client Axios + un module par ressource (athletes, blogs, gallery…) et types.ts
├── pages/        # une page par route (cf. App.tsx)
├── components/   # athletes/, blog/, calendar/, gallery/, layout/, ui/
├── data/         # contenu éditorial statique (club, palmarès, créneaux, partenaires, photos, bandeaux)
├── lib/          # livraison des images (cloudinary, localPhotos), préchargement, export PDF…
├── utils/        # logique métier partagée avec le backend (niveau, saison, URL FFA)
└── index.css     # design tokens Tailwind (couleurs club, typographie, variantes custom)
```

- **`api/`** — les composants n'appellent jamais Axios directement : ils passent par ces modules,
  consommés via TanStack Query (`retry: 1`, `staleTime: 30 s`, configuré dans
  [`src/main.tsx`](src/main.tsx)).
- **`data/`** — contenu qui n'a pas vocation à passer par le backend (valeurs du club, créneaux
  d'entraînement, bureau, partenaires). C'est ici qu'on édite le texte du site.
- **`utils/`** — réplique fidèle de certaines règles du backend (`domain/niveau.py`,
  `domain/saison.py`) : toute évolution de l'un doit être reportée dans l'autre.
- **`public/photos/`** — assets statiques en `.webp`, distincts des médias de la galerie qui, eux,
  sont uploadés vers Cloudinary par le backend.
- **`lib/cloudinary.ts`** — toutes les URL d'image passent par ici : transformations Cloudinary à
  la livraison (`cldImage`, `cldSrcSet`…), photos du site (`sitePhotoProps`) et images stockées en
  base qui peuvent être l'un ou l'autre (`storedImageProps`, cf. « Images des articles »).
- **`lib/prefetch.ts`** / **`lib/routeChunks.ts`** — préchargement des pages au survol et après le
  chargement ; les `import()` sont partagés avec `App.tsx`.

## Routes

La navigation compte cinq sections ; les onglets et filtres vivent dans l'URL (`?tab=`, `?sexe=`),
pour qu'un lien partagé ouvre la même vue.

| Route | Page |
| --- | --- |
| `/` | Accueil (seule page du premier chargement, cf. [`App.tsx`](src/App.tsx)) |
| `/club` | Histoire, palmarès, équipe (bureau et encadrement), partenaires |
| `/athletes` | Effectif (`?sexe=homme\|femme`) et records du club (`?tab=records`) |
| `/athletes/:id` | Fiche athlète : records personnels, progression, historique des résultats |
| `/competitions` | Calendrier de la saison, prochaine épreuve, épreuves passées |
| `/mag` | Articles (`?tab=articles`) et galerie (`?tab=galerie`) |
| `/rejoindre` | Groupes d'entraînement, créneaux, formulaire de contact (`#contact`) |
| `/blog/:slug` | Article |
| `/blog`, `/galerie`, `/galerie/albums/:id` | Pages internes (liste seule, album) |
| `/blog/admin`, `/blog/nouveau`, `/blog/:slug/modifier` | Administration des articles |
| `/galerie/admin`, `/galerie/nouveau`, `/galerie/media/:id/modifier` | Administration des médias |

Anciennes URL conservées en redirection : `/palmares` → `/club#palmares`, `/infos-pratiques` →
`/rejoindre`, `/contact` → `/rejoindre#contact`, `/actualite` → `/mag`, `/calendrier` →
`/competitions`, `/records` → `/athletes?tab=records`.

⚠️ Les pages d'administration ne sont **pas protégées** (l'API non plus) : elles ne sont pas dans
la navigation, mais les boutons « Gérer les articles » et « Gérer la galerie » du Mag y mènent.

## Design system

Le site est **clair par défaut** (papier chaud `#f7f6f4`) et passe en **sombre selon le réglage
du système** (`prefers-color-scheme`). Les moments forts du récit sont des **chapitres noirs**
(`.chapter-dark`) dans les deux thèmes. Tout repose sur des tokens sémantiques, définis dans
[`src/index.css`](src/index.css), qu'un chapitre noir redéfinit sur son sous-arbre : un composant
écrit `bg-[color:var(--color-surface)]` ou `text-[color:var(--color-fg)]` et reste juste partout,
sans connaître son contexte.

- **Rouge club** (`--color-club-primary` `#b5121b`) — énergie et performance : CTA, accents.
- **Or club** (`--color-club-accent` `#d4af37`) — excellence : podiums, records, niveau
  international. À utiliser avec parcimonie.
- **Aplat ou texte ?** `club-primary` / `club-accent` sont des aplats, constants ;
  `club-primary-light` / `club-accent-light` sont les versions TEXTE, qui changent avec le fond
  (le rouge `#b5121b` tient 6,5:1 sur le papier mais 2,5:1 sur le noir).
- **Surfaces** — `--color-canvas` (fond de page), `--color-surface` / `--color-surface-2`
  (cartes, pastilles), `--color-line` (filets), `--color-fg` / `--color-muted` (textes).
  `--color-ink` est un noir CONSTANT, pour les voiles sur photo.
- **Typographie** — Barlow Condensed (titres et chiffres), Inter (texte).
- **Texte sur photo** — toujours blanc, jamais un token de thème : `text-white` sur un fond
  clair est invisible, et c'est la première chose à vérifier en thème clair.

La variante `dark:` signifie « je rends sur un fond sombre » : elle couvre le thème sombre du
système ET l'intérieur d'un chapitre noir.

Autre variante custom : `hover-hover:` restreint les effets de survol aux périphériques dotés d'un
vrai pointeur — sur mobile, `:hover` reste « collé » après un tap et rendrait tout contenu révélé au
survol inatteignable. Le tactile reçoit un retour `active:` à la place.

## Éditeur d'articles

Le blog utilise [Tiptap](https://tiptap.dev) avec des extensions maison
([`src/components/blog/extensions/`](src/components/blog/extensions/)) : mention d'athlètes,
images avec légende, grilles de médias, vidéos, redimensionnement au drag et upload par
glisser-déposer. Le HTML produit est assaini côté client avec DOMPurify (et côté serveur avec nh3).
Un article peut être exporté en PDF ([`src/lib/exportBlogPdf.ts`](src/lib/exportBlogPdf.ts)).

### Images des articles

Une image d'article (couverture ou corps) est stockée en base sous forme d'URL, de deux origines
possibles :

- un **asset Cloudinary**, envoyé depuis l'éditeur, transformé à la livraison (`srcset` à trois
  largeurs, format négocié) ;
- une **photo du site** référencée par son chemin (`/photos/...`), comme dans les articles
  d'exemple du backend (`task seed:articles`), servie par ses variantes locales.

`storedImageProps` ([`src/lib/cloudinary.ts`](src/lib/cloudinary.ts)) choisit entre les deux, et
[`src/lib/blogMedia.ts`](src/lib/blogMedia.ts) l'applique au HTML de l'article avant son
insertion dans la page. Une image dans une grille de deux s'annonce à 50vw sur téléphone : elle
était téléchargée à la largeur de la colonne entière.

## Déploiement

Le `Dockerfile` construit le site puis le sert avec Caddy, qui joue aussi le rôle de reverse proxy
vers le backend et applique un fallback SPA (`try_files {path} /index.html`). Le workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) se déclenche sur `main` :
lint + build → push de l'image sur `ghcr.io/rolandkia/bec-frontend` → déploiement par SSH sur la VM.
Procédure d'infrastructure complète, et mesures de performance : [DEPLOYMENT.md](../DEPLOYMENT.md).
