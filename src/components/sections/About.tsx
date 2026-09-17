'use client';

import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { SplitWords } from '@/components/ui/SplitWords';
import { about } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useCompactMotion,
  useFullMotion,
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function About() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const compactMotion = useCompactMotion();
  const fullMotion = useFullMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || motionAllowed !== true) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-word] > span',
        // `y: 0` clears the px baseline GSAP derives from the CSS percentage translate.
        { yPercent: 115, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: duration.feature,
          stagger: duration.stagger,
          ease: ease.spring,
          scrollTrigger: { trigger: '[data-about-statement]', start: 'top 80%', once: true },
        },
      );

      const countTimeline = gsap.timeline({
        scrollTrigger: { trigger: '[data-stat-grid]', start: 'top 92%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((node) => {
        const target = Number(node.dataset.count);
        if (Number.isNaN(target)) return;
        const proxy = { value: 0 };
        let lastValue = -1;
        countTimeline.to(proxy, {
          value: target,
          duration: duration.feature,
          ease: 'power2.out',
          onStart: () => {
            node.textContent = '0';
          },
          onUpdate: () => {
            const nextValue = Math.round(proxy.value);
            if (nextValue === lastValue) return;
            lastValue = nextValue;
            node.textContent = String(nextValue);
          },
          onComplete: () => {
            node.closest<HTMLElement>('[data-stat]')?.setAttribute('data-counted', 'true');
          },
        }, 0);
      });

      if (compactMotion === true && fullMotion !== true) {
        gsap.fromTo(
          '[data-about-grid]',
          { x: -7, y: -5 },
          {
            x: 7,
            y: 9,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      gsap.fromTo(
        '[data-credential]',
        { opacity: 0, x: -14 },
        {
          opacity: 1,
          x: 0,
          duration: duration.reveal,
          stagger: duration.stagger,
          ease: ease.spring,
          scrollTrigger: { trigger: '[data-credential-list]', start: 'top 85%', once: true },
        },
      );

      gsap.fromTo(
        '[data-about-body] > *',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: duration.reveal,
          stagger: duration.stagger,
          ease: ease.spring,
          scrollTrigger: { trigger: '[data-about-body]', start: 'top 85%', once: true },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [compactMotion, fullMotion, motionAllowed, reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="about"
      className="relative z-10 border-y border-border-command/35 bg-surface-panel text-foreground-secondary"
    >
      <div data-about-grid aria-hidden="true" className="absolute -inset-4 grid-lines opacity-35" />

      <div className="shell relative py-20 md:py-28 lg:py-36">
        <SectionTag index="01" className="text-foreground-secondary">
          {about.label}
        </SectionTag>

        <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <h2
              data-about-statement
              className="display-editorial text-[clamp(2.1rem,5.2vw,4.1rem)] text-foreground-primary"
            >
              {about.statement.map((line, index) => (
                <SplitWords
                  key={line}
                  text={line}
                  // Hierarchy by value, not hue: the setup drops back so the
                  // second line lands.
                  className={index === 0 ? 'text-foreground-secondary' : undefined}
                />
              ))}
            </h2>

            <ul
              data-credential-list
              className="mt-12 max-w-md border-t border-border-command/45"
            >
              {about.credentials.map((credential) => (
                <li
                  key={credential.label}
                  data-credential
                  className="group flex items-baseline justify-between gap-6 border-b border-border-command/45 py-4 transition-colors duration-[var(--motion-ui)] hover:border-power/75"
                >
                  <span className="font-grotesk text-base font-semibold tracking-tight text-foreground-primary">
                    {credential.label}
                  </span>
                  <span className="label-mono text-[0.62rem] text-foreground-secondary transition-colors duration-[var(--motion-ui)] group-hover:text-power-bright">
                    {credential.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-about-body className="lg:col-span-6 lg:pt-3">
            {about.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mb-6 text-[1.02rem] leading-relaxed text-foreground-secondary">
                {paragraph}
              </p>
            ))}

            <blockquote className="relative mt-10 border-l-4 border-power bg-surface-canvas/75 px-7 py-7">
              <p className="font-grotesk text-[1.4rem] font-bold leading-snug tracking-[-0.03em] text-foreground-primary md:text-[1.65rem]">
                {about.pullQuote}
              </p>
            </blockquote>
          </div>
        </div>

        <dl data-stat-grid className="mt-16 grid grid-cols-1 gap-px border border-border-command/45 bg-border-command/45 sm:grid-cols-3">
          {about.stats.map((stat) => {
            const numeric = /^\d+$/.test(stat.value);
            return (
              <div key={stat.label} data-stat className="group relative bg-surface-intermediate px-6 py-8 transition-colors duration-[var(--motion-reveal)] hover:bg-surface-canvas">
                <dt className="label-mono min-h-8 text-[0.6rem] leading-[1.6] text-foreground-secondary">
                  {stat.label}
                </dt>
                <dd className="mt-4 font-mono text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-foreground-primary tabular-nums md:text-[3.2rem]">
                  {numeric ? (
                    <span data-count={stat.value}>{stat.value}</span>
                  ) : (
                    <span>{stat.value}</span>
                  )}
                  {stat.unit ? <span className="text-foreground-secondary">{stat.unit}</span> : null}
                </dd>
                <span
                  data-stat-lock
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-0 h-[3px] origin-left scale-x-0 bg-power transition-transform duration-[var(--motion-reveal)] ease-[var(--ease-spring)] group-hover:scale-x-100"
                />
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
