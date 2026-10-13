import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ARTICLE_TEMPLATES, type ArticleTemplate } from './templates'

/**
 * Choix d'un modèle d'article. Chaque carte montre le modèle LUI-MÊME, rendu
 * en miniature par les styles du Mag (`.blog-rendered`), consignes et cadres
 * photo compris : l'aperçu ne peut pas diverger de ce que le modèle produit.
 *
 * Même gabarit que le sélecteur de la galerie : feuille montante au téléphone,
 * dialogue centré dès sm.
 */
export function TemplatePicker({
  replacing,
  onChoose,
  onClose,
}: {
  /** L'article a déjà du contenu : le modèle le remplacera. */
  replacing: boolean
  onChoose: (template: ArticleTemplate) => void
  onClose: () => void
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Partir d’un modèle"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-surface)] shadow-xl sm:max-h-[85dvh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-line)] px-4 py-3">
          <h2 className="font-display text-xl font-bold text-[color:var(--color-fg)]">Partir d’un modèle</h2>
          <button
            type="button"
            aria-label="Fermer"
            className="tap flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-4 text-sm text-[color:var(--color-muted)]">
            Le modèle pose la structure, des consignes en grisé et des cadres photo. Ce que vous ne
            remplissez pas n’apparaît pas dans l’article publié.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {ARTICLE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChoose(t)}
                // Colonne flex : un <button> centre verticalement son contenu,
                // la miniature descendait quand la description était plus courte.
                className="group flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-line)] text-left outline-offset-2 transition hover:border-club-primary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-club-primary"
              >
                <div className="tpl-thumb" aria-hidden>
                  <div className="tpl-thumb-page blog-container">
                    <div className="blog-rendered tpl-preview" dangerouslySetInnerHTML={{ __html: t.html }} />
                  </div>
                </div>
                <div className="flex-1 border-t border-[color:var(--color-line)] px-4 py-3">
                  <p className="font-display text-lg font-bold leading-tight text-[color:var(--color-fg)] group-hover:text-club-primary-light">
                    {t.name}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {replacing && (
          <p className="border-t border-[color:var(--color-line)] px-4 py-3 text-sm text-[color:var(--color-muted)]">
            Le contenu actuel de l’article sera remplacé. Ctrl/⌘ + Z permet de revenir en arrière.
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
