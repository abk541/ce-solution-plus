'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CornerTicks } from '@/components/ui/CornerTicks';
import { Logo } from '@/components/ui/Logo';
import { MagneticAction } from '@/components/ui/MagneticAction';
import { company, navLinks } from '@/content/site';
import { cn } from '@/lib/cn';
import { gsap } from '@/lib/gsap';
import {
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

const SECTION_IDS = navLinks.map((link) => link.href.replace('#', ''));

export function Nav() {
  const barRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Hide on scroll-down, reveal on scroll-up. Driven off raw scroll rather than
  // ScrollTrigger so it stays responsive while Lenis is mid-flight.
  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let last = window.scrollY;
    let hidden = false;
    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      gsap.to(bar, {
        yPercent: next ? -130 : 0,
        duration: reducedMotion ? 0 : 0.55,
        ease: 'power3.out',
      });
    };

    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setCondensed(y > 24);
      if (y < 300) setActive(null);
      if (progressRef.current) {
        gsap.set(progressRef.current, { scaleX: max > 0 ? Math.min(y / max, 1) : 0 });
      }
      if (!menuOpen) setHidden(y > last && y > 280);
      last = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen, reducedMotion]);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header
        ref={barRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500',
          condensed
            ? 'border-b border-ink-700/80 bg-ink-950/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="shell flex h-18 items-center justify-between gap-6 md:h-20">
          <a
            href="#top"
            aria-label={`${company.name} — home`}
            className="group relative flex items-center gap-4"
          >
            {/* Real brand artwork — off-white export of logo.avif for dark surfaces.
                Sized so the Didone hairlines survive; below ~24px they fill in.
                ScrollLogo measures this slot and hides it until the mark docks. */}
            <span data-nav-logo-slot className="block transition-opacity duration-200">
              <Logo
                tone="light"
                priority
                className="h-6 w-[126px] transition-opacity duration-300 group-hover:opacity-80 md:h-8 md:w-[167px]"
              />
            </span>
            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-ink-600 xl:block"
            />
            <span className="hidden whitespace-nowrap label-mono text-[0.6rem] text-accent xl:block">
              {company.designationShort}
            </span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link, index) => {
              const id = link.href.replace('#', '');
              const isActive = active === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'group relative px-4 py-3 label-mono text-[0.65rem] transition-colors duration-300',
                    isActive ? 'text-paper' : 'text-steel-400 hover:text-steel-100',
                  )}
                >
                  <span className="mr-2 text-accent/70 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 bottom-1.5 h-px origin-left bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    )}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <MagneticAction
              href="#contact"
              variant="outline"
              strength={6}
              className="hidden border-accent/40 px-5 py-3 text-[0.62rem] text-accent hover:border-accent hover:text-accent-bright sm:inline-flex"
            >
              Request capabilities
            </MagneticAction>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="relative flex h-11 w-11 items-center justify-center rounded-xs border border-ink-600 text-steel-100 transition-colors duration-300 hover:border-accent/60 lg:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className="relative block h-3 w-5">
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    menuOpen ? 'top-1.5 rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    menuOpen ? 'top-1.5 -rotate-45' : 'top-3',
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent/80"
        />
      </header>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="fixed inset-0 z-40 lg:hidden"
        onClick={closeMenu}
      >
        <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-xl" />
        <div className="shell relative flex h-full flex-col justify-center gap-2 pb-24 pt-24">
          <CornerTicks className="inset-x-5 inset-y-24" size={12} />
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              style={{ transitionDelay: `${index * 45}ms` }}
              className={cn(
                'flex items-baseline gap-5 border-b border-ink-800 py-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <span className="label-mono text-[0.65rem] text-accent tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-grotesk text-3xl font-semibold tracking-tight text-paper">
                {link.label}
              </span>
            </a>
          ))}
          <MagneticAction href="#contact" variant="solid" className="mt-8 w-full">
            Request capabilities
          </MagneticAction>
        </div>
      </div>
    </>
  );
}
