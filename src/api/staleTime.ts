/**
 * Durées de fraîcheur par famille de données, en un seul endroit.
 *
 * Pourquoi ce fichier : la VM est en `us-east1` et le public du club à Bordeaux,
 * soit ~110 ms d'aller-retour par requête, sans HTTP/2 ni CDN. Le `staleTime`
 * par défaut de 30 s faisait refetcher l'effectif et les classements à chaque
 * navigation entre l'accueil et /athletes, pour des données qui ne changent
 * qu'au lancement manuel de `sync_db.py` sur la VM.
 *
 * Les valeurs sont alignées sur les en-têtes `Cache-Control` du backend
 * (`src/api/http_cache.py`) : mêmes deux profils, même raisonnement. Le cache
 * HTTP couvre les rechargements de page, `staleTime` couvre la navigation
 * interne. L'un ne remplace pas l'autre.
 */

/** Effectif et classements : changent au sync FFA, hebdomadaire au mieux. */
export const STATIC_DATA = 10 * 60_000

/** Articles et calendrier : édités depuis les pages d'admin, donc plus court. */
export const EDITED_DATA = 60_000
