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

// Three.js is purely decorative, so the reactive logo loads after first paint
// rather than competing with the headline for LCP.
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
          gsap.set(
            '[data-hero-line] > span, [data-hero-status], [data-hero-fade], [data-hero-scene]',
            {
              clearProps: 'transform,opacity',
            },
          );
        },
      });

      tl.fromTo(
        '[data-hero-status]',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: fullMotion === true ? duration.reveal : duration.ui },
        0.04,
      )
        .fromTo(
          '[data-hero-scene]',
          { opacity: 0, scale: 0.94, y: 12 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            transformOrigin: '72% 44%',
            duration: fullMotion === true ? duration.feature : duration.reveal,
            ease: ease.glide,
          },
          0.06,
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
    <section
      ref={rootRef}
      id="top"
      className="relative h-[100svh] bg-ink-950 text-steel-200 lg:h-[118svh]"
    >
      {/* Sticky viewport lets the reactive mark hold briefly as content leaves. */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-40 md:pb-14 md:pt-44">
        <div data-hero-scene aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
          {richMotion === true && introReady ? (
            <HeroParticles className="absolute inset-0 h-full w-full" />
          ) : null}

          {/* Touch and compact layouts keep the original static range-marker
              fallback; the live constellation stays a desktop enhancement. */}
          <div
            data-hero-static-art
            className="absolute -right-20 top-[12svh] h-72 w-72 opacity-80 md:-right-12 md:h-96 md:w-96"
          >
            <span className="absolute inset-0 rounded-full border border-power/35" />
            <span className="absolute inset-[13%] rotate-[-18deg] rounded-[50%] border border-steel-400/25" />
            <span className="absolute inset-[28%] rotate-[32deg] rounded-[50%] border border-power/45" />
            <span className="absolute left-1/2 top-0 h-full w-px bg-linear-to-b from-transparent via-ink-600/70 to-transparent" />
            <span className="absolute left-0 top-1/2 h-px w-full bg-linear-to-r from-transparent via-ink-600/70 to-transparent" />
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-power" />
          </div>
        </div>

        {/* Contrast behind the left-aligned type only, and kept light enough
            that the particle field still reads through it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[3] bg-[radial-gradient(72%_70%_at_0%_62%,var(--color-ink-950)_12%,color-mix(in_srgb,var(--color-ink-950)_72%,transparent)_44%,transparent_74%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-linear-to-t from-ink-950 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[3] h-px bg-linear-to-r from-transparent via-power/80 to-transparent"
        />

        <div data-hero-shift className="shell relative z-10">
          <div className="flex items-center gap-4" data-hero-status>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full bg-power" />
            </span>
            <p className="label-mono text-[0.65rem] text-steel-300">
              {hero.eyebrow}
              <span className="ml-3 text-power-bright">/ {company.designationShort}</span>
            </p>
          </div>

          {/* Two hard cadence lines turn the four verbs into a command statement. */}
          <h1
            aria-label={hero.headline.join(' ')}
            className="mt-7 max-w-[64rem] display-editorial text-[clamp(2.15rem,7.3vw,6.7rem)] text-paper"
          >
            <span aria-hidden="true" className="grid gap-y-0.5">
              {[hero.headline.slice(0, 2), hero.headline.slice(2)].map((row, rowIndex) => (
                <span key={rowIndex} className="flex flex-wrap items-baseline gap-x-[0.24em]">
                  {row.map((line) => {
                    const index = hero.headline.indexOf(line);
                    return (
                      <span key={line} data-hero-line className="block overflow-hidden pb-[0.08em]">
                        <span className="block">
                          {index === hero.headline.length - 1 ? line.replace(/\.$/, '') : line}
                          {index === hero.headline.length - 1 ? (
                            <span className="text-power">.</span>
                          ) : null}
                        </span>
                      </span>
                    );
                  })}
                </span>
              ))}
            </span>
          </h1>

          <div className="mt-8 flex flex-col gap-8 border-t border-ink-700/70 pt-7 sm:flex-row sm:items-center sm:justify-between md:mt-10 md:pt-8">
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
