import { useEffect, useRef } from 'react'

/** Observe un élément sentinelle et déclenche `onReachEnd` dès qu'il entre dans
 *  le viewport, tant que `enabled` est vrai. Renvoie la ref à poser sur la
 *  sentinelle (un <div /> vide en bas de liste). */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  onReachEnd: () => void,
  enabled: boolean,
) {
  const sentinelRef = useRef<T>(null)
  // La ref garde le dernier callback sans recréer l'observer à chaque rendu.
  const callbackRef = useRef(onReachEnd)
  callbackRef.current = onReachEnd

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !enabled) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current()
      },
      { rootMargin: '400px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return sentinelRef
}
