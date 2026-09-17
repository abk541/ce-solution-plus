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
          'fixed inset-x-0 top-0 z-50 border-b border-ink-700/55 bg-ink-950/94 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,backdrop-filter] duration-[var(--motion-ui)]',
          condensed
            ? 'border-b border-ink-700/80 bg-ink-950/95 lg:bg-ink-950/80 lg:backdrop-blur-xl'
            : 'lg:border-b-transparent lg:bg-transparent',
        )}
      >
        <div
          data-nav-shell
          className="shell flex h-16 items-center justify-between gap-3 md:h-20 md:gap-6"
        >
          <a
            href="#top"
            aria-label={`${company.name} — home`}
            className="group relative flex min-w-0 items-center gap-4"
          >
            <span data-nav-logo-slot className="block">
              <Logo
                tone="light"
                className="h-[24px] w-[126px] transition-opacity duration-[var(--motion-micro)] group-hover:opacity-80 md:h-[32px] md:w-[167px]"
              />
            </span>
            <span aria-hidden="true" className="hidden h-6 w-px bg-ink-600 xl:block" />
            <span className="hidden whitespace-nowrap label-mono text-[0.6rem] text-power-bright xl:block">
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
                  <span className="mr-2 text-power-bright tabular-nums">{link.index}</span>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 bottom-1.5 h-[2px] origin-left bg-power transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    )}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <MagneticAction
              href="#contact"
              variant="outline"
              strength={6}
              className="hidden px-5 py-3 text-[0.62rem] sm:inline-flex lg:hidden xl:inline-flex"
            >
              Request capabilities
            </MagneticAction>

            <button
              ref={toggleRef}
              type="button"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xs border border-ink-600 text-steel-100 transition-[border-color,background-color,transform] duration-[var(--motion-micro)] active:scale-95 hover:border-power/70 lg:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className="relative block h-[12px] w-[20px]">
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                    menuOpen ? 'top-[6px] rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                    menuOpen ? 'top-[6px] -rotate-45' : 'top-[12px]',
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-power"
        />
      </header>

      {menuMounted ? (
        <div
          ref={sheetRef}
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
          <div className="absolute inset-0 bg-ink-950" />
          <div
            className="fixed inset-x-0 top-0 z-20 flex h-[calc(76px+env(safe-area-inset-top))] items-center justify-between border-b border-ink-700/55 bg-ink-950 pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]"
            onClick={(event) => event.stopPropagation()}
          >
            <a
              href="#top"
              onClick={closeMenu}
              aria-label={`${company.name} — home`}
              className="flex h-[44px] items-center"
            >
              <Logo tone="light" className="h-[24px] w-[126px]" />
            </a>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="relative flex h-[44px] w-[44px] items-center justify-center rounded-xs border border-power/60 text-steel-100 transition-[border-color,background-color,transform] duration-[var(--motion-micro)] active:scale-95 hover:border-power"
            >
              <span aria-hidden="true" className="relative block h-[16px] w-[16px]">
                <span className="absolute left-0 top-[8px] h-px w-full rotate-45 bg-current" />
                <span className="absolute left-0 top-[8px] h-px w-full -rotate-45 bg-current" />
              </span>
            </button>
          </div>
          <div
            data-mobile-menu-sheet
            className={cn(
              'shell relative flex h-[100dvh] min-h-[100svh] flex-col justify-center gap-2 overflow-y-auto overscroll-contain pb-[max(6rem,env(safe-area-inset-bottom))] pt-24 transition-transform duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
              menuOpen ? 'translate-y-0' : 'translate-y-4',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <CornerTicks
              className="bottom-24 left-[max(20px,env(safe-area-inset-left))] right-[max(20px,env(safe-area-inset-right))] top-24"
              size={12}
            />
            {navLinks.map((link, index) => {
              const id = link.href.replace('#', '');
              const isActive = active === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  data-menu-initial-focus={index === 0 ? '' : undefined}
                  data-mobile-menu-link
                  aria-current={isActive ? 'location' : undefined}
                  style={{ transitionDelay: `${index * 45}ms` }}
                  className={cn(
                    'flex items-baseline gap-5 border-b py-5 transition-[opacity,transform,border-color] duration-[var(--motion-ui)] ease-[var(--ease-spring)]',
                    isActive ? 'border-power/75' : 'border-ink-800',
                    menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  )}
                >
                  <span className="label-mono text-[0.65rem] text-power-bright tabular-nums">
                    {link.index}
                  </span>
                  <span
                    data-mobile-menu-label
                    className={cn(
                      'font-grotesk text-3xl font-semibold tracking-tight',
                      isActive ? 'text-power-bright' : 'text-paper',
                    )}
                  >
                    {link.label}
                  </span>
                </a>
              );
            })}
            <div data-mobile-menu-cta onClick={closeMenu}>
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
