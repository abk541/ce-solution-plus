'use client';

import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { SplitWords } from '@/components/ui/SplitWords';
import { about } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function About() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();

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

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((node) => {
        const target = Number(node.dataset.count);
        if (Number.isNaN(target)) return;
        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          duration: duration.feature,
          ease: 'power2.out',
          onStart: () => {
            node.textContent = '0';
          },
          onUpdate: () => {
            node.textContent = String(Math.round(proxy.value));
          },
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        });
      });

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
  }, [motionAllowed, reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="about"
      className="relative z-10 border-y border-field-300 bg-field-100 text-ink-800"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-lines-light opacity-55" />

      <div className="shell relative py-20 md:py-28 lg:py-36">
        <SectionTag index="01" tone="light">{about.label}</SectionTag>

        <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <h2
              data-about-statement
              className="display-editorial text-[clamp(2.1rem,5.2vw,4.1rem)] text-ink-950"
            >
              {about.statement.map((line, index) => (
                <SplitWords
                  key={line}
                  text={line}
                  // Hierarchy by value, not hue: the setup drops back so the
                  // second line lands.
                  className={index === 0 ? 'text-ink-700' : undefined}
                />
              ))}
            </h2>

            <ul
              data-credential-list
              className="mt-12 max-w-md border-t border-field-300"
            >
              {about.credentials.map((credential) => (
                <li
                  key={credential.label}
                  data-credential
                  className="group flex items-baseline justify-between gap-6 border-b border-field-300 py-4 transition-colors duration-[var(--motion-ui)] hover:border-accent-ink/50"
                >
                  <span className="font-grotesk text-base font-semibold tracking-tight text-ink-950">
                    {credential.label}
                  </span>
                  <span className="label-mono text-[0.62rem] text-ink-700 transition-colors duration-[var(--motion-ui)] group-hover:text-accent-ink">
                    {credential.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-about-body className="lg:col-span-6 lg:pt-3">
            {about.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mb-6 text-[1.02rem] leading-relaxed text-ink-700">
                {paragraph}
              </p>
            ))}

            <blockquote className="relative mt-10 border-l-2 border-accent-ink bg-field-50 px-7 py-6">
              <p className="font-grotesk text-[1.4rem] font-bold leading-snug tracking-[-0.03em] text-ink-950 md:text-[1.65rem]">
                {about.pullQuote}
              </p>
            </blockquote>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-1 gap-px border border-field-300 bg-field-300 sm:grid-cols-3">
          {about.stats.map((stat) => {
            const numeric = /^\d+$/.test(stat.value);
            return (
              <div key={stat.label} className="group relative bg-field-50 px-6 py-8 transition-colors duration-[var(--motion-reveal)] hover:bg-field-200">
                <dt className="label-mono min-h-8 text-[0.6rem] leading-[1.6] text-ink-700">
                  {stat.label}
                </dt>
                <dd className="mt-4 font-mono text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-ink-950 tabular-nums md:text-[3.2rem]">
                  {numeric ? (
                    <span data-count={stat.value}>{stat.value}</span>
                  ) : (
                    <span>{stat.value}</span>
                  )}
                  {stat.unit ? <span className="text-ink-700">{stat.unit}</span> : null}
                </dd>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-accent-ink transition-transform duration-[var(--motion-reveal)] ease-[var(--ease-spring)] group-hover:scale-x-100"
                />
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
