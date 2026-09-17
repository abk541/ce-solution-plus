'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const QUERY = '(prefers-reduced-motion: reduce)';

/** Lightweight, finite motion is available on every non-reduced device. */
export const MOTION_ALLOWED_QUERY = '(prefers-reduced-motion: no-preference)';

/**
 * Full page choreography is reserved for roomier layouts with a precise
 * pointer. Phones and touch-first tablets keep native scrolling and render
 * section content in its final state.
 */
export const FULL_MOTION_QUERY =
  '(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** The WebGL field and entry curtain are desktop-only enhancements. */
export const RICH_MOTION_QUERY =
  '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/**
 * Touch-first choreography keeps native scrolling but still enables the
 * lightweight canvas, scroll-depth and carousel-focus effects authored for
 * phones and tablets.
 */
export const COMPACT_MOTION_QUERY =
  '(max-width: 1023px) and (prefers-reduced-motion: no-preference), (hover: none) and (prefers-reduced-motion: no-preference), (pointer: coarse) and (prefers-reduced-motion: no-preference)';

function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** `null` only during SSR/the first hydration pass. */
export function useFullMotion(): boolean | null {
  return useMediaQuery(FULL_MOTION_QUERY);
}

/** Loader, short reveals, and state transitions; safe for touch devices. */
export function useMotionAllowed(): boolean | null {
  return useMediaQuery(MOTION_ALLOWED_QUERY);
}

/** `null` only during SSR/the first hydration pass. */
export function useRichMotion(): boolean | null {
  return useMediaQuery(RICH_MOTION_QUERY);
}

/** `null` only during SSR/the first hydration pass. */
export function useCompactMotion(): boolean | null {
  return useMediaQuery(COMPACT_MOTION_QUERY);
}

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
