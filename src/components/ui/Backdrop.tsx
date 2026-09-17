'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';

import { useRichMotion } from '@/hooks/usePrefersReducedMotion';
import { sitePath } from '@/lib/site-path';

/**
 * Persistent daylight substrate: a fine navy schematic grid, four full-height
 * column rules, and a static film grain over Mission Mist. Fixed,
 * non-interactive, and quiet enough to register as texture, not decoration.
 */
export function Backdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const richMotion = useRichMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || richMotion !== true) return;

    let frame = 0;
    let nextX = 50;
    let nextY = 26;
    const paint = () => {
      frame = 0;
      root.style.setProperty('--ambient-x', `${nextX}%`);
      root.style.setProperty('--ambient-y', `${nextY}%`);
    };
    const move = (event: PointerEvent) => {
      nextX = (event.clientX / window.innerWidth) * 100;
      nextY = (event.clientY / window.innerHeight) * 100;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
    };
  }, [richMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ '--ambient-x': '50%', '--ambient-y': '26%' } as CSSProperties}
    >
      <div className="absolute inset-0 grid-lines-light opacity-80" />

      {/* Desktop-only pointer light. Touch and reduced-motion users see the
          same field held at its calm default position. */}
      <div className="absolute inset-0 opacity-75 [background:radial-gradient(34rem_circle_at_var(--ambient-x)_var(--ambient-y),rgba(141,175,192,0.24),transparent_72%)]" />

      {/* Column rules — anchor the schematic grid the sections are laid out on. */}
      <div className="shell absolute inset-x-0 top-0 h-full">
        <div className="relative hidden h-full md:block">
          {[0, 25, 50, 75, 100].map((left) => (
            <span
              key={left}
              className="absolute top-0 h-full w-px bg-linear-to-b from-transparent via-ink-950/16 to-transparent"
              style={{ left: `${left}%` }}
            />
          ))}
        </div>
      </div>

      {/* Radial falloff keeps the grid from competing with body copy. */}
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_0%,transparent_0%,rgba(215,225,228,0.88)_82%)]" />

      <div
        className="absolute inset-0 hidden opacity-[0.025] mix-blend-multiply [background-size:180px_180px] md:block"
        style={{ backgroundImage: `url("${sitePath('/images/grain.svg')}")` }}
      />
    </div>
  );
}
