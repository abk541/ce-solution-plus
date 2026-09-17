'use client';

import { useRef } from 'react';

import { LogoMark } from '@/components/ui/Logo';
import { MagneticAction } from '@/components/ui/MagneticAction';
import { SectionTag } from '@/components/ui/SectionTag';
import { SplitWords } from '@/components/ui/SplitWords';
import { trust } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useCompactMotion,
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function TrustStatement() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const compactMotion = useCompactMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || motionAllowed !== true) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-word] > span');

      gsap.fromTo(
        words,
        // `y: 0` clears the px baseline GSAP derives from the CSS percentage translate.
        { yPercent: 115, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: duration.feature,
          stagger: duration.stagger,
          ease: ease.spring,
          scrollTrigger: { trigger: '[data-trust-statement]', start: 'top 82%', once: true },
        },
      );

      gsap.fromTo(
        '[data-trust-mark]',
        { opacity: 0, scale: 0.9, rotate: -6 },
        {
          opacity: 0.07,
          scale: 1,
          rotate: 0,
          duration: duration.feature,
          ease: ease.spring,
          scrollTrigger: { trigger: root, start: 'top 75%', once: true },
        },
      );

      if (compactMotion === true) {
        gsap.fromTo(
          '[data-trust-drift]',
          { x: 10, y: -7, rotate: -1.5 },
          {
            x: -6,
            y: 7,
            rotate: 1.5,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, [compactMotion, motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} className="relative z-10 overflow-hidden bg-ink-950 text-steel-300">
      <div aria-hidden="true" className="absolute inset-0 grid-lines opacity-50" />

      {/* Brand monogram as a watermark — the light artwork export of logo.avif. */}
      <div
        data-trust-mark
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-[45%] -translate-y-1/2 opacity-[0.05] md:-right-16 md:top-1/2 md:opacity-[0.06]"
      >
        <div data-trust-drift>
          <LogoMark tone="light" className="w-[22rem] max-w-none md:w-[34rem]" />
        </div>
      </div>

      <div className="shell relative py-28 md:py-36 lg:py-44">
        <SectionTag index="05">{trust.label}</SectionTag>

        <h2
          data-trust-statement
          className="mt-10 max-w-5xl display-editorial text-[clamp(2.3rem,6.4vw,5.4rem)] text-paper"
        >
          {trust.statement.map((line) => (
            <SplitWords key={line} text={line} />
          ))}
        </h2>

        <div className="mt-14 grid gap-10 border-t border-ink-700 pt-10 md:grid-cols-12">
          <p className="max-w-2xl text-[1.02rem] leading-relaxed text-steel-300 md:col-span-7">
            {trust.body}
          </p>
          <div className="md:col-span-5 md:flex md:justify-end">
            <MagneticAction href={trust.cta.href} variant="solid">
              {trust.cta.label}
            </MagneticAction>
          </div>
        </div>
      </div>
    </section>
  );
}
