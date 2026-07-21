// Type et point d'accès des membres du bureau (organigramme).
// Les DONNÉES (noms, descriptions, photos Cloudinary) sont générées dans
// `bureau.generated.ts` à partir du manifeste du script backend :
//   cd bec-backend
//   PYTHONPATH=. uv run python src/scripts/upload_profile_picture.py
// Ne pas éditer les données à la main : modifier le manifeste puis relancer le script.

export type MembreBureau = {
  role: string
  prenom: string
  nom: string
  description?: string
  photo?: string
}

export { bureau } from './bureau.generated'
