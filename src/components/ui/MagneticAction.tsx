'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/cn';
import { duration, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

type Variant = 'solid' | 'outline' | 'ghost';

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Max pull toward the cursor, in px. Keep small — this should be felt, not seen. */
  strength?: number;
};

type ActionProps =
  | (CommonProps & { href: string; type?: never; disabled?: never })
  | (CommonProps & { href?: never; type?: 'button' | 'submit'; disabled?: boolean });

const BASE =
  'group relative inline-flex items-center justify-center gap-3 overflow-hidden whitespace-nowrap rounded-xs px-7 py-4 label-mono transition-[background-color,border-color,color,scale] duration-[var(--motion-micro)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  solid: 'clip-command bg-power text-power-ink hover:bg-power-bright',
  outline:
    'border border-power/60 text-paper hover:border-power hover:bg-power hover:text-power-ink',
  ghost: 'text-steel-300 hover:text-accent',
};

/**
 * Magnetic hover: the control eases toward the cursor and springs back on exit.
 * The inner label counter-moves slightly, which is what makes it read as
 * mechanical play rather than a wobble.
 */
function useMagnet(strength: number, enabled: boolean) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const label = node.querySelector<HTMLElement>('[data-magnet-label]');
    const xTo = gsap.quickTo(node, 'x', { duration: duration.ui, ease: 'power3.out' });
    const yTo = gsap.quickTo(node, 'y', { duration: duration.ui, ease: 'power3.out' });
    const lxTo = label ? gsap.quickTo(label, 'x', { duration: duration.reveal, ease: 'power3.out' }) : null;
    const lyTo = label ? gsap.quickTo(label, 'y', { duration: duration.reveal, ease: 'power3.out' }) : null;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      xTo(gsap.utils.clamp(-1, 1, dx) * strength);
      yTo(gsap.utils.clamp(-1, 1, dy) * strength * 0.6);
      lxTo?.(gsap.utils.clamp(-1, 1, dx) * strength * 0.35);
      lyTo?.(gsap.utils.clamp(-1, 1, dy) * strength * 0.2);
    };

    const onLeave = () => {
      gsap.to(node, { x: 0, y: 0, duration: duration.reveal, ease: 'ce-spring' });
      if (label) gsap.to(label, { x: 0, y: 0, duration: duration.feature, ease: 'ce-spring' });
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      gsap.set(node, { x: 0, y: 0 });
    };
  }, [strength, enabled]);

  return ref;
}

export function MagneticAction({
  children,
  variant = 'solid',
  className,
  strength = 8,
  href,
  type = 'button',
  disabled,
}: ActionProps) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useMagnet(strength, !reducedMotion);

  const inner = (
    <>
      {/* Sheen wipe on hover — one pass, left to right, no loop. */}
      <span
        data-action-sheen
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-mission-mist/30 to-transparent transition-[left] duration-[var(--motion-reveal)] ease-[var(--ease-precise)] group-hover:left-[150%]"
      />
      <span data-magnet-label className="relative flex items-center gap-3">
        {children}
        <svg
          viewBox="0 0 16 10"
          className="h-2.5 w-4 shrink-0 transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)] group-hover:translate-x-1"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cn(BASE, VARIANTS[variant], className)}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      className={cn(BASE, VARIANTS[variant], className)}
    >
      {inner}
    </button>
  );
}
