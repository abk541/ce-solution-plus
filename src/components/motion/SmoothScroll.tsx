'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Drives Lenis from GSAP's ticker so smooth scrolling and ScrollTrigger share a
 * single RAF loop — otherwise triggers fire against a stale scroll position.
 * Disabled entirely under prefers-reduced-motion (native scrolling takes over).
 */
export function SmoothScroll() {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -11 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 0.85,
    });

    lenis.on('scroll', ScrollTrigger.update);

    // Lenis only emits for scrolls it drives. Anything that moves the document
    // natively — hash navigation, scroll restoration, find-in-page, keyboard,
    // assistive tech — would otherwise leave every trigger on a stale position.
    const syncNative = () => ScrollTrigger.update();
    window.addEventListener('scroll', syncNative, { passive: true });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // In-page anchors must go through Lenis or they jump past the smooth loop.
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

    // Pins and scrubs are measured at mount, before webfonts swap and before
    // below-the-fold imagery reserves its space. Without these refreshes every
    // pinned section ends up anchored to a stale position.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    const settle = window.setTimeout(refresh, 600);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      window.removeEventListener('scroll', syncNative);
      window.removeEventListener('load', refresh);
      window.clearTimeout(settle);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
