'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > Math.max(window.innerHeight * 0.9, 560));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <a
      href="#top"
      data-back-to-top
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex min-h-11 items-center gap-2 border border-ink-600 bg-ink-950/92 px-3.5 py-3 label-mono text-[0.55rem] text-steel-200 backdrop-blur-md',
        'transition-[opacity,transform,border-color,color] duration-[var(--motion-ui)] ease-[var(--ease-spring)] hover:border-accent hover:text-accent focus-visible:border-accent md:bottom-6 md:right-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <span>Top</span>
      <svg viewBox="0 0 12 14" aria-hidden="true" className="h-3.5 w-3">
        <path d="M6 14V1M1.5 5.5 6 1l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </a>
  );
}
