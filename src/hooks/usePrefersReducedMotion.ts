'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns `true` once the client confirms the user prefers reduced motion.
 * Always `false` during SSR and the first render so hydration stays stable.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
