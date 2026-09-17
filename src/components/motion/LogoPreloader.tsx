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

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      document.documentElement.classList.remove('motion-entry');
      window.dispatchEvent(new CustomEvent('ce:intro-exit'));
      setMounted(false);
      return;
    }

    const startedAt = performance.now();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const compact = width < 768 || matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
    const particleLimit = compact ? 900 : 1600;
    const timers: number[] = [];
    let animationFrame = 0;
    let stopped = false;
    let particles: Particle[] = [];
    const cell = compact ? 1.55 : 1.4;
    const pointRequest = new AbortController();

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // CSS keeps the short-lived field pinned to the dynamic viewport. Small
    // iOS toolbar changes scale the buffer with the curtain instead of exposing
    // an edge or separating particles from the centred DOM lockup.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.documentElement.style.overflow = 'hidden';

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
      context.fillStyle = '#eaf0f1';
      context.fill(paperPath);
      context.globalAlpha = 0.82 * (1 - disperse);
      context.fillStyle = '#8dafc0';
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
            accent: random() > 0.82,
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
        'fixed inset-0 z-100 h-[100dvh] min-h-[100svh] touch-none overflow-hidden overscroll-none',
        'bg-[linear-gradient(180deg,#2b516a_0%,#18334a_52%,#102638_100%)]',
        'transition-[opacity,transform] duration-[360ms] ease-[var(--ease-spring)]',
        leaving ? 'pointer-events-none -translate-y-[1.5%] opacity-0' : 'opacity-100',
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
          '[background:radial-gradient(45%_34%_at_50%_50%,rgba(141,175,192,0.2),transparent_70%)]',
        ].join(' ')}
      />

      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block" />

      <div
        aria-hidden="true"
        className={[
          'absolute left-1/2 top-1/2 aspect-[1590/304] w-[min(80vw,760px)] -translate-x-1/2 -translate-y-1/2',
          'transition-[opacity,transform] duration-[420ms] ease-[var(--ease-spring)]',
          formed ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-0',
          leaving ? 'scale-[1.015] opacity-0' : '',
        ].join(' ')}
        style={{
          backgroundColor: 'var(--color-paper)',
          WebkitMaskImage: `url("${LOCKUP_SRC}")`,
          maskImage: `url("${LOCKUP_SRC}")`,
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />

      <div
        className={[
          'absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3',
          'transition-opacity duration-[200ms]',
          leaving ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <span className="label-mono text-[0.55rem] text-steel-300">
          Mission support systems
        </span>
        <span aria-hidden="true" className="relative h-px w-32 overflow-hidden bg-paper/15">
          <span className="absolute inset-y-0 w-12 bg-linear-to-r from-transparent via-accent to-transparent [animation:loader-scan_900ms_var(--ease-precise)_infinite]" />
        </span>
      </div>
    </div>
  );
}
