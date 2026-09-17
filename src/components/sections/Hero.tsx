'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import { MobileLogoField } from '@/components/sections/MobileLogoField';
import { MagneticAction } from '@/components/ui/MagneticAction';
import { company, hero } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useCompactMotion,
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
  const heroWasPrehiddenRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const compactMotion = useCompactMotion();
  const fullMotion = useFullMotion();
  const richMotion = useRichMotion();
  const [introReady, setIntroReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const reveal = () => setIntroReady(true);
    heroWasPrehiddenRef.current = document.documentElement.classList.contains('motion-hero');
    if (!document.documentElement.classList.contains('motion-entry')) reveal();
    window.addEventListener('ce:intro-exit', reveal);
    const compact = window.matchMedia('(max-width: 1023px), (hover: none), (pointer: coarse)').matches;
    const fallback = window.setTimeout(reveal, compact ? 1050 : 1950);
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
      !heroWasPrehiddenRef.current ||
      !document.documentElement.classList.contains('motion-hero') ||
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

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || compactMotion !== true) return;

    const art = root.querySelector<HTMLElement>('[data-hero-mobile-art]');
    const heading = root.querySelector<HTMLElement>('[data-hero-heading]');
    const status = root.querySelector<HTMLElement>('[data-hero-status]');
    if (!art || !heading || !status) return;

    let frame = 0;
    let activeState: boolean | null = null;
    const paint = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const isActive = rect.bottom > -80 && rect.top < window.innerHeight + 80;
      if (activeState !== isActive) {
        activeState = isActive;
        root.setAttribute('data-mobile-active', isActive ? 'true' : 'false');
      }
      const travel = Math.max(0, -rect.top);
      const range = Math.max(root.offsetHeight - window.innerHeight * 0.38, 1);
      const progress = Math.min(travel / range, 1);

      art.style.transform = `translate3d(${progress * 10}px, ${progress * -18}px, 0) scale(${1 - progress * 0.04})`;
      art.style.opacity = String(1 - progress * 0.2);
      heading.style.transform = `translate3d(0, ${progress * -8}px, 0)`;
      status.style.opacity = String(1 - progress * 0.28);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      art.style.removeProperty('transform');
      art.style.removeProperty('opacity');
      heading.style.removeProperty('transform');
      status.style.removeProperty('opacity');
      root.removeAttribute('data-mobile-active');
    };
  }, [compactMotion, reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="top"
      data-hero-root
      className="relative bg-ink-950 text-steel-200"
    >
      {/* Sticky viewport lets the reactive mark hold briefly as content leaves. */}
      <div
        data-hero-viewport
        className="relative flex flex-col overflow-hidden pb-[max(40px,env(safe-area-inset-bottom))] pt-[clamp(272px,40svh,336px)]"
      >
        <div data-hero-scene aria-hidden="true" className="absolute inset-0 z-[2]">
          {richMotion === true && introReady ? (
            <HeroParticles className="absolute inset-0 h-full w-full" />
          ) : null}

          {/* Phones use the real CE mark plus a lightweight living field. The
              crisp image carries the brand while the canvas supplies energy. */}
          <div
            data-hero-mobile-art
            className="absolute inset-x-0 top-[calc(64px+env(safe-area-inset-top))] h-[clamp(192px,32svh,256px)]"
          >
            <span className="absolute right-[-40px] top-1/2 h-[224px] w-[224px] -translate-y-1/2 bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-surface-strong)_34%,transparent)_0%,transparent_70%)] blur-2xl" />
            <MobileLogoField className="pointer-events-auto absolute right-[-12px] top-0 h-[calc(100%_-_28px)] w-[clamp(208px,64vw,272px)]" />
            <span className="absolute bottom-[12px] right-[20px] flex items-center gap-[8px] label-mono text-[10px] tracking-[1.3px] text-steel-200">
              <span className="h-[6px] w-[6px] bg-power" />
              Mission support / active
            </span>
          </div>
        </div>

        {/* Contrast behind the left-aligned type only, and kept light enough
            that the particle field still reads through it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(72%_70%_at_0%_62%,var(--color-ink-950)_12%,color-mix(in_srgb,var(--color-ink-950)_72%,transparent)_44%,transparent_74%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-linear-to-t from-ink-950 to-transparent"
        />
        <div
          aria-hidden="true"
          data-hero-current
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-px overflow-hidden bg-linear-to-r from-transparent via-power/45 to-transparent"
        >
          <span className="mobile-current-pulse absolute inset-y-0 left-0 w-24 bg-linear-to-r from-transparent via-power to-transparent" />
        </div>

        <div data-hero-shift className="shell relative z-10">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4" data-hero-status>
            <span className="relative mt-1.5 flex h-1.5 w-1.5 shrink-0 sm:mt-0">
              <span className="absolute inline-flex h-full w-full bg-power" />
            </span>
            <p className="label-mono text-[0.625rem] leading-[1.5] tracking-[0.14em] text-steel-200 sm:text-[0.68rem] sm:leading-none sm:tracking-[0.2em] sm:text-steel-300">
              <span className="block sm:hidden">Veteran &amp; Woman-Owned Small Business</span>
              <span className="block text-power-bright sm:hidden">VOSB / WOSB</span>
              <span className="hidden sm:inline">
                {hero.eyebrow}
                <span className="ml-3 text-power-bright">/ {company.designationShort}</span>
              </span>
            </p>
          </div>

          {/* Two hard cadence lines turn the four verbs into a command statement. */}
          <h1
            aria-label={hero.headline.join(' ')}
            data-hero-heading
            className="mt-5 max-w-[64rem] display-editorial text-[clamp(2rem,10vw,3.25rem)] text-paper sm:mt-7 lg:text-[clamp(2.15rem,7.3vw,6.7rem)]"
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

          <div
            data-hero-details
            className="mt-6 flex flex-col gap-5 border-t border-ink-600/65 pt-5 sm:flex-row sm:items-center sm:justify-between md:mt-10 md:gap-8 md:pt-8"
          >
            <p data-hero-fade className="max-w-[32ch] text-base leading-[1.65] text-steel-200 md:max-w-md md:text-[0.98rem] md:leading-relaxed md:text-steel-300">
              {hero.lede}
            </p>

            <div data-hero-fade data-hero-cta className="w-full shrink-0 sm:w-auto">
              <MagneticAction
                href={hero.primaryCta.href}
                variant="solid"
                className="min-h-14 w-full px-6 sm:w-auto sm:px-7"
              >
                {hero.primaryCta.label}
              </MagneticAction>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
