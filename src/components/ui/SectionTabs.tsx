import { useSearchParams } from 'react-router-dom'

export type TabDef = { key: string; label: string }

/**
 * Onglet actif synchronisé avec l'URL (`?tab=...`) : partageable, rechargeable
 * et adressable en lien profond (ex. `/competitions?tab=records`).
 *
 * Sert aussi aux FILTRES d'une vue (`?sexe=femme` sur /athletes) : même besoin
 * d'URL partageable, mais eux ne remontent pas la page — cf. `scrollTop`.
 */
export function useTabParam(
  defaultKey: string,
  paramName = 'tab',
  /**
   * Remonter en haut de page au changement. Vrai pour un onglet (il change tout
   * le contenu sous lui), faux pour un filtre : on ne téléporte pas quelqu'un
   * qui affine sa liste au milieu du défilement.
   */
  { scrollTop = true }: { scrollTop?: boolean } = {},
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = searchParams.get(paramName) ?? defaultKey

  const setActive = (key: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        // On garde l'URL propre : pas de paramètre pour l'onglet par défaut.
        if (key === defaultKey) next.delete(paramName)
        else next.set(paramName, key)
        return next
      },
      { replace: true },
    )
    // La barre d'onglets est en haut de page : changer d'onglet depuis le bas
    // d'une longue liste ne doit pas laisser l'utilisateur au milieu du nouveau
    // contenu. (`ScrollToTop` ne réagit qu'au `pathname`, pas à `?tab=`.)
    if (scrollTop) window.scrollTo({ top: 0, left: 0 })
  }

  return [active, setActive] as const
}

/** Barre d'onglets « pilule », style partagé avec l'accueil et la galerie. */
export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    // `.segmented` : cibles de 44 px au doigt, pleine largeur sur mobile, état
    // actif annoncé par aria-selected, et bordure alignée sur --color-line.
    // `sm:w-fit` : le `w-auto` de `.segmented` étirait la pilule sur toute la
    // largeur dès qu'elle n'était pas elle-même un enfant de flex (cas ici).
    <div className="segmented mb-8 sm:w-fit" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
