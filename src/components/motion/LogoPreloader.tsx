'use client';

import { useEffect, useRef, useState } from 'react';

import { company } from '@/content/site';
import {
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';
import { sitePath } from '@/lib/site-path';

const SEEN_KEY = 'ce-entry-seen';
const POINTS_SRC = sitePath('/brand/logo-points.bin');
const LOCKUP_SRC = sitePath('/brand/logo-compact-clean.webp');

const CONVERGE_MS = 760;
const HOLD_MS = 180;
const DISPERSE_MS = 360;
const EXIT_AT_MS = 1000;
const FINISH_AT_MS = 1400;
const HARD_STOP_MS = 1750;
const MOBILE_EXIT_AT_MS = 620;
const MOBILE_FINISH_AT_MS = 900;

type Particle = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  delay: number;
  speed: number;
  accent: boolean;
};

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function easeOutExpo(value: number) {
  return value >= 1 ? 1 : 1 - 2 ** (-10 * value);
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function LogoPreloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const [mounted, setMounted] = useState(true);
  const [formed, setFormed] = useState(false);
  const [flaring, setFlaring] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (motionAllowed === null) return;

    const forceIntro = new URLSearchParams(window.location.search).get('intro') === '1';
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Private browsing and locked-down environments may deny storage.
    }

    if (reducedMotion || !motionAllowed || (seen && !forceIntro)) {
      document.documentElement.classList.remove('motion-entry');
      window.dispatchEvent(new CustomEvent('ce:intro-exit'));
      setMounted(false);
      return;
    }

    const startedAt = performance.now();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const compact = matchMedia('(max-width: 1023px), (hover: none), (pointer: coarse)').matches;
    const timers: number[] = [];
    let animationFrame = 0;
    let stopped = false;
    let particles: Particle[] = [];
    const pointRequest = new AbortController();

    const finish = () => {
      if (stopped) return;
      stopped = true;
      timers.forEach(window.clearTimeout);
      cancelAnimationFrame(animationFrame);
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Completion and scroll restoration never depend on storage access.
      }
      document.documentElement.classList.remove('motion-entry');
      document.documentElement.style.overflow = '';
      window.dispatchEvent(new CustomEvent('ce:intro-complete'));
      setMounted(false);
    };

    const beginExit = () => {
      if (stopped) return;
      setLeaving(true);
      window.dispatchEvent(new CustomEvent('ce:intro-exit'));
    };

    // The phone intro is a prepaint-anchored, crisp brand reveal. Its deadline
    // is measured from the inline script rather than hydration, so slow mobile
    // JS can never restart or extend the curtain after the hero is visible.
    if (compact) {
      const entryStart = Number(document.documentElement.dataset.entryStart) || startedAt;
      const elapsed = performance.now() - entryStart;
      setFormed(true);
      setFlaring(true);

      if (!document.documentElement.classList.contains('motion-entry')) {
        beginExit();
        finish();
        return;
      }

      timers.push(
        window.setTimeout(beginExit, Math.max(0, MOBILE_EXIT_AT_MS - elapsed)),
        window.setTimeout(finish, Math.max(0, MOBILE_FINISH_AT_MS - elapsed)),
      );

      return () => {
        stopped = true;
        timers.forEach(window.clearTimeout);
      };
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      document.documentElement.classList.remove('motion-entry');
      window.dispatchEvent(new CustomEvent('ce:intro-exit'));
      setMounted(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particleLimit = 1600;
    const cell = 1.4;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.documentElement.style.overflow = 'hidden';

    timers.push(
      window.setTimeout(() => setFormed(true), 420),
      window.setTimeout(() => setFlaring(true), 760),
      window.setTimeout(beginExit, EXIT_AT_MS),
      window.setTimeout(finish, FINISH_AT_MS),
      window.setTimeout(finish, HARD_STOP_MS),
    );

    const draw = (now: number) => {
      if (stopped) return;
      const elapsed = now - startedAt;
      const converge = clamp01(elapsed / CONVERGE_MS);
      const disperse = clamp01((elapsed - CONVERGE_MS - HOLD_MS) / DISPERSE_MS);
      const outward = disperse * disperse;
      const paperPath = new Path2D();
      const accentPath = new Path2D();

      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const local = clamp01((converge - particle.delay) / (1 - particle.delay));
        if (local < 0.03) continue;
        const eased = easeOutExpo(local);
        let x = particle.sx + (particle.tx - particle.sx) * eased;
        let y = particle.sy + (particle.ty - particle.sy) * eased;
        let size = cell * clamp01(local * 2);

        if (disperse > 0) {
          const travel = outward * particle.speed * Math.max(width, height) * 0.42;
          x += particle.ex * travel;
          y += particle.ey * travel;
          size *= 1 + outward;
        }

        (particle.accent ? accentPath : paperPath).rect(x, y, size, size);
      }
      context.globalAlpha = 0.88 * (1 - disperse);
      context.fillStyle = '#F2F3EF';
      context.fill(paperPath);
      context.globalAlpha = 0.68 * (1 - disperse);
      context.fillStyle = '#FF5C3D';
      context.fill(accentPath);
      context.globalAlpha = 1;

      if (elapsed < FINISH_AT_MS) animationFrame = requestAnimationFrame(draw);
    };

    // The logo coordinates are sampled at build time and stored as uint16
    // pairs. That keeps image decode + getImageData work off the visitor's main
    // thread while preserving the real lockup silhouette.
    fetch(POINTS_SRC, { signal: pointRequest.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (stopped) return;
        const targetWidth = Math.min(width * (compact ? 0.8 : 0.58), 760);
        const targetHeight = targetWidth * (304 / 1590);
        const view = new DataView(buffer);
        const pointCount = Math.floor(view.byteLength / 4);
        const count = Math.min(pointCount, particleLimit);
        const random = seededRandom(0xce501);
        const centerX = width / 2;
        const centerY = height / 2;
        const built: Particle[] = [];

        for (let index = 0; index < count; index += 1) {
          const pointIndex = Math.floor((index * pointCount) / count);
          const x = view.getUint16(pointIndex * 4, true) / 65535;
          const y = view.getUint16(pointIndex * 4 + 2, true) / 65535;
          const tx = centerX + (x - 0.5) * targetWidth;
          const ty = centerY + (y - 0.5) * targetHeight;
          const angle = random() * Math.PI * 2;
          const radius = Math.max(width, height) * (0.43 + random() * 0.35);
          const exitAngle =
            Math.atan2(ty - centerY, tx - centerX) + (random() - 0.5) * 0.28;

          built.push({
            tx,
            ty,
            sx: centerX + Math.cos(angle) * radius,
            sy: centerY + Math.sin(angle) * radius,
            ex: Math.cos(exitAngle),
            ey: Math.sin(exitAngle),
            delay: random() * 0.34,
            speed: 0.45 + random() * 0.55,
            accent: random() > 0.88,
          });
        }

        particles = built;
      })
      .catch(() => {
        // The crisp DOM lockup remains a complete intro if points fail to load.
      });
    animationFrame = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      timers.forEach(window.clearTimeout);
      cancelAnimationFrame(animationFrame);
      pointRequest.abort();
      document.documentElement.style.overflow = '';
    };
  }, [motionAllowed, reducedMotion]);

  if (!mounted) return null;

  return (
    <div
      data-logo-preloader
      role="status"
      aria-live="polite"
      aria-label={`${company.name} — preparing site`}
      className={[
        'fixed inset-x-0 top-0 z-100 h-[100dvh] min-h-[100svh] touch-none overflow-hidden overscroll-none',
        'bg-[linear-gradient(180deg,#163B5C_0%,#10283E_58%,#10283E_100%)]',
        'transition-opacity duration-[240ms] ease-[var(--ease-precise)] lg:duration-[360ms]',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18] [background-size:180px_180px]"
        style={{ backgroundImage: `url("${sitePath('/images/grain.svg')}")` }}
      />
      <div
        aria-hidden="true"
        className={[
          'pointer-events-none absolute inset-0 transition-opacity duration-[560ms]',
          flaring ? 'opacity-100' : 'opacity-55',
          '[background:radial-gradient(45%_34%_at_50%_50%,rgba(53,94,147,0.22),transparent_70%)]',
        ].join(' ')}
      />

      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 hidden lg:block" />

      <img
        data-loader-lockup
        aria-hidden="true"
        src={LOCKUP_SRC}
        alt=""
        width={1590}
        height={304}
        draggable={false}
        className={[
          'absolute left-1/2 top-1/2 aspect-[1590/304] w-[min(84vw,760px)] -translate-x-1/2 -translate-y-1/2 object-contain [filter:brightness(0.94)_sepia(0.04)]',
          'transition-[opacity,transform] duration-[420ms] ease-[var(--ease-spring)]',
          'scale-100 opacity-100',
          formed ? 'lg:scale-100 lg:opacity-100' : 'lg:scale-[0.985] lg:opacity-0',
        ].join(' ')}
      />

      <div
        data-loader-mobile-status
        className="absolute left-1/2 top-[calc(50%+4.5rem)] flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-200 lg:hidden"
      >
        <span className="whitespace-nowrap label-mono text-[0.52rem] tracking-[0.19em] text-steel-200">
          Mission support systems
        </span>
        <span aria-hidden="true" className="relative h-px w-28 overflow-hidden bg-paper/20">
          <span className="absolute inset-y-0 w-10 bg-linear-to-r from-transparent via-power to-transparent [animation:loader-scan_720ms_var(--ease-precise)_infinite]" />
        </span>
      </div>

      <div
        className={[
          'absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] hidden flex-col items-center gap-3 lg:flex',
          'transition-opacity duration-[200ms]',
          leaving ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <span className="label-mono text-[0.55rem] text-steel-300">
          Mission support systems
        </span>
        <span aria-hidden="true" className="relative h-px w-32 overflow-hidden bg-paper/15">
          <span className="absolute inset-y-0 w-12 bg-linear-to-r from-transparent via-power to-transparent [animation:loader-scan_900ms_var(--ease-precise)_infinite]" />
        </span>
      </div>
    </div>
  );
}
