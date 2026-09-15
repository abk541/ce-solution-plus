'use client';

import { useRef } from 'react';

import { ContactForm } from '@/components/sections/ContactForm';
import { CornerTicks } from '@/components/ui/CornerTicks';
import { SectionTag } from '@/components/ui/SectionTag';
import { company, contact } from '@/content/site';
import { ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-contact-panel]', start: 'top 78%', once: true },
      });

      tl.fromTo(
        '[data-panel-edge]',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, stagger: 0.08, ease: ease.expo },
      )
        .fromTo(
          '[data-panel-column]',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: ease.spring },
          0.25,
        )
        .fromTo(
          '[data-contact-field]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: ease.spring },
          0.4,
        );
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="contact" className="relative z-10 py-24 md:py-32 lg:py-40">
      <div className="shell">
        <div className="max-w-3xl">
          <SectionTag index="06">{contact.label}</SectionTag>
          <h2 className="mt-7 display-editorial text-[clamp(2.2rem,5vw,4rem)]">{contact.headline}</h2>
          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-steel-300">
            {contact.lede}
          </p>
        </div>

        <div
          data-contact-panel
          className="relative mt-14 border border-ink-700 bg-ink-900/50 backdrop-blur-sm"
        >
          <CornerTicks size={12} />

          {/* Instrument edges — drawn in by the panel timeline. */}
          <span
            data-panel-edge
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px origin-left bg-accent/60"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent [animation:sweep-x_7s_cubic-bezier(0.45,0,0.55,1)_infinite]"
          />

          <div className="grid lg:grid-cols-12">
            <div
              data-panel-column
              className="border-b border-ink-700 p-8 md:p-10 lg:col-span-5 lg:border-b-0 lg:border-r"
            >
              <p className="label-mono text-[0.6rem] text-steel-400">Station</p>

              <dl className="mt-8 space-y-7">
                <div>
                  <dt className="label-mono text-[0.56rem] text-steel-400">Location</dt>
                  <dd className="mt-2 text-[0.95rem] leading-relaxed text-steel-100">
                    {company.address.street}
                    <br />
                    {company.address.city}, {company.address.state} {company.address.zip}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-[0.56rem] text-steel-400">Email</dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${company.email}`}
                      className="group inline-flex items-center gap-2 text-[0.95rem] text-steel-100 transition-colors duration-300 hover:text-accent"
                    >
                      {company.email}
                      <span
                        aria-hidden="true"
                        className="block h-px w-0 bg-accent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-5"
                      />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-[0.56rem] text-steel-400">Voice</dt>
                  <dd className="mt-2">
                    <a
                      href={`tel:${company.phoneHref}`}
                      className="font-mono text-[1.6rem] font-medium tracking-[-0.03em] text-paper tabular-nums transition-colors duration-300 hover:text-accent"
                    >
                      {company.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-10 border-t border-ink-700 pt-7">
                <p className="label-mono text-[0.56rem] text-steel-400">Designation</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {['VOSB', 'WOSB', 'Small Business'].map((item) => (
                    <li
                      key={item}
                      className="rounded-xs border border-ink-600 px-3 py-2 label-mono text-[0.55rem] text-steel-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex gap-6">
                {/* PLACEHOLDER: real social URLs live in src/content/site.ts. */}
                {company.social.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-mono text-[0.58rem] text-steel-400 underline underline-offset-8 transition-colors duration-300 hover:text-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div data-panel-column className="p-8 md:p-10 lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
