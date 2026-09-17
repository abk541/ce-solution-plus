'use client';

import { useEffect } from 'react';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
  useRichMotion,
} from '@/hooks/usePrefersReducedMotion';

/**
 * Drives Lenis from GSAP's ticker so smooth scrolling and ScrollTrigger share a
 * single RAF loop — otherwise triggers fire against a stale scroll position.
 * Disabled entirely under prefers-reduced-motion (native scrolling takes over).
 */
export function SmoothScroll() {
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const richMotion = useRichMotion();

  useIsomorphicLayoutEffect(() => {
    if (motionAllowed !== null) {
      document.documentElement.classList.toggle('motion-on', motionAllowed);
      document.documentElement.dataset.motionReady = 'true';
    }
  }, [motionAllowed]);

  useEffect(() => {
    // Native touch scrolling is both faster and more predictable than routing
    // phone gestures through Lenis + GSAP's ticker.
    if (reducedMotion || richMotion !== true) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    void import('lenis').then(({ default: Lenis }) => {
      if (disposed) return;

      const lenis = new Lenis({
        duration: 1.35,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -11 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
        wheelMultiplier: 0.85,
      });

      lenis.on('scroll', ScrollTrigger.update);

      // Lenis only emits for scrolls it drives. Anything that moves the
      // document natively must still refresh ScrollTrigger.
      const syncNative = () => ScrollTrigger.update();
      window.addEventListener('scroll', syncNative, { passive: true });

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const onAnchorClick = (event: MouseEvent) => {
        const target = (event.target as HTMLElement | null)?.closest('a[href^="#"]');
        if (!(target instanceof HTMLAnchorElement)) return;
        const hash = target.getAttribute('href');
        if (!hash || hash === '#') return;
        const destination = document.querySelector(hash);
        if (!destination) return;
        event.preventDefault();
        lenis.scrollTo(destination as HTMLElement, { offset: -12, duration: 1.5 });
        history.replaceState(null, '', hash);
      };

      document.addEventListener('click', onAnchorClick);

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener('load', refresh);
      document.fonts?.ready.then(refresh).catch(() => {});
      const settle = window.setTimeout(refresh, 600);

      teardown = () => {
        document.removeEventListener('click', onAnchorClick);
        window.removeEventListener('scroll', syncNative);
        window.removeEventListener('load', refresh);
        window.clearTimeout(settle);
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [reducedMotion, richMotion]);

  return null;
}
