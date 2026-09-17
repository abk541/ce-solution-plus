'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';

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

// Three.js is purely decorative, so the mission gimbal loads after first
// paint rather than competing with the headline for LCP.
const HeroMissionGimbal = dynamic(
  () =>
    import('@/components/sections/HeroMissionGimbal').then((m) => m.HeroMissionGimbal),
  { ssr: false },
);

const STATIC_GIMBAL_LOCKS = [0, 60, 120, 180, 240, 300].map((angle) => {
  const radians = (angle * Math.PI) / 180;
  const centerX = 300 + Math.cos(radians) * 93;
  const centerY = 300 + Math.sin(radians) * 93;
  // Strings avoid tiny server/client float serialization differences in SVG
  // attributes, which otherwise cause a React hydration warning.
  return {
    angle,
    x: (centerX - 4).toFixed(3),
    y: (centerY - 7).toFixed(3),
    centerX: centerX.toFixed(3),
    centerY: centerY.toFixed(3),
  };
});

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const fullMotion = useFullMotion();
  const richMotion = useRichMotion();
  const [introReady, setIntroReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleSceneFailure = useCallback(() => setSceneReady(false), []);

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
      {/* Sticky viewport gives the gimbal enough space to align into About. */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-40 md:pb-14 md:pt-44">
        <div data-hero-scene aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
          {richMotion === true && introReady ? (
            <HeroMissionGimbal
              className="absolute inset-0 h-full w-full"
              onReady={handleSceneReady}
              onFailure={handleSceneFailure}
            />
          ) : null}

          {/* The exact same mechanical idea survives on touch, low-power and
              failed-WebGL paths as a crisp vector poster. */}
          <div
            data-hero-static-art
            className={`absolute -right-24 top-[7svh] h-[23rem] w-[23rem] transition-opacity duration-500 sm:-right-16 sm:h-[30rem] sm:w-[30rem] lg:right-[1vw] lg:top-[13svh] lg:h-[38rem] lg:w-[38rem] ${
              sceneReady ? 'opacity-0' : 'opacity-90'
            }`}
          >
            <svg viewBox="0 0 600 600" className="h-full w-full" focusable="false">
              <defs>
                <linearGradient id="gimbal-steel" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F2F3EF" stopOpacity="0.82" />
                  <stop offset="0.48" stopColor="#BFD0DC" stopOpacity="0.42" />
                  <stop offset="1" stopColor="#355E93" stopOpacity="0.74" />
                </linearGradient>
                <linearGradient id="gimbal-core" x1="0" y1="0" x2="0.9" y2="1">
                  <stop offset="0" stopColor="#5D83A1" />
                  <stop offset="1" stopColor="#163B5C" />
                </linearGradient>
              </defs>
              {[
                { rx: 224, ry: 82, rotate: -18, dash: '590 82' },
                { rx: 204, ry: 75, rotate: 32, dash: '520 88' },
                { rx: 182, ry: 68, rotate: 74, dash: '450 90' },
                { rx: 158, ry: 60, rotate: -58, dash: '386 84' },
                { rx: 135, ry: 52, rotate: 18, dash: '320 78' },
                { rx: 112, ry: 45, rotate: 103, dash: '252 72' },
              ].map((ring, index) => (
                <ellipse
                  key={ring.rx}
                  cx="300"
                  cy="300"
                  rx={ring.rx}
                  ry={ring.ry}
                  transform={`rotate(${ring.rotate} 300 300)`}
                  fill="none"
                  stroke={index % 2 === 0 ? 'url(#gimbal-steel)' : '#5D83A1'}
                  strokeOpacity={0.42 + index * 0.055}
                  strokeWidth={index < 2 ? 4 : 3}
                  strokeDasharray={ring.dash}
                  strokeLinecap="square"
                />
              ))}
              <path
                d="M300 236 353 268 353 332 300 364 247 332 247 268Z"
                fill="url(#gimbal-core)"
                stroke="#BFD0DC"
                strokeOpacity="0.62"
                strokeWidth="2"
              />
              <path
                d="M300 263 331 281 331 319 300 337 269 319 269 281Z"
                fill="#10283E"
                stroke="#F2F3EF"
                strokeOpacity="0.42"
              />
              {STATIC_GIMBAL_LOCKS.map(({ angle, x, y, centerX, centerY }) => (
                <rect
                  key={angle}
                  x={x}
                  y={y}
                  width="8"
                  height="14"
                  fill="#FF5C3D"
                  opacity="0.86"
                  transform={`rotate(${angle + 90} ${centerX} ${centerY})`}
                />
              ))}
            </svg>
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

        <div
          data-hero-fade
          className="absolute right-[4vw] top-[18svh] z-[6] hidden w-64 border-l border-steel-400/40 pl-4 drop-shadow-[0_2px_3px_#10283e] xl:block"
          aria-label="Mission readiness gimbal: six coordinated service lines"
        >
          <div className="flex items-center justify-between gap-4 label-mono text-[0.52rem] text-steel-300">
            <span>Mission gimbal</span>
            <span className="text-power-bright">Locked / 06</span>
          </div>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-steel-400">
            {['Staff', 'Sustain', 'Train', 'Professional', 'Build', 'Move'].map(
              (label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="text-power-bright tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                </li>
              ),
            )}
          </ol>
        </div>

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
