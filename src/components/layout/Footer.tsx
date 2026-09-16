'use client';

import { useRef } from 'react';

import { Logo } from '@/components/ui/Logo';
import { company, footer, navLinks } from '@/content/site';
import { ease, gsap } from '@/lib/gsap';
import {
  useFullMotion,
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const fullMotion = useFullMotion();
  const year = new Date().getFullYear();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || fullMotion !== true) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-footer-item]',
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: ease.spring,
          scrollTrigger: { trigger: root, start: 'top 90%', once: true },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [fullMotion, reducedMotion]);

  return (
    <footer ref={rootRef} className="relative z-10 border-t border-ink-800 bg-ink-950">
      <div className="shell py-16 md:py-20">
        <p
          data-footer-item
          className="max-w-4xl display-editorial text-[clamp(1.7rem,4.2vw,3.2rem)] text-steel-100"
        >
          {footer.statement}
        </p>

        <div className="mt-14 grid gap-12 border-t border-ink-800 pt-12 md:grid-cols-12">
          <div data-footer-item className="md:col-span-4">
            <Logo tone="light" variant="full" className="h-11 w-[222px]" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-steel-400">
              {company.designation} providing mission support to national security, intelligence,
              and cyber programs.
            </p>
          </div>

          <nav data-footer-item aria-label="Footer" className="md:col-span-3">
            <p className="label-mono text-[0.56rem] text-steel-400">Navigate</p>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-steel-200 transition-colors duration-300 hover:text-accent"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-0 bg-accent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-4"
                    />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div data-footer-item className="md:col-span-3">
            <p className="label-mono text-[0.56rem] text-steel-400">Contact</p>
            <address className="mt-5 not-italic text-sm leading-relaxed text-steel-200">
              {company.address.street}
              <br />
              {company.address.city}, {company.address.state} {company.address.zip}
              <br />
              <a
                href={`mailto:${company.email}`}
                className="mt-3 inline-block transition-colors duration-300 hover:text-accent"
              >
                {company.email}
              </a>
              <br />
              <a
                href={`tel:${company.phoneHref}`}
                className="transition-colors duration-300 hover:text-accent"
              >
                {company.phone}
              </a>
            </address>
          </div>

          <div data-footer-item className="md:col-span-2">
            <p className="label-mono text-[0.56rem] text-steel-400">Connect</p>
            <ul className="mt-5 space-y-3">
              {/* PLACEHOLDER: real social URLs live in src/content/site.ts. */}
              {company.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-steel-200 transition-colors duration-300 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* PLACEHOLDER: confirm registration lines before launch. */}
        <ul
          data-footer-item
          className="mt-14 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink-800 pt-8"
        >
          {footer.registrations.map((item) => (
            <li key={item} className="label-mono text-[0.55rem] text-steel-400">
              <span aria-hidden="true" className="mr-2 text-accent/60">
                &#9656;
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div
          data-footer-item
          className="mt-10 flex flex-col gap-4 border-t border-ink-800 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="label-mono text-[0.55rem] text-steel-400">
            &copy; {year} {company.name}. All rights reserved.
          </p>
          <a
            href="#top"
            className="group inline-flex items-center gap-3 label-mono text-[0.55rem] text-steel-400 transition-colors duration-300 hover:text-accent"
          >
            Back to top
            <svg viewBox="0 0 10 14" aria-hidden="true" className="h-3 w-2.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1" fill="none">
              <path d="M5 14V1M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
