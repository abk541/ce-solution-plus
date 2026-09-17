'use client';

import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { capabilities } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      if (reducedMotion || motionAllowed !== true) return;
      // Cells assemble as the rail enters: rule draws, then contents settle.
      gsap
        .timeline({
          scrollTrigger: { trigger: '[data-capability-grid]', start: 'top 82%', once: true },
        })
        .fromTo(
          '[data-cell-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: duration.reveal, ease: ease.expo, stagger: duration.stagger },
        )
        .fromTo(
          '[data-cell-body]',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: duration.reveal, ease: ease.spring, stagger: duration.stagger },
          0.12,
        );
    }, root);

    // Readout tracks the rail directly off scrollLeft — no scroll measurement,
    // so it stays correct regardless of smooth-scroll or resize behaviour.
    const rail = root.querySelector<HTMLElement>('[data-cap-rail]');
    const readout = root.querySelector<HTMLElement>('[data-cap-readout]');
    let frame = 0;
    let lastIndex = 1;
    const updateRail = () => {
      frame = 0;
      if (!rail || !readout) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 0;
      const index = Math.min(capabilities.length, Math.floor(p * capabilities.length) + 1);
      if (index === lastIndex) return;
      lastIndex = index;
      readout.textContent = String(index).padStart(2, '0');
    };
    const onRail = () => {
      if (!frame) frame = window.requestAnimationFrame(updateRail);
    };
    rail?.addEventListener('scroll', onRail, { passive: true });

    return () => {
      rail?.removeEventListener('scroll', onRail);
      window.cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, [motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} id="capabilities" className="relative z-10 bg-surface-intermediate py-20 text-foreground-secondary md:py-28 lg:py-36">
      <div className="shell">
        <div className="flex flex-col gap-8 border-b border-border-command/45 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTag index="02">Capabilities</SectionTag>
            <h2 className="mt-7 max-w-2xl display-editorial text-[clamp(2rem,4.6vw,3.6rem)] text-foreground-primary">
              Six service lines. One accountability model.
            </h2>
          </div>
          <div className="flex max-w-sm flex-col gap-4">
            <p className="text-sm leading-relaxed text-foreground-secondary">
              Each service line is scoped to the requirement and held to the same performance
              standard.
            </p>
            <p className="label-mono text-[0.6rem] text-foreground-secondary">
              <span data-cap-readout className="text-accent tabular-nums">
                01
              </span>
              <span aria-hidden="true" className="mx-2 text-foreground-muted">/</span>
              <span className="tabular-nums">
                {String(capabilities.length).padStart(2, '0')}
              </span>
              <span className="ml-3">Swipe / scroll</span>
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal rail. Native scroll + snap so it works with touch, keyboard
          and smooth-scroll without any position measurement. */}
      <div data-cap-stage className="relative mt-px">
        <div
          data-cap-rail
          role="region"
          aria-label="Capability cards"
          className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="shell">
            <div
              data-capability-grid
              className="flex w-max snap-x snap-mandatory gap-px bg-border-command/40 lg:gap-6 lg:bg-transparent"
            >
          {capabilities.map((capability) => (
            <article
              key={capability.id}
              tabIndex={0}
              aria-labelledby={`cap-${capability.id}`}
              className="group relative flex min-h-[21rem] w-[82vw] shrink-0 snap-start flex-col justify-between border border-border-command/45 bg-surface-panel p-7 outline-none transition-[background-color,border-color,transform] duration-[var(--motion-ui)] active:scale-[0.99] hover:border-accent/70 hover:bg-surface-canvas focus-visible:border-foreground-primary focus-visible:bg-surface-canvas sm:w-[24rem] md:min-h-[23rem] md:p-9"
            >
              <span
                data-cell-rule
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left bg-border-command/55"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-[var(--motion-reveal)] ease-[var(--ease-spring)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />

              <div data-cell-body>
                <div className="flex items-center justify-between">
                  <span className="label-mono text-[0.65rem] text-foreground-secondary tabular-nums transition-colors duration-[var(--motion-ui)] group-hover:text-accent group-focus-visible:text-accent">
                    {capability.index}
                  </span>
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    className="h-3 w-3 text-foreground-secondary transition-all duration-[var(--motion-ui)] ease-[var(--ease-spring)] group-hover:rotate-90 group-hover:text-accent group-focus-visible:rotate-90 group-focus-visible:text-accent"
                  >
                    <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>

                <h3
                  id={`cap-${capability.id}`}
                  className="mt-8 text-[1.35rem] font-bold leading-tight tracking-tight text-foreground-primary md:text-2xl"
                >
                  {capability.title}
                </h3>
                <p className="mt-4 text-[0.92rem] leading-relaxed text-foreground-secondary">
                  {capability.summary}
                </p>
              </div>

              {/* PLACEHOLDER tags — see src/content/site.ts. */}
              <div
                data-hover-details
                className="mt-8 grid grid-rows-[1fr]"
              >
                <div className="overflow-hidden">
                  <span aria-hidden="true" className="mb-4 block h-px w-full bg-border-command/45" />
                  <ul className="flex flex-wrap gap-2">
                    {capability.tags.map((item) => (
                      <li
                        key={item}
                        className="border border-border-command/45 px-2.5 py-2 label-mono text-[0.55rem] leading-none text-foreground-secondary"
                      >
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
