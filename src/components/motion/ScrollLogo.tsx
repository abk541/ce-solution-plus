'use client';

import { useRef } from 'react';

import { Logo } from '@/components/ui/Logo';
import { ScrollTrigger, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

/**
 * The logo is the page's fixed anchor: it opens large and centred in the hero,
 * then scrubs down into the nav slot as the hero scrolls away, where it stays
 * for the rest of the page.
 *
 * Positions are measured from the real nav logo rather than hard-coded, so the
 * landing point stays correct across breakpoints and font loads. The nav's own
 * logo is hidden while this one is flying and revealed on handoff, which keeps
 * a single visible mark on screen at all times.
 */
export function ScrollLogo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const hero = document.querySelector<HTMLElement>('#top');
    const navSlot = document.querySelector<HTMLElement>('[data-nav-logo-slot]');
    if (!wrap || !hero || !navSlot) return;

    if (reducedMotion) {
      // Static: hand straight off to the nav, no travel.
      wrap.style.display = 'none';
      navSlot.style.opacity = '1';
      return;
    }

    const ctx = gsap.context(() => {
      const state = { docked: false };

      const compute = () => {
        const slot = navSlot.getBoundingClientRect();
        const self = wrap.getBoundingClientRect();
        if (!self.width || !slot.width) return null;
        // Scale to the nav mark, then translate centre-to-centre.
        const scale = slot.width / self.width;
        return {
          scale,
          x: slot.left + slot.width / 2 - (self.left + self.width / 2),
          y: slot.top + slot.height / 2 - (self.top + self.height / 2),
        };
      };

      // Baseline is re-measured on refresh so resizes don't strand the mark.
      let target = compute();
      const dock = (docked: boolean) => {
        if (state.docked === docked) return;
        state.docked = docked;
        navSlot.style.opacity = docked ? '1' : '0';
        wrap.style.opacity = docked ? '0' : '1';
      };
      dock(false);

      gsap.to(wrap, {
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: () => {
            gsap.set(wrap, { clearProps: 'transform' });
            target = compute();
          },
          onUpdate: (self) => {
            if (!target) target = compute();
            if (!target) return;
            const p = gsap.utils.clamp(0, 1, self.progress);
            gsap.set(wrap, {
              x: target.x * p,
              y: target.y * p,
              scale: 1 + (target.scale - 1) * p,
              force3D: true,
            });
            // Swap to the real nav logo only once it has arrived.
            dock(p > 0.985);
          },
        },
      });
    }, wrap);

    return () => {
      ctx.revert();
      navSlot.style.opacity = '';
      wrap.style.opacity = '';
    };
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-[38svh] z-60 hidden justify-center lg:flex"
    >
      <div ref={wrapRef} className="origin-center will-change-transform">
        <Logo tone="light" variant="full" priority className="h-auto w-[clamp(18rem,34vw,34rem)]" />
      </div>
    </div>
  );
}
