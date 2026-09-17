'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CornerTicks } from '@/components/ui/CornerTicks';
import { Logo } from '@/components/ui/Logo';
import { MagneticAction } from '@/components/ui/MagneticAction';
import { company, navLinks } from '@/content/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/cn';
import { gsap } from '@/lib/gsap';

const SECTION_IDS = navLinks.map((link) => link.href.replace('#', ''));

export function Nav() {
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number>(0);
  const [condensed, setCondensed] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let frame = 0;
    const updateFromScroll = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setCondensed(y > 24);
      if (y < 300) setActive(null);
      if (progressRef.current) {
        gsap.set(progressRef.current, { scaleX: max > 0 ? Math.min(y / max, 1) : 0 });
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateFromScroll);
    };
    updateFromScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-42% 0px -48% 0px', threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      () => {
        setMenuMounted(false);
        requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
      },
      reducedMotion ? 0 : 360,
    );
  }, [reducedMotion]);

  const toggleMenu = () => {
    if (menuMounted) {
      closeMenu();
      return;
    }
    window.clearTimeout(closeTimerRef.current);
    setMenuMounted(true);
    requestAnimationFrame(() => setMenuOpen(true));
  };

  useEffect(() => {
    if (!menuMounted) return;

    const blocked = [
      headerRef.current,
      ...Array.from(document.querySelectorAll<HTMLElement>('main, footer')),
    ].filter((node): node is HTMLElement => node !== null);
    blocked.forEach((node) => node.setAttribute('inert', ''));
    document.body.style.overflow = 'hidden';

    const focusFirst = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>('[data-menu-initial-focus]')?.focus();
    }, reducedMotion ? 0 : 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((node) => !node.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener('keydown', onKeyDown);
      blocked.forEach((node) => node.removeAttribute('inert'));
      document.body.style.overflow = '';
    };
  }, [closeMenu, menuMounted, reducedMotion]);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[var(--motion-ui)]',
          condensed
            ? 'border-b border-ink-700/80 bg-ink-950/95 lg:bg-ink-950/80 lg:backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="shell flex h-18 items-center justify-between gap-6 md:h-20">
          <a
            href="#top"
            aria-label={`${company.name} — home`}
            className="group relative flex items-center gap-4"
          >
            <span data-nav-logo-slot className="block">
              <Logo
                tone="light"
                className="h-6 w-[126px] transition-opacity duration-[var(--motion-micro)] group-hover:opacity-80 md:h-8 md:w-[167px]"
              />
            </span>
            <span aria-hidden="true" className="hidden h-6 w-px bg-ink-600 xl:block" />
            <span className="hidden whitespace-nowrap label-mono text-[0.6rem] text-accent xl:block">
              {company.designationShort}
            </span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const id = link.href.replace('#', '');
              const isActive = active === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    'group relative shrink-0 whitespace-nowrap px-2 py-3 label-mono text-[0.61rem] transition-colors duration-[var(--motion-micro)] xl:px-3',
                    isActive ? 'text-paper' : 'text-steel-400 hover:text-steel-100',
                  )}
                >
                  <span className="mr-2 text-accent tabular-nums">{link.index}</span>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 bottom-1.5 h-px origin-left bg-accent transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
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
              className="hidden border-accent/40 px-5 py-3 text-[0.62rem] text-accent hover:border-accent hover:text-accent-bright sm:inline-flex lg:hidden xl:inline-flex"
            >
              Request capabilities
            </MagneticAction>

            <button
              ref={toggleRef}
              type="button"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="relative flex h-11 w-11 items-center justify-center rounded-xs border border-ink-600 text-steel-100 transition-[border-color,background-color,transform] duration-[var(--motion-micro)] active:scale-95 hover:border-accent/60 lg:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className="relative block h-3 w-5">
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                    menuOpen ? 'top-1.5 rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
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
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent"
        />
      </header>

      {menuMounted ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Primary navigation"
          className={cn(
            'fixed inset-0 z-60 transition-opacity duration-[var(--motion-ui)] lg:hidden',
            menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={closeMenu}
        >
          <div className="absolute inset-0 bg-ink-950/98" />
          <div
            ref={sheetRef}
            className={cn(
              'shell relative flex h-[100dvh] min-h-[100svh] flex-col justify-center gap-2 pb-[max(6rem,env(safe-area-inset-bottom))] pt-24 transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
              menuOpen ? 'translate-y-0' : 'translate-y-4',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-5 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 items-center justify-between">
              <a
                href="#top"
                onClick={closeMenu}
                aria-label={`${company.name} — home`}
                className="flex h-11 items-center"
              >
                <Logo tone="light" className="h-6 w-[126px]" />
              </a>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="relative flex h-11 w-11 items-center justify-center rounded-xs border border-accent/45 text-steel-100 transition-[border-color,background-color,transform] duration-[var(--motion-micro)] active:scale-95 hover:border-accent"
              >
                <span aria-hidden="true" className="relative block h-4 w-4">
                  <span className="absolute left-0 top-2 h-px w-full rotate-45 bg-current" />
                  <span className="absolute left-0 top-2 h-px w-full -rotate-45 bg-current" />
                </span>
              </button>
            </div>
            <CornerTicks className="inset-x-5 inset-y-24" size={12} />
            {navLinks.map((link, index) => {
              const id = link.href.replace('#', '');
              const isActive = active === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  data-menu-initial-focus={index === 0 ? '' : undefined}
                  aria-current={isActive ? 'location' : undefined}
                  style={{ transitionDelay: `${index * 45}ms` }}
                  className={cn(
                    'flex items-baseline gap-5 border-b py-5 transition-[opacity,transform,border-color] duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                    isActive ? 'border-accent/60' : 'border-ink-800',
                    menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  )}
                >
                  <span className="label-mono text-[0.65rem] text-accent tabular-nums">
                    {link.index}
                  </span>
                  <span
                    className={cn(
                      'font-grotesk text-3xl font-semibold tracking-tight',
                      isActive ? 'text-accent-bright' : 'text-paper',
                    )}
                  >
                    {link.label}
                  </span>
                </a>
              );
            })}
            <div onClick={closeMenu}>
              <MagneticAction href="#contact" variant="solid" className="mt-8 w-full">
                Request capabilities
              </MagneticAction>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
