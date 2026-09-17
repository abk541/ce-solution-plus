'use client';

import { useRef, useState } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { differentiators } from '@/content/site';
import { cn } from '@/lib/cn';
import { duration, ease, gsap, ScrollTrigger } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Differentiators() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const total = differentiators.items.length;

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const animate = !reducedMotion && motionAllowed === true;

    const ctx = gsap.context(() => {
      if (animate) {
        const kineticWord = root.querySelector<HTMLElement>('[data-kinetic-word]');
        const ghosts = gsap.utils.toArray<HTMLElement>('[data-kinetic-ghost]');
        const steelGhost = ghosts.at(0);
        const powerGhost = ghosts.at(1);

        if (kineticWord && steelGhost && powerGhost) {
          const registerTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: kineticWord,
              start: 'top 82%',
              once: true,
            },
          });

          registerTimeline
            .fromTo(
              steelGhost,
              { x: '-0.13em', y: '-0.02em', opacity: 0 },
              {
                x: '0.08em',
                y: '0.012em',
                opacity: 0.72,
                duration: duration.press,
                repeat: 2,
                yoyo: true,
                ease: 'steps(1)',
              },
            )
            .fromTo(
              powerGhost,
              {
                x: '0.1em',
                y: '0.015em',
                opacity: 0,
                clipPath: 'inset(0 0 0 0)',
              },
              {
                x: '-0.05em',
                y: 0,
                opacity: 0.5,
                clipPath: 'inset(38% 0 42% 0)',
                duration: duration.press,
                repeat: 2,
                yoyo: true,
                ease: 'steps(1)',
              },
              '<',
            )
            .to(ghosts, {
              x: 0,
              y: 0,
              opacity: 0,
              clipPath: 'inset(0 0 0 0)',
              duration: duration.ui,
              ease: ease.expo,
            });
        }
      }

      gsap.utils.toArray<HTMLElement>('[data-diff-item]').forEach((node, index) => {
        ScrollTrigger.create({
          trigger: node,
          start: 'top 62%',
          end: 'bottom 45%',
          onEnter: () => setActiveIndex(index),
          onEnterBack: () => setActiveIndex(index),
        });

        if (!animate) return;

        gsap.fromTo(
          node.querySelectorAll('[data-diff-inner]'),
          { opacity: 0, x: 26 },
          {
            opacity: 1,
            x: 0,
            duration: duration.reveal,
            stagger: duration.stagger,
            ease: ease.spring,
            scrollTrigger: { trigger: node, start: 'top 85%', once: true },
          },
        );

        gsap.fromTo(
          node.querySelector('[data-diff-rule]'),
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: duration.reveal,
            ease: ease.expo,
            scrollTrigger: { trigger: node, start: 'top 85%', once: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [motionAllowed, reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="why-us"
      className="relative z-10 overflow-x-clip border-y border-ink-700 bg-ink-900"
    >
      <div className="shell grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-12 lg:py-36">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionTag index="03">{differentiators.label}</SectionTag>

            <h2 className="mt-7 display-editorial text-[clamp(2rem,4.4vw,3.5rem)] text-paper">
              Small-business value. Delivery{' '}
              <span className="whitespace-nowrap">
                <KineticWord word={differentiators.kineticWord} reducedMotion={reducedMotion} />.
              </span>
            </h2>

            <p className="mt-7 max-w-md text-[1.02rem] leading-relaxed text-steel-300">
              {differentiators.lede}
            </p>

            <div className="mt-12 flex items-center gap-5">
              <span className="label-mono text-[0.65rem] text-power-bright tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="relative h-px flex-1 max-w-48 bg-ink-700">
                <span
                  className="absolute inset-y-0 left-0 bg-power transition-[width] duration-[var(--motion-reveal)] ease-[var(--ease-spring)]"
                  style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
                />
              </span>
              <span className="label-mono text-[0.65rem] text-steel-400 tabular-nums">
                {String(total).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <ol className="lg:col-span-7">
          {differentiators.items.map((item, index) => (
            <li
              key={item.id}
              data-diff-item
              className="group relative border-b border-ink-800 py-8 first:border-t md:py-10"
            >
              <span
                data-diff-rule
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-0 h-full w-px origin-top transition-colors duration-[var(--motion-ui)]',
                  activeIndex === index ? 'bg-power' : 'bg-ink-700',
                )}
              />

              <div className="pl-7 md:pl-10">
                <div
                  data-diff-inner
                  className="flex items-center gap-4 label-mono text-[0.62rem] text-steel-400"
                >
                  <span
                    className={cn(
                      'tabular-nums transition-colors duration-[var(--motion-ui)]',
                      activeIndex === index ? 'text-power-bright' : 'text-steel-400',
                    )}
                  >
                    {item.label}
                  </span>
                  <span aria-hidden="true" className="h-px w-6 bg-ink-600" />
                </div>

                <h3
                  data-diff-inner
                  className={cn(
                    'mt-5 text-[1.3rem] font-bold leading-snug tracking-tight transition-colors duration-[var(--motion-ui)] md:text-[1.6rem]',
                    activeIndex === index ? 'text-paper' : 'text-steel-100',
                  )}
                >
                  {item.title}
                </h3>

                <p
                  data-diff-inner
                  className="mt-4 max-w-2xl text-[0.97rem] leading-relaxed text-steel-300"
                >
                  {item.body}
                </p>

                <ul data-diff-inner className="mt-5 flex flex-wrap gap-2" aria-label={`${item.title} tags`}>
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="border border-ink-600 px-2.5 py-2 label-mono text-[0.55rem] leading-none text-steel-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A one-shot print-registration check that resolves as the section enters. */
function KineticWord({ word, reducedMotion }: { word: string; reducedMotion: boolean }) {
  return (
    <span data-kinetic-word className="relative inline-block whitespace-nowrap text-power">
      <span className="relative z-10">{word}</span>
      {!reducedMotion ? (
        <>
          <span
            data-kinetic-ghost
            aria-hidden="true"
            className="absolute inset-0 z-0 select-none opacity-0 text-steel-200"
          >
            {word}
          </span>
          <span
            data-kinetic-ghost
            aria-hidden="true"
            className="absolute inset-0 z-0 select-none opacity-0 text-power/45"
          >
            {word}
          </span>
        </>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-[2px] w-full bg-power/65"
      />
    </span>
  );
}
