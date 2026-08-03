# BEC — Frontend

Site public du **Bordeaux Étudiants Club** (athlétisme) : présentation du club, infos pratiques,
calendrier des compétitions, fiches athlètes et performances FFA, blog et galerie photo/vidéo.
Une SPA React qui consomme l'API [`bec-backend`](../bec-backend).

**Stack** : React 19 · TypeScript · Vite · Tailwind CSS 4 · TanStack Query · React Router 7 ·
Framer Motion · Recharts · Tiptap (éditeur d'articles) · Axios · oxlint.

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
| `npm run build` | Vérification TypeScript (`tsc -b`) puis build de production dans `dist/`. |
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

### Photos éditoriales sur CDN

Les ~60 photos de `public/` (bandeaux, chapitres, logos, 4,9 Mo) sont servies par la VM, qui est
en `us-east1` alors que le public du club est à Bordeaux : sans CDN, en une largeur fixe unique et
sans négociation de format. Elles peuvent être servies par Cloudinary, où le compte est déjà en
place pour les médias du back.

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
présence proche.

## Structure

```
src/
├── api/          # client Axios + un module par ressource (athletes, blogs, gallery…) et types.ts
├── pages/        # une page par route (cf. App.tsx)
├── components/   # athletes/, blog/, calendar/, gallery/, layout/, ui/
├── data/         # contenu éditorial statique (club, organigramme, infos pratiques, partenaires, photos)
├── lib/          # utilitaires transverses (compression d'image, export PDF, scroll infini)
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

## Routes

| Route | Page |
| --- | --- |
| `/` | Accueil |
| `/club`, `/infos-pratiques`, `/competitions`, `/actualite`, `/contact` | Sections principales (hubs) |
| `/palmares` | Histoire & palmarès du club (contenu statique, `data/palmares.ts`) |
| `/blog`, `/blog/:slug` | Liste et détail des articles |
| `/blog/admin`, `/blog/nouveau`, `/blog/:slug/modifier` | Administration éditoriale |
| `/athletes`, `/athletes/:id` | Liste des athlètes et fiche détaillée (RP, résultats, niveau) |
| `/galerie`, `/galerie/albums/:id` | Galerie et albums |
| `/galerie/admin`, `/galerie/nouveau`, `/galerie/media/:id/modifier` | Administration des médias |

Anciennes URL conservées en redirection : `/calendrier` → `/competitions`, `/records` →
`/athletes?tab=records` (les records sont un onglet du hub Athlètes).

Les pages d'administration ne sont pas protégées par authentification : elles ne sont
volontairement pas liées depuis la navigation.

## Design system

Le site est **sombre uniquement** : la variante Tailwind `dark:` est forcée en permanence via
`@custom-variant dark (&)`. Les tokens sont définis dans [`src/index.css`](src/index.css) :

- **Rouge club** (`--color-club-primary` `#b5121b`) — énergie et performance : CTA, accents.
- **Or club** (`--color-club-accent` `#d4af37`) — excellence : podiums, records, niveau
  international. À utiliser avec parcimonie.
- **Surfaces** — `--color-ink` (fond), `--color-surface` / `--color-surface-2` (cartes),
  `--color-line` (bordures), `--color-fg` / `--color-muted` (textes).
- **Typographie** — Inter (texte), Space Grotesk (titres).

Autre variante custom : `hover-hover:` restreint les effets de survol aux périphériques dotés d'un
vrai pointeur — sur mobile, `:hover` reste « collé » après un tap et rendrait tout contenu révélé au
survol inatteignable. Le tactile reçoit un retour `active:` à la place.

## Éditeur d'articles

Le blog utilise [Tiptap](https://tiptap.dev) avec des extensions maison
([`src/components/blog/extensions/`](src/components/blog/extensions/)) : mention d'athlètes,
images avec légende, grilles de médias, vidéos, redimensionnement au drag et upload par
glisser-déposer. Le HTML produit est assaini côté client avec DOMPurify (et côté serveur avec nh3).
Un article peut être exporté en PDF ([`src/lib/exportBlogPdf.ts`](src/lib/exportBlogPdf.ts)).

## Déploiement

Le `Dockerfile` construit le site puis le sert avec Caddy, qui joue aussi le rôle de reverse proxy
vers le backend et applique un fallback SPA (`try_files {path} /index.html`). Le workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) se déclenche sur `main` :
lint + build → push de l'image sur `ghcr.io/rolandkia/bec-frontend` → déploiement par SSH sur la VM.
Procédure d'infrastructure complète : [DEPLOYMENT.md](../DEPLOYMENT.md).
