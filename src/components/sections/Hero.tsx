'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import { MagneticAction } from '@/components/ui/MagneticAction';
import { company, hero } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useFullMotion,
  useIsomorphicLayoutEffect,
  useMotionAllowed,
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
  const motionAllowed = useMotionAllowed();
  const fullMotion = useFullMotion();
  const richMotion = useRichMotion();
  const [introReady, setIntroReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const reveal = () => setIntroReady(true);
    if (!document.documentElement.classList.contains('motion-entry')) reveal();
    window.addEventListener('ce:intro-exit', reveal);
    const fallback = window.setTimeout(reveal, 1950);
    return () => {
      window.removeEventListener('ce:intro-exit', reveal);
      window.clearTimeout(fallback);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      reducedMotion ||
      motionAllowed !== true ||
      !introReady ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: fullMotion === true ? ease.spring : ease.out },
        onComplete: () => {
          document.documentElement.classList.remove('motion-hero');
          gsap.set('[data-hero-line] > span, [data-hero-status], [data-hero-fade]', {
            clearProps: 'transform,opacity',
          });
        },
      });

      tl.fromTo(
        '[data-hero-status]',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: fullMotion === true ? duration.reveal : duration.ui },
        0.04,
      )
        .fromTo(
          '[data-hero-line] > span',
          // `y: 0` is required: the pre-hide CSS uses a percentage translate, which
          // GSAP otherwise parses into the px `y` channel and never clears.
          { yPercent: 112, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: fullMotion === true ? duration.feature : duration.reveal,
            stagger: duration.stagger,
          },
          0.1,
        )
        .fromTo(
          '[data-hero-fade]',
          { opacity: 0, y: fullMotion === true ? 22 : 12 },
          {
            opacity: 1,
            y: 0,
            duration: fullMotion === true ? duration.feature : duration.reveal,
            stagger: duration.stagger,
          },
          0.42,
        );

      // The scrubbed exit belongs to the desktop composition. Native phone
      // scrolling should stop exactly when the user's finger stops.
      if (fullMotion === true) {
        gsap.to('[data-hero-shift]', {
          yPercent: -12,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.4 },
        });
      }
    }, root);

    return () => ctx.revert();
  }, [fullMotion, introReady, motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} id="top" className="relative h-[100svh] lg:h-[118svh]">
      {/* Sticky viewport so the constellation holds briefly as content leaves. */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-40 md:pb-14 md:pt-44">
        {richMotion === true && introReady ? (
          <HeroParticles className="absolute inset-0 h-full w-full" />
        ) : null}

        {/* Touch and compact layouts use static range rings. The loader already
            supplies the branded mark; repeating it here would compete with the
            headline and make a decorative raster the page's LCP candidate. */}
        <div
          data-hero-static-art
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-[14svh] h-64 w-64 opacity-60 md:-right-10 md:h-80 md:w-80"
        >
          <span className="absolute inset-0 rounded-full border border-accent/15" />
          <span className="absolute inset-[13%] rotate-[-18deg] rounded-[50%] border border-steel-400/10" />
          <span className="absolute inset-[28%] rotate-[32deg] rounded-[50%] border border-accent/20" />
          <span className="absolute left-1/2 top-0 h-full w-px bg-linear-to-b from-transparent via-ink-600/70 to-transparent" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-linear-to-r from-transparent via-ink-600/70 to-transparent" />
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_18px_rgba(201,165,78,0.5)]" />
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
