import { Link } from 'react-router-dom'
import { coverImageStyle, type BlogPostOut } from '../../api/types'
import { cldImage, cldSrcSet } from '../../lib/cloudinary'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Carte d'article.
 *
 * `layout='auto'` (défaut) = RANGÉE compacte (vignette carrée à gauche, date et
 * titre à droite) sous `sm`, carte verticale à partir de `sm` — un seul arbre
 * DOM, aucun hook de point de rupture. Sur mobile on passe ainsi de ~420 px par
 * article à ~110 px : la liste redevient scannable.
 *
 * `layout='card'` force la carte verticale à toutes les tailles : sert à
 * ponctuer une longue liste mobile (cf. BlogListPage).
 */
export function BlogCard({
  post,
  layout = 'auto',
}: {
  post: BlogPostOut
  layout?: 'auto' | 'card'
}) {
  const row = layout === 'auto'

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group card card-hover tap block h-full overflow-hidden ${row ? 'flex sm:block' : ''}`}
    >
      <div
        className={`relative overflow-hidden bg-[color:var(--color-surface-2)] ${
          row ? 'aspect-square w-24 shrink-0 sm:aspect-[16/10] sm:w-full' : 'aspect-[16/10] w-full'
        }`}
      >
        {post.cover_image_url ? (
          <img
            src={cldImage(post.cover_image_url, 800)}
            srcSet={cldSrcSet(post.cover_image_url, [400, 800, 1200], {
              crop: 'limit',
              quality: 'auto',
              format: 'auto',
            })}
            sizes="(max-width: 640px) 100vw, 400px"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            style={coverImageStyle(post.cover_position)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-club-primary/20 to-[color:var(--color-surface-2)]">
            <span
              className={`font-display font-bold text-club-primary-light/70 ${
                row ? 'text-2xl sm:text-5xl' : 'text-5xl'
              }`}
            >
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/70 via-transparent to-transparent" />
      </div>
      <div
        className={`min-w-0 flex-1 ${row ? 'flex flex-col justify-center p-3.5 sm:block sm:p-5' : 'p-5'}`}
      >
        {post.published_at && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-club-primary-light sm:mb-2 sm:text-xs">
            {formatDate(post.published_at)}
          </p>
        )}
        <h3
          className={`font-display font-bold leading-snug text-white transition-colors group-hover:text-club-primary-light ${
            row
              ? 'line-clamp-2 text-[15px] sm:mb-2 sm:line-clamp-none sm:text-lg'
              : 'mb-2 line-clamp-2 text-lg'
          }`}
        >
          {post.title}
        </h3>
        {post.summary && (
          // En rangée le résumé est masqué : la vignette de 96 px ne laisse la
          // place qu'à la date et au titre. Il réapparaît en carte.
          <p
            className={`text-sm leading-relaxed text-slate-300 ${
              row ? 'hidden sm:line-clamp-3 sm:block' : 'line-clamp-3'
            }`}
          >
            {post.summary}
          </p>
        )}
      </div>
    </Link>
  )
}
