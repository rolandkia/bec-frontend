import { useState } from 'react'
import { isAxiosError } from 'axios'
import { CircleCheck, Send } from 'lucide-react'
import { envoyerDemande } from '../../api/contact'
import type { MotifDemande } from '../../api/types'
import { club } from '../../data/club'

// Libellés courts : dans un `.segmented` pleine largeur sur un écran de 375 px,
// chaque bouton fait ~115 px et le texte est tronqué au-delà.
const MOTIFS: { key: MotifDemande; label: string; cta: string; placeholder: string }[] = [
  {
    key: 'inscription',
    label: 'Inscription',
    cta: 'Envoyer ma demande',
    placeholder:
      "Ton âge, ta discipline (ou celle qui t'attire), ton expérience en athlétisme, et le créneau qui t'arrangerait.",
  },
  {
    key: 'question',
    label: 'Question',
    cta: 'Envoyer ma question',
    placeholder: 'Tarifs, horaires, catégories, essai gratuit… dis-nous ce que tu veux savoir.',
  },
  {
    key: 'autre',
    label: 'Autre',
    cta: 'Envoyer ma demande',
    placeholder: 'Partenariat, presse, mise à disposition du stade… explique-nous ta demande.',
  },
]

const MESSAGE_MIN = 10
const MESSAGE_MAX = 4000

// Même expression que côté backend (`dto/demande_dto.py`) : on vérifie la forme,
// pas l'existence de la boîte. Extraite en constante parce qu'elle ne s'applique
// plus qu'au champ rempli, l'e-mail étant devenu facultatif.
const EMAIL_RE = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/

// Champs tokenisés (pas les classes `slate` des formulaires d'admin) : ce
// formulaire est public et vit sur le thème sombre du site.
const inputClass =
  'w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-[color:var(--color-fg)] placeholder:text-[color:var(--color-muted)]/60 transition focus:border-club-primary focus:outline-none focus:ring-2 focus:ring-club-primary/30'

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]'

/**
 * Formulaire de demande unique — inscription, question ou autre. Le motif
 * choisi adapte l'intitulé du bouton et l'exemple du message : une seule
 * mécanique à maintenir plutôt qu'un formulaire par cas.
 *
 * Premier vrai `<form>` du site (les formulaires d'admin sont des `<div>` +
 * bouton) : la soumission au clavier (Entrée) fonctionne donc nativement.
 */
export function DemandeForm() {
  const [motif, setMotif] = useState<MotifDemande>('inscription')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [message, setMessage] = useState('')
  const [consentement, setConsentement] = useState(false)
  const [piege, setPiege] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const motifCourant = MOTIFS.find((m) => m.key === motif) ?? MOTIFS[0]

  function reset() {
    setMessage('')
    setError(null)
    setSent(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSending) return

    // Validation inline, en français, dans l'ordre des champs — le backend
    // revalide tout (les mêmes règles y sont portées par Pydantic).
    if (!prenom.trim() || !nom.trim()) {
      setError('Merci d’indiquer ton prénom et ton nom.')
      return
    }
    // Un seul moyen de contact suffit, mais il en faut un : sans e-mail ni
    // téléphone, le club reçoit le message sans pouvoir y répondre.
    if (!email.trim() && !telephone.trim()) {
      setError('Laisse-nous au moins un e-mail ou un téléphone pour qu’on puisse te répondre.')
      return
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setError('Merci d’indiquer une adresse e-mail valide.')
      return
    }
    if (message.trim().length < MESSAGE_MIN) {
      setError('Le message est un peu court, donne-nous quelques précisions.')
      return
    }
    if (!consentement) {
      setError('Merci d’accepter que nous utilisions tes coordonnées pour te répondre.')
      return
    }

    setIsSending(true)
    setError(null)
    try {
      await envoyerDemande({
        motif,
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        message: message.trim(),
        consentement,
        piege,
      })
      setSent(true)
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : `Envoi impossible pour le moment. Écris-nous directement à ${club.contact.email}.`,
      )
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    // La validation garantit qu'un des deux canaux est renseigné : on cite celui
    // que le visiteur a effectivement laissé, plutôt qu'un e-mail vide.
    const canal = email.trim() ? `à ${email.trim()}` : `au ${telephone.trim()}`
    return (
      <div className="flex flex-col items-start gap-4 py-4">
        <CircleCheck aria-hidden className="h-10 w-10 text-club-accent-light" strokeWidth={1.75} />
        <div>
          <h3 className="font-display text-xl font-bold text-white">Demande envoyée</h3>
          <p className="mt-2 max-w-md leading-relaxed text-[color:var(--color-muted)]">
            Merci {prenom.trim()}, nous te répondons {canal} sous quelques jours.
          </p>
        </div>
        <button type="button" className="btn-outline tap" onClick={reset}>
          Envoyer une autre demande
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <span className={labelClass}>Motif de la demande</span>
        {/* `.segmented` s'appuie sur aria-pressed pour l'état actif. */}
        <div className="segmented" role="group" aria-label="Motif de la demande">
          {MOTIFS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={motif === m.key}
              onClick={() => setMotif(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="demande-prenom">
            Prénom
          </label>
          <input
            id="demande-prenom"
            className={inputClass}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            autoComplete="given-name"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="demande-nom">
            Nom
          </label>
          <input
            id="demande-nom"
            className={inputClass}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="family-name"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="demande-email">
            E-mail
          </label>
          <input
            id="demande-email"
            type="email"
            inputMode="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            aria-describedby="demande-contact-hint"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="demande-telephone">
            Téléphone
          </label>
          <input
            id="demande-telephone"
            type="tel"
            inputMode="tel"
            className={inputClass}
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            autoComplete="tel"
            maxLength={30}
            aria-describedby="demande-contact-hint"
          />
        </div>
        {/* Ni l'un ni l'autre n'est obligatoire seul : la contrainte porte sur la
            paire, donc l'aide vit sous les deux champs plutôt que dans un label. */}
        <p
          id="demande-contact-hint"
          className="text-xs text-[color:var(--color-muted)] sm:col-span-2"
        >
          Renseigne au moins un moyen de contact, e-mail ou téléphone, pour qu'on puisse te
          répondre.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="demande-message">
          Message
        </label>
        <textarea
          id="demande-message"
          className={inputClass}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
          placeholder={motifCourant.placeholder}
          maxLength={MESSAGE_MAX}
          required
        />
        <p className="mt-1 text-right text-xs text-[color:var(--color-muted)]">
          {message.length} / {MESSAGE_MAX}
        </p>
      </div>

      {/* Leurre anti-robot : hors flux visuel et hors tabulation, mais présent
          dans le DOM. Rempli → le backend répond 202 sans rien envoyer. */}
      <div className="sr-only" aria-hidden>
        <label htmlFor="demande-site">Site web</label>
        <input
          id="demande-site"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={piege}
          onChange={(e) => setPiege(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-club-primary"
          checked={consentement}
          onChange={(e) => setConsentement(e.target.checked)}
        />
        <span>
          J'accepte que le BEC utilise ces informations pour me répondre. Elles ne sont pas
          conservées sur le site et ne sont transmises à personne d'autre.
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-club-primary/40 bg-club-primary/10 px-4 py-3 text-sm text-club-primary-light"
        >
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary tap" disabled={isSending}>
        {isSending ? 'Envoi en cours…' : motifCourant.cta}
        {!isSending && <Send aria-hidden className="h-4 w-4" strokeWidth={2} />}
      </button>
    </form>
  )
}
