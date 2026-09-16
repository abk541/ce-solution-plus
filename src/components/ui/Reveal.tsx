'use client';

import type { ElementType, ReactNode } from 'react';
import { createElement, useRef } from 'react';

import { ease, gsap } from '@/lib/gsap';
import {
  useFullMotion,
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

type Variant = 'up' | 'clip' | 'scale-x' | 'fade';

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  variant?: Variant;
  delay?: number;
  duration?: number;
  /** Seconds between children when animating direct descendants. */
  stagger?: number;
  /** Viewport position that fires the reveal, in ScrollTrigger `start` syntax. */
  start?: string;
};

const FROM: Record<Variant, gsap.TweenVars> = {
  up: { opacity: 0, y: 40 },
  fade: { opacity: 0 },
  clip: { opacity: 1, clipPath: 'inset(0 0 102% 0)' },
  'scale-x': { opacity: 1, scaleX: 0 },
};

const TO: Record<Variant, gsap.TweenVars> = {
  up: { opacity: 1, y: 0 },
  fade: { opacity: 1 },
  clip: { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
  'scale-x': { opacity: 1, scaleX: 1 },
};

/**
 * Scroll-triggered reveal. With `stagger` it animates direct children in
 * sequence; without it, the element itself. The matching CSS in globals.css
 * pre-hides targets only when `html.motion-on` is present, so the no-JS and
 * reduced-motion paths render fully visible.
 */
export function Reveal({
  children,
  as = 'div',
  className,
  variant = 'up',
  delay = 0,
  duration = 1.5,
  stagger,
  start = 'top 88%',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const fullMotion = useFullMotion();

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion || fullMotion !== true) return;

    const targets =
      stagger !== undefined ? (Array.from(node.children) as HTMLElement[]) : [node];
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, FROM[variant], {
        ...TO[variant],
        duration,
        delay,
        stagger: stagger ?? 0,
        ease: variant === 'scale-x' ? ease.expo : ease.glide,
        clearProps: variant === 'clip' ? 'clipPath' : '',
        scrollTrigger: { trigger: node, start, once: true },
      });
    }, node);

    return () => ctx.revert();
  }, [reducedMotion, variant, delay, duration, stagger, start, fullMotion]);

  return createElement(
    as,
    {
      ref,
      className,
      ...(stagger === undefined ? { 'data-reveal': variant } : {}),
    },
    children,
  );
}

type RevealItemProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  variant?: Variant;
};

/** Marks a direct child of a staggered <Reveal> so CSS can pre-hide it. */
export function RevealItem({
  children,
  as = 'div',
  className,
  variant = 'up',
}: RevealItemProps) {
  return createElement(as, { className, 'data-reveal': variant }, children);
}
