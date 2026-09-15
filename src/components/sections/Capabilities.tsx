'use client';

import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { capabilities } from '@/content/site';
import { ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const ctx = gsap.context(() => {
      // Cells assemble as the rail enters: rule draws, then contents settle.
      gsap
        .timeline({
          scrollTrigger: { trigger: '[data-capability-grid]', start: 'top 82%', once: true },
        })
        .fromTo(
          '[data-cell-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, ease: ease.expo, stagger: 0.07 },
        )
        .fromTo(
          '[data-cell-body]',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1, ease: ease.spring, stagger: 0.07 },
          0.12,
        );
    }, root);

    // Readout tracks the rail directly off scrollLeft — no scroll measurement,
    // so it stays correct regardless of smooth-scroll or resize behaviour.
    const rail = root.querySelector<HTMLElement>('[data-cap-rail]');
    const readout = root.querySelector<HTMLElement>('[data-cap-readout]');
    const onRail = () => {
      if (!rail || !readout) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 0;
      const index = Math.min(capabilities.length, Math.floor(p * capabilities.length) + 1);
      readout.textContent = String(index).padStart(2, '0');
    };
    rail?.addEventListener('scroll', onRail, { passive: true });

    return () => {
      rail?.removeEventListener('scroll', onRail);
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="capabilities" className="relative z-10 py-24 md:py-32 lg:py-40">
      <div className="shell">
        <div className="flex flex-col gap-8 border-b border-ink-700 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTag index="02">Capabilities</SectionTag>
            <h2 className="mt-7 max-w-2xl display-editorial text-[clamp(2rem,4.6vw,3.6rem)]">
              Six service lines. One accountability model.
            </h2>
          </div>
          <div className="flex max-w-sm flex-col gap-4">
            <p className="text-sm leading-relaxed text-steel-300">
              Each line is scoped, staffed, and measured on its own terms — and every one of them
              reports to the same standard of performance.
            </p>
            <p className="label-mono text-[0.6rem] text-steel-400">
              <span data-cap-readout className="text-accent tabular-nums">
                01
              </span>
              <span className="mx-2 text-ink-600">/</span>
              <span className="tabular-nums">
                {String(capabilities.length).padStart(2, '0')}
              </span>
              <span className="ml-3">Scroll the rail</span>
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal rail. Native scroll + snap so it works with touch, keyboard
          and smooth-scroll without any position measurement. */}
      <div data-cap-stage className="relative mt-px">
        <div
          data-cap-rail
          className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="shell">
            <div
              data-capability-grid
              className="flex w-max snap-x snap-mandatory gap-px bg-ink-800 lg:gap-6 lg:bg-transparent"
            >
          {capabilities.map((capability) => (
            <article
              key={capability.id}
              tabIndex={0}
              aria-labelledby={`cap-${capability.id}`}
              className="group relative flex min-h-[24rem] w-[82vw] shrink-0 snap-start flex-col justify-between border border-ink-700 bg-ink-950 p-7 outline-none transition-colors duration-500 hover:border-accent/40 hover:bg-ink-850 focus-visible:border-accent/40 focus-visible:bg-ink-850 sm:w-[24rem] md:min-h-[26rem] md:p-9"
            >
              <span
                data-cell-rule
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left bg-ink-600"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />

              <div data-cell-body>
                <div className="flex items-center justify-between">
                  <span className="label-mono text-[0.65rem] text-steel-400 tabular-nums transition-colors duration-500 group-hover:text-accent group-focus-visible:text-accent">
                    {capability.index}
                  </span>
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    className="h-3 w-3 text-ink-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90 group-hover:text-accent group-focus-visible:rotate-90 group-focus-visible:text-accent"
                  >
                    <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>

                <h3
                  id={`cap-${capability.id}`}
                  className="mt-8 text-[1.35rem] font-bold leading-tight tracking-tight text-paper md:text-2xl"
                >
                  {capability.title}
                </h3>
                <p className="mt-4 text-[0.92rem] leading-relaxed text-steel-300">
                  {capability.summary}
                </p>
              </div>

              {/* PLACEHOLDER detail bullets — see src/content/site.ts. */}
              <div className="mt-8 grid grid-rows-[0fr] transition-[grid-template-rows] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <span aria-hidden="true" className="mb-4 block h-px w-full bg-ink-700" />
                  <ul>
                    {capability.detail.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 py-1 label-mono text-[0.6rem] leading-relaxed text-steel-400"
                      >
                        <span aria-hidden="true" className="mt-px text-accent/70">
                          &#9656;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
