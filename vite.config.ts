import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// URL du backend en développement. Surchargeable via VITE_API_PROXY_TARGET.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  /* ─── Découpage des morceaux : optimisé pour HTTP/1.1 ────────────────────────
     Le site est servi sur IP nue, donc SANS TLS, donc sans HTTP/2 : pas de
     multiplexage. Le navigateur ouvre au plus 6 connexions vers l'origine et
     chacune paie sa propre poignée de main, ~110 ms depuis Bordeaux vers
     us-east1. Le nombre de FICHIERS du premier rendu compte donc autant que
     leur poids.

     Le découpage automatique produisait 13 fichiers pour le premier écran (le
     runtime rolldown, react, react-dom, react-router, axios, lucide, le
     manifeste photo, club.ts…), dont huit pesaient moins de 8 ko. Treize
     requêtes sur six connexions = trois vagues d'aller-retour avant le premier
     pixel, pour ~10 ko utiles. Deux groupes les ramènent à cinq fichiers, soit
     UNE seule vague.

     Mesuré sur ce dépôt (brotli -11, chemin du premier rendu) :
       avant : 13 requêtes / 165 889 o
       après :  5 requêtes / 163 177 o
     Moins de fichiers ET moins d'octets — voir plus bas pourquoi le poids
     baisse aussi.

     ⚠️ Les groupes sont énumérés PAQUET PAR PAQUET, jamais par un `node_modules`
     global. Un groupe large aspirerait dans le bundle toujours chargé des
     dépendances qui ne servent qu'aux pages différées (jspdf, html2canvas,
     recharts, Tiptap) — exactement ce que `App.tsx` s'applique à tenir à
     l'écart. Même raison pour l'absence de `lucide-react` dans `vendor` : le
     paquet entier y ferait entrer TOUTES les icônes, y compris celles des pages
     d'admin. Seule sa fabrique commune (`createLucideIcon`, 1,4 ko) rejoint
     `app-shared`. C'est cette précision qui fait baisser le poids en plus du
     nombre de requêtes.

     Si une page différée se met un jour à peser lourd sur le premier rendu,
     vérifier ici AVANT d'accuser le code : un `test` trop large est la cause la
     plus probable. Contrôle rapide après build — aucun de ces noms ne doit
     apparaître dans `dist/index.html` :
       grep -c 'jspdf\|html2canvas\|PerformanceChart\|BlogPostForm' dist/index.html */
  build: {
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              // Bibliothèques du premier rendu. Elles ne changent qu'à une
              // montée de version, alors que le code du club change à chaque
              // déploiement : les isoler garde ce gros morceau (~125 ko brotli)
              // dans le cache du navigateur d'un déploiement à l'autre.
              name: 'vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|axios|@tanstack|motion|motion-dom|motion-utils|framer-motion)[\\/]/,
              priority: 100,
            },
            {
              // Modules maison partagés entre l'accueil et les pages différées :
              // client API, données du club, manifeste des variantes photo. Tous
              // sont déjà nécessaires au premier écran — les laisser éclatés ne
              // faisait qu'ajouter des allers-retours.
              name: 'app-shared',
              test: /[\\/]src[\\/](api|data)[\\/]|[\\/]src[\\/]lib[\\/]cloudinary|[\\/]lucide-react[\\/]dist[\\/]esm[\\/]createLucideIcon/,
              priority: 50,
            },
          ],
        },
      },
    },
  },

  // `vite preview` sert le BUILD, pas les sources : c'est le seul moyen de
  // vérifier en local le découpage en morceaux ci-dessus avec de vraies données.
  // Il lui faut le même relais `/api` que le serveur de développement.
  preview: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  server: {
    // Le front appelle des URLs relatives « /api/... » (voir src/api/client.ts) :
    // Vite les relaie vers le backend. Requêtes same-origin => plus aucun souci
    // de CORS ni de résolution localhost/127.0.0.1/IPv6 dans le navigateur.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
