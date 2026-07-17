---
name: verify
description: Vérifier l'éditeur de blog (bec-frontend) en pilotant Chromium via Playwright, sans backend.
---

# Vérifier bec-frontend (éditeur de blog)

## Lancer

```bash
cd bec-frontend && npm run dev        # Vite sur http://localhost:5173
```

L'éditeur est sur `http://localhost:5173/blog/nouveau` (aucune auth). Le
backend FastAPI (port 8000) n'est PAS nécessaire pour l'éditeur : intercepter
`**/media/upload` avec `page.route` et répondre
`{ url: <data-uri>, resource_type: 'image' }` (le client compresse les images
via canvas avant l'envoi, ça marche en headless).

## Piloter

- Playwright est dispo via `npx playwright` (Chromium en cache
  `~/Library/Caches/ms-playwright`). Pour un script : `npm i playwright` dans
  un dossier scratch puis `node drive.mjs`.
- **Deux** `input[type=file]` sur la page : couverture (BlogPostForm) et
  toolbar. Cibler `.tiptap-toolbar input[type=file]`.
- Viewport haut (≥1400px) et `scrollIntoViewIfNeeded()` avant chaque drag :
  les coordonnées souris hors viewport ne touchent rien.
- Le drag des médias est 100 % pointer-events : `mouse.down` sur l'image,
  `mouse.move` en ~10 pas, `mouse.up`. Indicateurs à observer :
  `.tiptap-drop-indicator` (gap), `.tiptap-combine-indicator` +
  `.tiptap-combine-outline` (fusion en grille).
- La grille : `.ProseMirror [data-type="media-grid"]` (enfants = NodeViews
  React en `display:contents` autour des `<figure>`).
- L'aperçu publié (`BlogContent` + DOMPurify) est rendu EN DIRECT sur la même
  page (section « Aperçu », `.blog-rendered`) — parfait pour la parité
  éditeur/rendu sans sauvegarder.
- Presse-papiers : `browser.newContext({ permissions: ['clipboard-read',
  'clipboard-write'] })`, raccourcis `Meta+a/c/v`, `Meta+z` (undo).

## Flows qui valent le coup

Upload toolbar (multiple) → placeholder `.tiptap-upload-placeholder` puis
figures ; drag vers un gap (la ligne = la destination) ; drag sur le bord
d'un média → grille ; resize d'un item de grille (le voisin compense) ;
« Sortir de la grille » ; erreur d'upload (mock 502 → `.tb-error`) ;
mobile 390px (grille 2-up reste côte à côte) ; collage d'HTML legacy
(floats `fig-float-*`, `fig-w-N`) sans perte.
