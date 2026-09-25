/* Pré-compression des fichiers statiques, exécutée au BUILD.
 *
 * Pourquoi : Caddy compresse aujourd'hui à la volée (`encode zstd gzip`). À la
 * volée, un serveur est obligé de viser un niveau rapide — sinon il ferait
 * attendre chaque requête — et il recompresse le MÊME fichier à chaque visiteur.
 * Sur un e2-micro à 1 vCPU partagé, ce travail se dispute le processeur avec
 * gunicorn.
 *
 * Compresser une fois pour toutes pendant le build lève les deux contraintes :
 * on peut pousser au niveau maximal (brotli 11, zstd 19), et le serveur n'a plus
 * qu'à lire un fichier sur le disque. Mesuré sur le chemin du premier rendu :
 *   zstd à la volée (aujourd'hui, en prod) : 200 691 o
 *   brotli 11 pré-calculé                  : 163 177 o   soit -18,7 %
 *
 * Brotli SANS greffon : le Caddyfile notait qu'ajouter brotli demanderait une
 * image Caddy sur mesure. C'est vrai de l'ENCODEUR (`encode br`), pas du
 * service de fichiers : `file_server { precompressed br … }` se contente de
 * SERVIR un `.br` déjà présent à côté de l'original. On obtient donc le meilleur
 * taux de compression du web sans quitter l'image officielle.
 *
 * zstd et gzip sont générés en repli (zstd pour les navigateurs qui le
 * préfèrent, gzip pour les très vieux clients). Caddy choisit selon l'en-tête
 * `Accept-Encoding` du visiteur, dans l'ordre déclaré par le Caddyfile.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import * as zlib from 'node:zlib'

const { brotliCompressSync, gzipSync, constants } = zlib

const DIST = 'dist'

// Seuls les formats TEXTE y gagnent. Les .webp/.png/.jpg/.woff2 sont déjà des
// formats compressés : les repasser au brotli coûte du temps de build et de
// l'espace disque pour un gain nul, voire un fichier plus gros.
const COMPRESSIBLE = new Set(['.js', '.css', '.html', '.svg', '.json', '.txt', '.xml', '.map'])

// En dessous, l'en-tête de réponse et le coût de décompression annulent le gain.
const MIN_BYTES = 1024

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

const encoders = [
  ['.br', (b) => brotliCompressSync(b, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: b.length,
    },
  })],
  ['.gz', (b) => gzipSync(b, { level: 9 })],
]

// zstd n'est arrivé dans `node:zlib` qu'en Node 22.15 / 24. Le Dockerfile fixe
// Node 24, mais un build lancé sur un poste plus ancien ne doit pas échouer pour
// autant : brotli couvre déjà tous les navigateurs modernes et gzip le reste.
// L'absence de `.zst` ne fait que retirer une option à Caddy.
if (typeof zlib.zstdCompressSync === 'function') {
  encoders.splice(1, 0, [
    '.zst',
    (b) => zlib.zstdCompressSync(b, { params: { [constants.ZSTD_c_compressionLevel]: 19 } }),
  ])
} else {
  console.warn('précompression : zstd indisponible sur ce Node, .zst ignoré')
}

let files = 0
const total = { raw: 0, '.br': 0, '.zst': 0, '.gz': 0 }

for await (const file of walk(DIST)) {
  const ext = extname(file)
  if (!COMPRESSIBLE.has(ext)) continue
  if ((await stat(file)).size < MIN_BYTES) continue

  const raw = await readFile(file)
  files += 1
  total.raw += raw.length

  for (const [suffix, encode] of encoders) {
    const out = encode(raw)
    // Un fichier déjà dense peut ressortir plus gros. On ne l'écrit pas : Caddy
    // servira simplement l'original, ce qui est la bonne réponse.
    if (out.length >= raw.length) continue
    await writeFile(file + suffix, out)
    total[suffix] += out.length
  }
}

const pct = (n) => `${(100 - (n / total.raw) * 100).toFixed(1)} %`
console.log(
  `précompression : ${files} fichiers, ${total.raw} o bruts\n` +
    `  brotli-11 ${total['.br']} o (-${pct(total['.br'])})\n` +
    `  zstd-19   ${total['.zst']} o (-${pct(total['.zst'])})\n` +
    `  gzip-9    ${total['.gz']} o (-${pct(total['.gz'])})`,
)
