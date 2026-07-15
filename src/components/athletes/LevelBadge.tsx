import { niveauTier } from '../../utils/niveau'

function Chevron() {
  return (
    <svg viewBox="0 0 10 8" aria-hidden className="h-2 w-2.5" fill="currentColor">
      <path d="M5 0 L10 8 H0 Z" />
    </svg>
  )
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3" fill="currentColor">
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}

/**
 * Badge de niveau FFA (R1, N3, IA…) avec un emblème qui monte en gamme :
 * plus le niveau est haut, plus la couleur/effet est marqué et le nombre de
 * chevrons cumulés élevé, l'international ajoutant une étoile dorée.
 */
export function LevelBadge({
  niveau,
  className = '',
}: {
  niveau: string
  className?: string
}) {
  const tier = niveauTier(niveau)

  return (
    <span
      className={`badge ${tier.className} ${className}`}
      title={`Niveau ${niveau}`}
    >
      <span className="font-bold leading-none">{niveau}</span>
      {tier.chevrons > 0 && (
        <span className="flex items-center gap-px" aria-hidden>
          {Array.from({ length: tier.chevrons }).map((_, i) => (
            <Chevron key={i} />
          ))}
        </span>
      )}
      {tier.star && <Star />}
    </span>
  )
}
