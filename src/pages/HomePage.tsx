import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { club } from '../data/club'
import { events } from '../data/events'
import { splitEvents } from '../utils/events'
import { EventRow } from '../components/calendar/EventRow'
import { getClassements } from '../api/athletes'
import type { ClassementParDiscipline, Sexe } from '../api/types'
import { currentSaison } from '../utils/saison'
import { DisciplinePodium } from '../components/athletes/DisciplinePodium'
import { listBlogs } from '../api/blogs'
import { BlogCard } from '../components/blog/BlogCard'
import { Loading, ErrorMessage } from '../components/ui/Status'

// Disciplines mises en avant sur l'accueil, dans l'ordre d'affichage.
const DISCIPLINES_ACCUEIL = ['100m', '200m', '400m', '400m haies']

export function HomePage() {
  const [sexe, setSexe] = useState<Sexe>('homme')
  const [periode, setPeriode] = useState<'absolu' | 'saison'>('absolu')

  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blogs'],
    queryFn: listBlogs,
  })

  const classementsQuery = useQuery({
    queryKey: ['classements', 'home', sexe, periode],
    queryFn: () =>
      getClassements({
        sexe,
        homologue: true,
        saison: periode === 'saison' ? currentSaison() : undefined,
      }),
  })

  const { upcoming } = splitEvents(events)
  const prochaines = upcoming.slice(0, 4)

  const byDiscipline = new Map(
    (classementsQuery.data ?? []).map((d) => [d.discipline, d]),
  )
  const podiums = DISCIPLINES_ACCUEIL.map((disc) => byDiscipline.get(disc)).filter(
    (d): d is ClassementParDiscipline => d !== undefined && d.classement.length > 0,
  )

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-club-primary-light via-club-primary to-[#a5141d] px-6 py-16 text-center text-white shadow-xl shadow-club-primary/20 sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-club-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full border-[14px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full border-[14px] border-club-accent/20" />
        <div className="relative">
          <span className="badge bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
            🏅 Club d'athlétisme · Bordeaux
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
            {club.nom}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{club.accroche}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/athletes" className="btn-accent">
              Découvrir les athlètes
            </Link>
            <Link
              to="/calendrier"
              className="btn bg-white/10 text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/20"
            >
              Voir le calendrier
            </Link>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {club.chiffresCles.map((c) => (
          <div key={c.label} className="card card-hover p-6 text-center">
            <p className="font-display text-4xl font-bold text-club-primary dark:text-club-primary-light">
              {c.valeur}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
          </div>
        ))}
      </section>

      {/* Calendrier + Classement */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Prochaines compétitions */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="section-title">Prochaines compétitions</h2>
            <Link
              to="/calendrier"
              className="text-sm font-semibold text-club-primary transition hover:underline dark:text-club-primary-light"
            >
              Tout le calendrier →
            </Link>
          </div>
          {prochaines.length > 0 ? (
            <div className="space-y-3">
              {prochaines.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Aucune compétition à venir pour le moment.
            </p>
          )}
        </section>

        {/* Classement du club */}
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="section-title">Classement du club</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
                {(['homme', 'femme'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSexe(s)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      sexe === s
                        ? 'bg-club-primary text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {s === 'homme' ? 'Hommes' : 'Femmes'}
                  </button>
                ))}
              </div>
              <div className="flex rounded-full border border-slate-200 p-0.5 dark:border-slate-800">
                {(['absolu', 'saison'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriode(p)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      periode === p
                        ? 'bg-club-primary text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p === 'absolu' ? 'All-time' : 'Saison'}
                  </button>
                ))}
              </div>
              <Link
                to="/records"
                className="text-sm font-semibold text-club-primary transition hover:underline dark:text-club-primary-light"
              >
                Records →
              </Link>
            </div>
          </div>

          {classementsQuery.isLoading && <Loading />}
          {classementsQuery.isError && (
            <ErrorMessage message="Impossible de charger le classement." />
          )}
          {classementsQuery.data && podiums.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Aucun classement disponible pour le moment.
            </p>
          )}
          {podiums.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {podiums.map((group) => (
                <DisciplinePodium key={group.discipline} group={group} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Valeurs */}
      <section>
        <h2 className="section-title mb-5">Nos valeurs</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {club.valeurs.map((v) => (
            <div key={v.titre} className="card card-hover p-6">
              <h3 className="mb-2 font-display text-lg font-bold text-club-primary dark:text-club-primary-light">
                {v.titre}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Derniers articles */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title">Derniers articles</h2>
          <Link
            to="/blog"
            className="text-sm font-semibold text-club-primary transition hover:underline dark:text-club-primary-light"
          >
            Tout le blog →
          </Link>
        </div>
        {isLoading && <Loading />}
        {isError && <ErrorMessage message="Impossible de charger les articles." />}
        {posts && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Aucun article publié pour le moment.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
