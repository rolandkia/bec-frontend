import { club } from '../../data/club'

export function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200/70 bg-white/60 text-sm text-slate-500 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-400">
      <div className="h-1 w-full bg-gradient-to-r from-club-primary via-club-accent to-club-primary" />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-display font-semibold text-club-primary dark:text-club-primary-light">
            {club.nom}
          </span>
        </p>
        <p>
          {club.contact.adresse} · {club.contact.email}
        </p>
      </div>
    </footer>
  )
}
