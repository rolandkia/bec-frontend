import { useEffect, useState } from 'react'

/** `short` : libellé de repli sous `sm`, où chaque item ne dispose que d'un quart
 *  de la largeur d'écran (« Notre histoire » y serait tronqué en « Notre hi… »). */
export type Anchor = { id: string; label: string; short?: string }

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
 *
 * MOBILE : contrôle `.segmented` en quatre colonnes égales, et non plus un rail
 * glissable. Le rail était un piège — rien n'annonçait qu'il fallait le faire
 * glisser, le dernier libellé était coupé au bord, et en ton clair quatre textes
 * gris posés sur le papier ne se lisaient pas comme un contrôle. Avec les
 * libellés courts, quatre colonnes tiennent dès 320 px : plus rien à découvrir,
 * et l'habillage de `.segmented` (piste, contour, pilule rouge, 44 px au doigt)
 * est déjà celui des onglets du reste du site.
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
    // `top-[3.5rem]` : juste sous la navbar compacte.
    // Fond à 95 % et non 90 % : cette barre est COLLANTE et le chapitre noir du
    // palmarès défile dessous. À 90 %, le fond composité tombait vers un gris
    // moyen et les libellés inactifs (`--color-muted`) passaient sous 4,5:1.
    <nav
      aria-label="Sections de la page"
      className="sticky top-[3.5rem] z-30 mb-8 border-y border-[color:var(--color-line)] bg-[color:var(--color-canvas)]/95 backdrop-blur-md sm:mb-14"
    >
      <div className="mx-auto flex max-w-6xl justify-center px-safe py-2">
        <div className="segmented">
          {anchors.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              aria-current={active === a.id ? 'true' : undefined}
              // Gabarit mobile mesuré au plus juste — « Partenaires » fait 40 %
              // de chasse en plus qu'« Équipe » :
              //  · `flex-auto` (et non le `flex-1` du contrôle) : les colonnes
              //    se partagent la place AU PRORATA du libellé, au lieu d'être
              //    égales et de tronquer le plus long tout en gaspillant sous le
              //    plus court ;
              //  · `tracking-normal` : l'interlettrage large coûtait 8 px par
              //    libellé, soit exactement ce qui manquait ;
              //  · `min(11px, 3vw)` : sous 366 px la police suit la largeur, ce
              //    qui fait tenir les quatre libellés en entier dès 320 px.
              className="tap flex-auto px-1.5 text-[min(11px,3vw)] uppercase tracking-normal sm:flex-none sm:px-4 sm:text-xs sm:tracking-[0.12em]"
            >
              <span className="truncate sm:hidden">{a.short ?? a.label}</span>
              <span className="hidden truncate sm:inline">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
