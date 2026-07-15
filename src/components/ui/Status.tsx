export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <span className="animate-pulse">{label}</span>
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
      <p className="text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}
