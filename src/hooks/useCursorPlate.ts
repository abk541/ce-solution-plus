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
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

    const applyPoint = (clientX: number, clientY: number) => {
      const rect = node.getBoundingClientRect();
      const cx = gsap.utils.clamp(
        -1,
        1,
        (clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
      );
      const cy = gsap.utils.clamp(
        -1,
        1,
        (clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
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

    const reset = () => {
      target.ax = 0;
      target.ay = 0;
      target.rx = 0;
      target.ry = 0;
      apply();
      if (sheen) sheen.style.opacity = '0';
    };

    const onMouseMove = (event: PointerEvent) => applyPoint(event.clientX, event.clientY);

    let touchActive = false;
    let touchEngaged = false;
    let touchPointerId = -1;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchX = 0;
    let touchY = 0;
    let holdTimer = 0;

    const engageTouch = () => {
      holdTimer = 0;
      if (!touchActive) return;
      touchEngaged = true;
      applyPoint(touchX, touchY);
    };

    const onTouchDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || touchActive) return;
      touchActive = true;
      touchEngaged = false;
      touchPointerId = event.pointerId;
      touchStartX = touchX = event.clientX;
      touchStartY = touchY = event.clientY;
      // A brief hold separates an intentional plate interaction from the
      // beginning of a vertical page swipe. No pointer capture or preventDefault
      // is used, so the browser always retains ownership of touch scrolling.
      holdTimer = window.setTimeout(engageTouch, 80);
    };

    const onTouchMove = (event: PointerEvent) => {
      if (!touchActive || event.pointerId !== touchPointerId) return;
      touchX = event.clientX;
      touchY = event.clientY;
      if (!touchEngaged) {
        const travel = Math.hypot(touchX - touchStartX, touchY - touchStartY);
        if (travel > 10) {
          window.clearTimeout(holdTimer);
          holdTimer = 0;
        }
        return;
      }
      applyPoint(touchX, touchY);
    };

    const finishTouch = (event: PointerEvent) => {
      if (!touchActive || event.pointerId !== touchPointerId) return;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      touchActive = false;
      touchEngaged = false;
      touchPointerId = -1;
      reset();
    };

    if (finePointer) {
      node.addEventListener('pointermove', onMouseMove, { passive: true });
      node.addEventListener('pointerleave', reset);
    } else {
      node.addEventListener('pointerdown', onTouchDown, { passive: true });
      node.addEventListener('pointermove', onTouchMove, { passive: true });
      window.addEventListener('pointerup', finishTouch, { passive: true });
      window.addEventListener('pointercancel', finishTouch, { passive: true });
    }

    return () => {
      window.clearTimeout(holdTimer);
      node.removeEventListener('pointermove', onMouseMove);
      node.removeEventListener('pointerleave', reset);
      node.removeEventListener('pointerdown', onTouchDown);
      node.removeEventListener('pointermove', onTouchMove);
      window.removeEventListener('pointerup', finishTouch);
      window.removeEventListener('pointercancel', finishTouch);
      art.style.transform = '';
      art.style.transition = '';
      art.style.willChange = '';
      if (sheen) sheen.style.opacity = '';
    };
  }, [strength, reducedMotion]);

  return ref;
}
