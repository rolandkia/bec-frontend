import { useCallback, useEffect, useState } from 'react'

/**
 * Copie de secours d'un article EN COURS DE RÉDACTION, dans le navigateur.
 *
 * Rien n'était gardé entre deux enregistrements : un onglet fermé, une batterie
 * vide ou un retour arrière par erreur, et le texte tapé depuis le dernier
 * clic sur « Enregistrer » était perdu. La copie est écrite à chaque pause de
 * frappe tant que le formulaire diffère de la version enregistrée, effacée dès
 * que l'enregistrement réussit, et proposée à la réouverture.
 *
 * C'est une commodité PAR APPAREIL, jamais la source de vérité : le stockage
 * peut être absent (navigation privée, données bloquées) ou plein, d'où le
 * try/catch partout — sans lui, le formulaire marche simplement comme avant.
 */
export interface LocalDraft<T> {
  values: T
  /** `Date.now()` de la dernière écriture. */
  savedAt: number
}

/** Délai après la dernière frappe avant d'écrire (ms). */
const WRITE_DELAY = 700

function read<T>(key: string): LocalDraft<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraft<T>
    return parsed && typeof parsed.savedAt === 'number' && parsed.values ? parsed : null
  } catch {
    return null
  }
}

export function useLocalDraft<T>(key: string, values: T, dirty: boolean) {
  // Lu UNE fois, à l'ouverture : c'est l'état laissé par la séance précédente.
  const [found] = useState(() => read<T>(key))

  useEffect(() => {
    if (!dirty) return
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ values, savedAt: Date.now() }))
      } catch {
        // Stockage plein ou interdit : on renonce à la copie, pas à la saisie.
      }
    }, WRITE_DELAY)
    return () => window.clearTimeout(id)
  }, [key, values, dirty])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // idem
    }
  }, [key])

  return { found, clear }
}
