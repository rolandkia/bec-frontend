#!/usr/bin/env node
/**
 * Génère les VARIANTES DE LARGEUR des photos éditoriales de `public/photos`, et
 * le manifeste que le front consulte pour en construire ses `srcset`.
 *
 * Pourquoi : les photos sont servies en UNE seule largeur, celle du plus grand
 * écran possible. Le hero de l'accueil fait 2 400 px de large et 171 ko pour un
 * téléphone de 412 px, qui n'en affichera jamais plus de ~1 080 px de large. Sur
 * l'accueil complet, mesuré sur un Pixel 7 en 4G, cela donne 1 737 ko d'images
 * pour 193 ko de JavaScript : les images sont 90 % du poids de la page, et la
 * moitié de ces octets sont jetés par le navigateur au redimensionnement.
 *
 * `sitePhotoSrcSet` (src/lib/cloudinary.ts) livrait déjà des largeurs multiples
 * quand les photos passent par Cloudinary — mais elles n'y sont pas encore. Ce
 * script apporte le même bénéfice SANS dépendance externe ni compte à
 * configurer : les variantes sont des fichiers ordinaires, commités, servis par
 * le même Caddy avec les mêmes en-têtes de cache.
 *
 * Disposition retenue : un DOSSIER PAR LARGEUR, en miroir de l'arborescence
 * (`public/photos/w640/gallery/race-1.webp`), et non un suffixe de nom
 * (`race-1-640w.webp`). Deux raisons :
 *   - la traduction chemin → variante est un simple préfixe, donc sans regex ni
 *     analyse de nom à l'exécution ;
 *   - l'invariant « aucun fichier orphelin » de public/photos/README.md porte sur
 *     `public/photos/*.webp`, qu'un dossier séparé laisse intact — et le ménage
 *     complet est un `rm -rf public/photos/w*`.
 *
 * Usage :
 *   node scripts/photo-variants.mjs          # génère ce qui manque
 *   node scripts/photo-variants.mjs --force  # réencode tout
 *   node scripts/photo-variants.mjs --check  # vérifie sans écrire (code 1 si à refaire)
 *
 * Prérequis : `cwebp` et `webpinfo` (libwebp — `brew install webp`). Ils ne sont
 * PAS nécessaires au build : les variantes et le manifeste sont commités, donc
 * l'image Docker (node:22-alpine, sans libwebp) n'a rien à générer.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, existsSync, statSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PHOTOS = join(ROOT, 'public/photos')
const MANIFEST = join(ROOT, 'src/data/photoVariants.ts')

/**
 * L'échelle de largeurs, alignée sur les surfaces RÉELLES du site (les `sizes`
 * passés à `sitePhotoProps`) :
 *   384  vignette de bande (256 px à 1,5×), portrait d'organigramme, logo ;
 *   640  téléphone en pleine largeur à 1,5×, portrait à 2× ;
 *   768  vignette de bande sur un écran DENSE — 256 px à 2,6× font 672 px, et
 *        sans cette marche le navigateur saute à 1280, soit 70 ko pour une
 *        image affichée sur 256 px. C'est la marche qui a fait la moitié du
 *        gain sur l'accueil, dont la bande de photos compte quarante entrées ;
 *   1024 photo de contenu en pleine largeur sur téléphone dense (412 px à 2,6×
 *        demandent ~1 080 px) : sans cette marche, toute source de 1 100 à
 *        1 300 px est servie ENTIÈRE, l'original étant alors le seul candidat
 *        assez grand — c'est ce qui faisait descendre 319 ko pour une tuile de
 *        380 px de large ;
 *   1280 hero en pleine largeur sur téléphone dense, sources larges ;
 *   1920 grand écran en pleine largeur — seulement pour les sources qui vont
 *        au-delà, c'est-à-dire les quelques bandeaux à 2 200+ px.
 * L'original reste toujours la dernière marche du `srcset`.
 */
const LADDER = [384, 640, 768, 1024, 1280, 1920]

/** Sous ce rapport, la variante ne vaut pas le fichier de plus : une réduction
 *  de moins de 15 % ne change pas l'ordre de grandeur du poids. */
const MIN_GAIN = 1.15

const force = process.argv.includes('--force')
const check = process.argv.includes('--check')

/** Chemins relatifs de toutes les photos sources (hors dossiers de variantes). */
function sources(dir = PHOTOS, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (/^w\d+$/.test(entry.name)) continue // dossier de variantes
      sources(full, out)
    } else if (entry.name.endsWith('.webp')) {
      out.push(relative(PHOTOS, full))
    }
  }
  return out
}

function widthOf(file) {
  const info = execFileSync('webpinfo', [file], { encoding: 'utf8' })
  const m = /^\s*Width:\s*(\d+)/m.exec(info)
  if (!m) throw new Error(`largeur illisible : ${file}`)
  return Number(m[1])
}

const manifest = {}
let written = 0
let missing = 0

for (const rel of sources().sort()) {
  const src = join(PHOTOS, rel)
  const w = widthOf(src)
  const variants = []

  for (const target of LADDER) {
    if (target * MIN_GAIN > w) continue
    const out = join(PHOTOS, `w${target}`, rel)
    variants.push(target)
    const fresh =
      !force && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs
    if (fresh) continue
    if (check) {
      missing++
      console.error(`À GÉNÉRER  ${relative(ROOT, out)}`)
      continue
    }
    mkdirSync(dirname(out), { recursive: true })
    // -q 78 et non 74 (la qualité des sources, cf. public/photos/README.md) :
    // ces variantes sont RÉ-ENCODÉES depuis un webp déjà compressé, et deux
    // passes à qualité égale cumulent leurs artefacts. La réduction de taille
    // masque de toute façon l'essentiel — mesuré sans différence visible à
    // 100 % sur les visages, qui sont le sujet de presque toutes ces photos.
    execFileSync('cwebp', ['-quiet', '-q', '78', '-resize', String(target), '0', src, '-o', out])
    written++
  }

  // Nettoie une variante devenue inutile (source réduite entre deux passes).
  for (const target of LADDER) {
    if (variants.includes(target)) continue
    const stale = join(PHOTOS, `w${target}`, rel)
    if (existsSync(stale) && !check) rmSync(stale)
  }

  manifest[`/photos/${rel.split('/').join('/')}`] = { w, variants }
}

const body = `/* FICHIER GÉNÉRÉ — ne pas éditer à la main.
 *
 * Produit par \`node scripts/photo-variants.mjs\`, qui écrit en même temps les
 * fichiers \`public/photos/w<largeur>/…\` décrits ici. Le lire est le seul moyen
 * pour \`sitePhotoSrcSet\` de connaître (a) les largeurs réellement disponibles
 * et (b) la largeur INTRINSÈQUE de l'original, sans laquelle le dernier
 * descripteur \`w\` du \`srcset\` serait deviné — et un descripteur faux fait
 * choisir au navigateur une image trop petite, donc floue.
 *
 * Régénérer après tout ajout, remplacement ou suppression dans public/photos.
 */

/** Largeur intrinsèque de chaque photo éditoriale et variantes disponibles. */
export const PHOTO_VARIANTS: Record<string, { w: number; variants: readonly number[] }> = ${JSON.stringify(
  manifest,
  null,
  2,
)}
`

if (check) {
  const current = existsSync(MANIFEST)
    ? await import('node:fs').then((fs) => fs.readFileSync(MANIFEST, 'utf8'))
    : ''
  if (current !== body) {
    console.error('MANIFESTE à régénérer : src/data/photoVariants.ts')
    missing++
  }
  if (missing) {
    console.error(`\n${missing} élément(s) à régénérer — lancer sans --check.`)
    process.exit(1)
  }
  console.log('variantes et manifeste à jour.')
} else {
  writeFileSync(MANIFEST, body)
  const count = Object.values(manifest).reduce((n, m) => n + m.variants.length, 0)
  console.log(
    `${Object.keys(manifest).length} photos · ${count} variantes (${written} (ré)encodées) · manifeste écrit.`,
  )
}
