'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';

import { gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

type ParallaxProps = {
  children: ReactNode;
  /** Total vertical travel as a percentage of the element's height. */
  amount?: number;
  className?: string;
};

/**
 * Scrubbed vertical drift for full-bleed image panels. The inner wrapper is
 * over-scaled so the drift never exposes an edge.
 */
export function Parallax({ children, amount = 12, className = '' }: ParallaxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-parallax-inner]',
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [reducedMotion, amount]);

  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`}>
      <div
        data-parallax-inner=""
        className="absolute inset-0 h-[118%] -translate-y-[9%] will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
