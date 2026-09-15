'use client';

import { useRef, useState } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { differentiators } from '@/content/site';
import { cn } from '@/lib/cn';
import { ease, gsap, ScrollTrigger } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Differentiators() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const total = differentiators.items.length;

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-diff-item]').forEach((node, index) => {
        ScrollTrigger.create({
          trigger: node,
          start: 'top 62%',
          end: 'bottom 45%',
          onEnter: () => setActiveIndex(index),
          onEnterBack: () => setActiveIndex(index),
        });

        if (reducedMotion) return;

        gsap.fromTo(
          node.querySelectorAll('[data-diff-inner]'),
          { opacity: 0, x: 26 },
          {
            opacity: 1,
            x: 0,
            duration: 1.1,
            stagger: 0.07,
            ease: ease.spring,
            scrollTrigger: { trigger: node, start: 'top 85%', once: true },
          },
        );

        gsap.fromTo(
          node.querySelector('[data-diff-rule]'),
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.9,
            ease: ease.expo,
            scrollTrigger: { trigger: node, start: 'top 85%', once: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} className="relative z-10 border-y border-ink-800 bg-ink-900">
      <div className="shell grid gap-16 py-24 md:py-32 lg:grid-cols-12 lg:gap-12 lg:py-40">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionTag index="03">{differentiators.label}</SectionTag>

            <h2 className="mt-7 display-editorial text-[clamp(2rem,4.4vw,3.5rem)]">
              A contracting{' '}
              {/* Word and comma share a nowrap box so the comma can't orphan. */}
              <span className="whitespace-nowrap">
                <KineticWord word={differentiators.kineticWord} reducedMotion={reducedMotion} />,
              </span>{' '}
              not just a capability statement.
            </h2>

            <p className="mt-7 max-w-md text-[1.02rem] leading-relaxed text-steel-300">
              {differentiators.lede}
            </p>

            <div className="mt-12 flex items-center gap-5">
              <span className="label-mono text-[0.65rem] text-accent tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="relative h-px flex-1 max-w-48 bg-ink-700">
                <span
                  className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
              className="group relative border-b border-ink-800 py-10 first:border-t md:py-12"
            >
              <span
                data-diff-rule
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-0 h-full w-px origin-top transition-colors duration-500',
                  activeIndex === index ? 'bg-accent' : 'bg-ink-700',
                )}
              />

              <div className="pl-7 md:pl-10">
                <div
                  data-diff-inner
                  className="flex items-center gap-4 label-mono text-[0.62rem] text-steel-400"
                >
                  <span
                    className={cn(
                      'tabular-nums transition-colors duration-500',
                      activeIndex === index ? 'text-accent' : 'text-steel-400',
                    )}
                  >
                    {item.label}
                  </span>
                  <span aria-hidden="true" className="h-px w-6 bg-ink-600" />
                </div>

                <h3
                  data-diff-inner
                  className={cn(
                    'mt-5 text-[1.3rem] font-bold leading-snug tracking-tight transition-colors duration-500 md:text-[1.6rem]',
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
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * The page's one kinetic type moment: a print-registration misalignment.
 * Two offset ghosts drift out of register on a long, mostly-idle cycle, so it
 * reads as a press artefact rather than a glitch effect.
 */
function KineticWord({ word, reducedMotion }: { word: string; reducedMotion: boolean }) {
  return (
    <span className="relative inline-block whitespace-nowrap text-accent">
      <span className="relative z-10">{word}</span>
      {!reducedMotion ? (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 z-0 select-none text-steel-200 [animation:register-shift_7s_steps(1,end)_infinite]"
          >
            {word}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 z-0 select-none text-accent-dim [animation:register-shift_7s_steps(1,end)_infinite_reverse,register-clip_7s_steps(1,end)_infinite]"
          >
            {word}
          </span>
        </>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-px w-full bg-accent/50"
      />
    </span>
  );
}
