import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { faitsPalmares, figureActuelle, figureHistorique, histoireIntro } from '../data/palmares'
import { FigureCard } from '../components/club/FigureCard'
import { PalmaresTimeline } from '../components/club/PalmaresTimeline'
import { Reveal } from '../components/ui/motion'

export function PalmaresPage() {
  return (
    <div className="animate-rise space-y-16">
      {/* En-tête éditorial */}
      <div className="band border border-[color:var(--color-line)]">
        <img
          src="/photos/podium-02.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)] via-[color:var(--color-ink)]/85 to-[color:var(--color-ink)]/40" />
        <div className="relative px-6 py-9 sm:px-10 sm:py-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-accent-light">
            Depuis 1903
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Histoire &amp; palmarès
          </h1>
          <p className="mt-3 max-w-xl text-[color:var(--color-muted)]">
            Une championne olympique, des champions d'Europe, et un finaliste olympique en 2024.
          </p>
        </div>
      </div>

      {/* Le club aujourd'hui, AVANT l'histoire : un visiteur qui arrive ici veut
          d'abord savoir où en est le club, pas dérouler un siècle d'archives.
          L'encart sert donc de porte d'entrée vers la partie historique. */}
      <section>
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
            Aujourd'hui
          </p>
          <h2 className="section-title">Le palmarès s'écrit encore</h2>
        </div>
        <Reveal>
          <FigureCard figure={figureActuelle} />
        </Reveal>
      </section>

      {/* La championne olympique du club, en miroir de l'encart « Aujourd'hui » :
          photo à droite, pour donner un rythme entre les deux portraits. Elle
          n'existait jusqu'ici que sous forme de texte (une ligne de frise, une
          phrase d'intro) alors que c'est le plus grand titre du palmarès. */}
      <section>
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-accent-light">
            1968
          </p>
          <h2 className="section-title">La championne olympique du club</h2>
        </div>
        <Reveal direction="left">
          <FigureCard figure={figureHistorique} imageSide="right" />
        </Reveal>
      </section>

      {/* Introduction — split texte + photo (même gabarit que « Notre histoire »
          de la page Club, pour que les deux pages se répondent). */}
      <section>
        <div className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal className="flex flex-col justify-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-primary-light">
              Notre histoire
            </p>
            <h2 className="section-title mb-4">Le doyen des clubs universitaires français</h2>
            <p className="max-w-2xl leading-relaxed text-[color:var(--color-muted)]">
              {histoireIntro}
            </p>
          </Reveal>
          <Reveal
            direction="left"
            className="band relative min-h-[260px] border border-[color:var(--color-line)]"
          >
            <img
              src="/photos/race-wide.webp"
              alt="Athlètes du club en course"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/70 to-transparent" />
          </Reveal>
        </div>
      </section>

      {/* Frise du palmarès */}
      <section>
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-club-accent-light">
            Les grandes dates
          </p>
          <h2 className="section-title">Faits marquants</h2>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
            En or, les titres et médailles internationaux.
          </p>
        </div>
        <PalmaresTimeline faits={faitsPalmares} />
      </section>

      {/* Liaison vers les performances d'aujourd'hui et l'inscription */}
      <section>
        <hr className="rule-gold mb-8" />
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl leading-relaxed text-[color:var(--color-muted)]">
            Les records du club continuent de tomber, saison après saison. Et la prochaine ligne de
            ce palmarès reste à écrire.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/athletes?tab=records" className="btn-ffa">
              Les records du club
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link to="/contact" className="btn-primary">
              Nous rejoindre
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
