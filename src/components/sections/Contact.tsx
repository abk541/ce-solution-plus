'use client';

import { useRef } from 'react';

import { ContactForm } from '@/components/sections/ContactForm';
import { CornerTicks } from '@/components/ui/CornerTicks';
import { SectionTag } from '@/components/ui/SectionTag';
import { company, contact } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || motionAllowed !== true) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-contact-panel]', start: 'top 78%', once: true },
      });

      tl.fromTo(
        '[data-panel-edge]',
        { scaleX: 0 },
        { scaleX: 1, duration: duration.reveal, stagger: duration.stagger, ease: ease.expo },
      )
        .fromTo(
          '[data-panel-column]',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: duration.reveal, stagger: duration.stagger, ease: ease.spring },
          0.25,
        )
        .fromTo(
          '[data-contact-field]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: duration.reveal, stagger: duration.stagger, ease: ease.spring },
          0.4,
        );
    }, root);

    return () => ctx.revert();
  }, [motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} id="contact" className="relative z-10 bg-surface-panel py-20 text-foreground-secondary md:py-28 lg:py-36">
      <div className="shell">
        <div className="max-w-3xl">
          <SectionTag index="06">{contact.label}</SectionTag>
          <h2 className="mt-7 display-editorial text-[clamp(2.2rem,5vw,4rem)] text-foreground-primary">{contact.headline}</h2>
          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-foreground-secondary">
            {contact.lede}
          </p>
        </div>

        <div
          data-contact-panel
          className="relative mt-12 border border-border-command/45 bg-surface-canvas/72"
        >
          <CornerTicks size={12} />

          {/* Instrument edges — drawn in by the panel timeline. */}
          <span
            data-panel-edge
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px origin-left bg-accent/70"
          />
          <span
            data-instrument-sweep
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent [animation:sweep-x_7s_cubic-bezier(0.45,0,0.55,1)_infinite]"
          />

          <div className="grid lg:grid-cols-12">
            <div
              data-panel-column
              className="border-b border-border-command/40 p-6 md:p-8 lg:col-span-5 lg:border-b-0 lg:border-r"
            >
              <p className="label-mono text-[0.6rem] text-foreground-muted">Station</p>

              <dl className="mt-8 space-y-7">
                <div>
                  <dt className="label-mono text-[0.56rem] text-foreground-muted">Location</dt>
                  <dd className="mt-2 text-[0.95rem] leading-relaxed text-foreground-primary">
                    {company.address.street}
                    <br />
                    {company.address.city}, {company.address.state} {company.address.zip}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-[0.56rem] text-foreground-muted">Email</dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${company.email}`}
                      className="group inline-flex items-center gap-2 text-[0.95rem] text-foreground-primary transition-colors duration-[var(--motion-micro)] hover:text-accent"
                    >
                      {company.email}
                      <span
                        aria-hidden="true"
                        className="block h-px w-0 bg-accent transition-all duration-[var(--motion-ui)] ease-[var(--ease-spring)] group-hover:w-5"
                      />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-[0.56rem] text-foreground-muted">Voice</dt>
                  <dd className="mt-2">
                    <a
                      href={`tel:${company.phoneHref}`}
                      className="font-mono text-[1.6rem] font-medium tracking-[-0.03em] text-foreground-primary tabular-nums transition-colors duration-[var(--motion-micro)] hover:text-accent"
                    >
                      {company.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-10 border-t border-border-command/40 pt-7">
                <p className="label-mono text-[0.56rem] text-foreground-muted">Designation</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {['VOSB', 'WOSB', 'Small Business'].map((item) => (
                    <li
                      key={item}
                      className="rounded-xs border border-border-command/45 px-3 py-2 label-mono text-[0.55rem] text-foreground-secondary"
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
                    className="label-mono text-[0.58rem] text-foreground-secondary underline underline-offset-8 transition-colors duration-[var(--motion-micro)] hover:text-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div data-panel-column className="p-6 md:p-8 lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
