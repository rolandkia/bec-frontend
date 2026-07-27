import { useSearchParams } from 'react-router-dom'

export type TabDef = { key: string; label: string }

/**
 * Onglet actif synchronisé avec l'URL (`?tab=...`) : partageable, rechargeable
 * et adressable en lien profond (ex. `/competitions?tab=records`).
 */
export function useTabParam(defaultKey: string, paramName = 'tab') {
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
    <div className="segmented mb-8" role="tablist">
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
