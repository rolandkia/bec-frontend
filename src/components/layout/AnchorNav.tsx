import { useEffect, useState } from 'react'

export type Anchor = { id: string; label: string }

/**
 * Sous-navigation COLLANTE à ancres, pour une page longue qui se lit d'un seul
 * scroll (/club : histoire → palmarès → équipe → partenaires).
 *
 * Pourquoi des ancres et non des onglets `?tab=` comme ailleurs sur le site :
 * ces quatre sections forment un RÉCIT continu. Des onglets en cacheraient trois
 * quarts et casseraient la lecture ; ici la barre sert de repère de progression,
 * pas d'interrupteur.
 *
 * La section active est détectée par `IntersectionObserver` (aucun écouteur de
 * scroll, donc aucun travail par frame). `rootMargin` haut négatif : une section
 * n'est « active » qu'une fois passée sous la navbar collante, sinon les deux
 * premières se disputaient l'état pendant tout le défilement.
 */
export function AnchorNav({ anchors }: { anchors: Anchor[] }) {
  const [active, setActive] = useState(anchors[0]?.id ?? '')

  useEffect(() => {
    const targets = anchors
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // La section la plus haute encore visible gagne : en descendant, deux
        // sections se croisent dans la fenêtre et la dernière entrée reçue n'est
        // pas forcément celle qu'on lit.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [anchors])

  return (
    // `top-[3.5rem]` : juste sous la navbar compacte. Rail glissable au doigt —
    // quatre libellés ne tiennent pas sur 375 px.
    // Fond à 95 % et non 90 % : cette barre est COLLANTE et le chapitre noir du
    // palmarès défile dessous. À 90 %, le fond composité tombait vers un gris
    // moyen et les libellés inactifs (`--color-muted`) passaient sous 4,5:1.
    <nav
      aria-label="Sections de la page"
      className="sticky top-[3.5rem] z-30 mb-14 border-y border-[color:var(--color-line)] bg-[color:var(--color-canvas)]/95 backdrop-blur-md"
    >
      <div className="rail mx-auto flex max-w-6xl gap-1 overflow-x-auto px-safe py-2">
        {anchors.map((a) => (
          <a
            key={a.id}
            href={`#${a.id}`}
            aria-current={active === a.id ? 'true' : undefined}
            className={`tap rail-item shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              active === a.id
                ? 'bg-club-primary text-white'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]'
            }`}
          >
            {a.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
