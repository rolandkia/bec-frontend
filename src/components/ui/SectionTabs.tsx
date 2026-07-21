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
    <div className="mb-8 flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition sm:flex-none ${
            active === t.key
              ? 'bg-club-primary text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
