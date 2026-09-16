'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';

import { MagneticAction } from '@/components/ui/MagneticAction';
import { LogoMark } from '@/components/ui/Logo';
import { company, hero } from '@/content/site';
import { ease, gsap } from '@/lib/gsap';
import {
  useFullMotion,
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
  useRichMotion,
} from '@/hooks/usePrefersReducedMotion';

// Three.js is ~200kB and purely decorative, so it loads after first paint
// rather than blocking the headline.
const HeroParticles = dynamic(
  () => import('@/components/sections/HeroParticles').then((m) => m.HeroParticles),
  { ssr: false },
);

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const fullMotion = useFullMotion();
  const richMotion = useRichMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      reducedMotion ||
      fullMotion === null ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: fullMotion ? ease.spring : 'power3.out' },
        onComplete: () => {
          document.documentElement.classList.remove('motion-hero');
          gsap.set('[data-hero-line] > span, [data-hero-status], [data-hero-fade], [data-hero-art]', {
            clearProps: 'transform,opacity',
          });
        },
      });

      tl.fromTo(
        '[data-hero-art]',
        { opacity: 0, scale: 0.96 },
        // Match the watermark's resting opacity so clearing GSAP's inline
        // styles cannot produce a visible 100% -> 20% snap.
        { opacity: 0.2, scale: 1, duration: 0.8 },
        0.02,
      )
        .fromTo(
        '[data-hero-status]',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: fullMotion ? 0.7 : 0.42 },
        fullMotion ? 0.1 : 0.04,
      )
        .fromTo(
          '[data-hero-line] > span',
          // `y: 0` is required: the pre-hide CSS uses a percentage translate, which
          // GSAP otherwise parses into the px `y` channel and never clears.
          { yPercent: 112, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: fullMotion ? 1.15 : 0.72,
            stagger: fullMotion ? 0.08 : 0.045,
          },
          fullMotion ? 0.18 : 0.08,
        )
        .fromTo(
          '[data-hero-fade]',
          { opacity: 0, y: fullMotion ? 22 : 12 },
          {
            opacity: 1,
            y: 0,
            duration: fullMotion ? 0.9 : 0.55,
            stagger: fullMotion ? 0.1 : 0.06,
          },
          fullMotion ? 0.62 : 0.36,
        );

      // The scrubbed exit belongs to the desktop composition. Native phone
      // scrolling should stop exactly when the user's finger stops.
      if (fullMotion) {
        gsap.to('[data-hero-shift]', {
          yPercent: -12,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.4 },
        });
      }
    }, root);

    return () => ctx.revert();
  }, [fullMotion, reducedMotion]);

  return (
    <section ref={rootRef} id="top" className="relative h-[100svh] lg:h-[118svh]">
      {/* Sticky viewport so the constellation holds briefly as content leaves. */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-40 md:pb-14 md:pt-44">
        {richMotion === true ? (
          <HeroParticles className="absolute inset-0 h-full w-full" />
        ) : null}

        {/* Phones use one static, token-coloured monogram instead of loading
            the WebGL scene. It sits off-axis so it reads as a watermark, not
            another logo competing with the nav lockup. */}
        <div
          data-hero-art
          data-hero-static-art
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-[14svh] opacity-20"
        >
          <LogoMark tone="light" className="w-[17rem] bg-accent" />
        </div>

        {/* Contrast behind the left-aligned type only, and kept light enough
            that the particle field still reads through it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(75%_70%_at_0%_60%,var(--color-ink-950)_10%,color-mix(in_srgb,var(--color-ink-950)_62%,transparent)_42%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink-950 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-ink-600 to-transparent"
        />

      <div data-hero-shift className="shell relative z-10">
        <div className="flex items-center gap-4" data-hero-status>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          </span>
          <p className="label-mono text-[0.65rem] text-steel-300">
            {hero.eyebrow}
            <span className="ml-3 text-accent">/ {company.designationShort}</span>
          </p>
        </div>

        {/* Four verbs, set on one line so they read as a cadence rather than
            a stacked headline. The logo above carries the rest. */}
        <h1
          aria-label={hero.headline.join(' ')}
          className="mt-7 display-editorial text-[clamp(2rem,6.4vw,5.6rem)] text-paper"
        >
          <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-[0.5em] gap-y-1">
            {hero.headline.map((line, index) => (
              <span key={line} data-hero-line className="block overflow-hidden pb-[0.08em]">
                <span className="block">
                  {index === hero.headline.length - 1 ? line.replace(/\.$/, '') : line}
                  {index === hero.headline.length - 1 ? (
                    <span className="text-accent">.</span>
                  ) : null}
                  {index < hero.headline.length - 1 ? ' ' : null}
                </span>
              </span>
            ))}
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-ink-700/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p data-hero-fade className="max-w-md text-[0.98rem] leading-relaxed text-steel-300">
            {hero.lede}
          </p>

          <div data-hero-fade className="shrink-0">
            <MagneticAction href={hero.primaryCta.href} variant="solid">
              {hero.primaryCta.label}
            </MagneticAction>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
