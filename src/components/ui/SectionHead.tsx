import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from './motion'

/**
 * En-tête de section : sur-titre + titre + lien « voir tout » optionnel.
 *
 * Vivait en local dans `HomePage`, et était réécrit à la main (avec des marges
 * et des graisses légèrement différentes) dans cinq autres pages. Source unique.
 * Le sur-titre passe par `.eyebrow` (cf. index.css), le titre par
 * `.section-title` : les deux suivent le ton du chapitre courant.
 */
export function SectionHead({
  eyebrow,
  title,
  subtitle,
  to,
  more,
  /** l'or plutôt que le rouge en sur-titre — réservé à l'excellence (records, palmarès) */
  tone = 'red',
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  to?: string
  more?: string
  tone?: 'red' | 'gold'
  /** contrôles alignés à droite (filtres segmentés…) */
  children?: ReactNode
}) {
  return (
    <Reveal className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className={`eyebrow ${tone === 'gold' ? 'text-club-accent-light' : ''}`}>{eyebrow}</p>
          )}
          <h2 className="section-title">{title}</h2>
          {subtitle && (
            <p className="mt-3 max-w-2xl leading-relaxed text-[color:var(--color-muted)]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Les contrôles ou le lien « voir tout », jamais les deux à la fois dans
            les faits — mais rien n'empêche de les combiner. */}
        {children}

        {to && (
          <Link
            to={to}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-club-primary-light transition hover:opacity-70"
          >
            {more ?? 'Voir tout'}
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        )}
      </div>
      {/* Filet Swiss : le séparateur principal du système. Il donne à chaque
          section son assise, ce qu'un simple écart vertical ne fait pas. */}
      <hr className="hairline mt-5" />
    </Reveal>
  )
}
