'use client';

import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { SplitWords } from '@/components/ui/SplitWords';
import { about } from '@/content/site';
import { ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function About() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-word] > span',
        // `y: 0` clears the px baseline GSAP derives from the CSS percentage translate.
        { yPercent: 115, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: 1.2,
          stagger: 0.045,
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
          duration: 1.6,
          ease: 'power2.out',
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
          duration: 0.9,
          stagger: 0.08,
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
          duration: 1,
          stagger: 0.12,
          ease: ease.spring,
          scrollTrigger: { trigger: '[data-about-body]', start: 'top 85%', once: true },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="about"
      className="relative z-10 border-y border-ink-800 bg-ink-900 text-steel-300"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-lines opacity-40" />

      <div className="shell relative py-24 md:py-32 lg:py-40">
        <SectionTag index="01">{about.label}</SectionTag>

        <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <h2
              data-about-statement
              className="display-editorial text-[clamp(2.1rem,5.2vw,4.1rem)] text-paper"
            >
              {about.statement.map((line, index) => (
                <SplitWords
                  key={line}
                  text={line}
                  // Hierarchy by value, not hue: the setup drops back so the
                  // second line lands.
                  className={index === 0 ? 'text-steel-400' : undefined}
                />
              ))}
            </h2>

            <ul
              data-credential-list
              className="mt-12 max-w-md border-t border-ink-700"
            >
              {about.credentials.map((credential) => (
                <li
                  key={credential.label}
                  data-credential
                  className="group flex items-baseline justify-between gap-6 border-b border-ink-700 py-4 transition-colors duration-500 hover:border-steel-400/50"
                >
                  <span className="font-grotesk text-base font-semibold tracking-tight text-steel-100">
                    {credential.label}
                  </span>
                  <span className="label-mono text-[0.62rem] text-steel-400 transition-colors duration-500 group-hover:text-paper">
                    {credential.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-about-body className="lg:col-span-6 lg:pt-3">
            {about.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mb-6 text-[1.02rem] leading-relaxed text-steel-300">
                {paragraph}
              </p>
            ))}

            <blockquote className="relative mt-10 border-l border-steel-400/60 bg-ink-850/70 px-7 py-6">
              <p className="font-grotesk text-[1.4rem] font-bold leading-snug tracking-[-0.03em] text-paper md:text-[1.65rem]">
                {about.pullQuote}
              </p>
            </blockquote>
          </div>
        </div>

        <dl className="mt-20 grid grid-cols-2 gap-px border border-ink-800 bg-ink-800 lg:grid-cols-4">
          {about.stats.map((stat) => {
            const numeric = /^\d+$/.test(stat.value);
            return (
              <div key={stat.label} className="group relative bg-ink-950 px-6 py-8 transition-colors duration-700 hover:bg-ink-850">
                <dt className="label-mono min-h-8 text-[0.6rem] leading-[1.6] text-steel-400">
                  {stat.label}
                </dt>
                <dd className="mt-4 font-mono text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-paper tabular-nums md:text-[3.2rem]">
                  {numeric ? (
                    <span data-count={stat.value}>0</span>
                  ) : (
                    <span>{stat.value}</span>
                  )}
                  {stat.unit ? <span className="text-steel-400">{stat.unit}</span> : null}
                </dd>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-paper transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
