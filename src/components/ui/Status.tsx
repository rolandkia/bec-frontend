export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-[color:var(--color-muted)]">
      <span className="animate-pulse">{label}</span>
    </div>
  )
}

/**
 * Attente d'une PAGE entière (frontière `<Suspense>` de `Layout`), par
 * opposition à `<Loading>` qui attend une section déjà entourée de son contexte.
 *
 * Elle remplaçait la page par la ligne « Chargement… » centrée dans du vide :
 * l'en-tête et le pied de page restaient en place, et entre les deux il n'y
 * avait plus rien — le pied de page remontait donc d'un coup jusque sous la
 * navbar, puis redescendait quand la page arrivait. Deux sauts de mise en page
 * pour chaque première visite d'une rubrique.
 *
 * La silhouette ci-dessous est celle que TOUTES les pages de rubrique partagent
 * (`PageHero` puis une grille) : un bandeau, un titre, une grille de cartes.
 * Elle ne prétend pas deviner le contenu — elle tient la hauteur et donne le
 * rythme, ce qui suffit à supprimer les deux sauts.
 */
export function PageFallback() {
  return (
    <div className="pb-16" role="status" aria-label="Chargement de la page">
      {/* Barre indéterminée, en position fixe : le clic sur un lien de la nav
          doit être acquitté DANS la seconde, avant même que la silhouette ait un
          sens. `z-[60]` la met au-dessus de l'en-tête collant (z-50). */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
        <div className="loading-bar h-full w-full bg-gradient-to-r from-club-primary to-club-accent" />
      </div>

      {/* Bandeau de page. Il doit déborder les gouttières du conteneur comme le
          fait `PageHero`, sinon la silhouette est plus étroite que la page
          qu'elle annonce et le raccord se voit au moment du remplacement.
          La marge négative en `vw` est celle de `.chapter` (cf. index.css) —
          mais SANS son `padding-inline` compensatoire, qui repousserait ici le
          bloc vers l'intérieur puisque c'est le bloc lui-même qu'on veut large. */}
      <div
        className="skeleton h-[42vh] min-h-[260px] !rounded-none"
        style={{ marginInline: 'calc(50% - 50vw)' }}
      />

      <div className="mt-10 space-y-3">
        <div className="skeleton h-3.5 w-28" />
        <div className="skeleton h-9 w-2/3 max-w-sm" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton aspect-[4/5] w-full" />
            <div className="skeleton h-3.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ErrorMessage({
  message = "Une erreur est survenue.",
}: {
  message?: string
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {message}
    </div>
  )
}

export function NotFound({
  title = 'Introuvable',
  message = "Le contenu demandé n'existe pas.",
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <h1 className="mb-2 text-2xl font-semibold text-club-primary dark:text-club-primary-light">
        {title}
      </h1>
      <p className="text-[color:var(--color-muted)]">{message}</p>
    </div>
  )
}
