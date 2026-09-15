'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Cursor-reactive plate: the artwork shifts and tilts against the pointer while
 * a specular sheen tracks it, so a static image reads as a physical panel under
 * a moving light.
 *
 * Driven by a self-terminating RAF lerp writing straight to style, rather than
 * GSAP tweens — the card sits inside a pinned, horizontally-scrolled track, and
 * tween-based transforms fight the track's own transform for ownership.
 */
export function useCursorPlate<T extends HTMLElement>(strength = 1) {
  const ref = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const art = node.querySelector<HTMLElement>('[data-plate-art]');
    const sheen = node.querySelector<HTMLElement>('[data-plate-sheen]');
    if (!art) return;

    const target = { ax: 0, ay: 0, rx: 0, ry: 0 };

    // Smoothing is handed to the compositor via a transition rather than a RAF
    // lerp — fewer moving parts, and nothing to fight the section's timelines.
    art.style.transition = 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)';
    art.style.willChange = 'transform';

    const apply = () => {
      art.style.transform =
        `perspective(900px) rotateX(${target.rx}deg) rotateY(${target.ry}deg)` +
        ` translate(${target.ax}%, ${target.ay}%)`;
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const cx = gsap.utils.clamp(
        -1,
        1,
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
      );
      const cy = gsap.utils.clamp(
        -1,
        1,
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
      );

      // Artwork leads the cursor while the panel counter-rotates — that
      // opposition is what sells depth rather than a flat slide.
      target.ax = cx * 2.4 * strength;
      target.ay = cy * 2.4 * strength;
      target.ry = cx * 4 * strength;
      target.rx = -cy * 4 * strength;
      apply();

      if (sheen) {
        sheen.style.setProperty('--mx', `${((cx + 1) / 2) * 100}%`);
        sheen.style.setProperty('--my', `${((cy + 1) / 2) * 100}%`);
        sheen.style.opacity = '1';
      }
    };

    const onLeave = () => {
      target.ax = 0;
      target.ay = 0;
      target.rx = 0;
      target.ry = 0;
      apply();
      if (sheen) sheen.style.opacity = '0';
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);

    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      art.style.transform = '';
      art.style.transition = '';
      art.style.willChange = '';
      if (sheen) sheen.style.opacity = '';
    };
  }, [strength, reducedMotion]);

  return ref;
}
