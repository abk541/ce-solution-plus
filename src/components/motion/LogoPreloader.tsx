'use client';

import { useEffect, useRef, useState } from 'react';

import { company } from '@/content/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { sitePath } from '@/lib/site-path';

/**
 * Full-screen entry sequence.
 *
 * Three phases:
 *   CONVERGE  particles fly in from outside the frame and resolve the lockup
 *   FLARE     the formed logo holds and blooms, with a specular sweep across it
 *   DISPERSE  particles accelerate outward and the curtain lifts
 *
 * Coverage is the whole game here: the lockup's tagline is hairline-fine, so
 * particles are placed one-per-opaque-source-pixel at close to display
 * resolution rather than randomly sampled. Random sampling leaves gaps and
 * clumps, which is what makes this kind of effect look pixelated.
 *
 * Deliberately 2D canvas, not WebGL — this is first paint and must not wait on
 * the Three.js chunk. Runs once per session, skipped under reduced motion.
 */

const SEEN_KEY = 'ce-entry-seen';
const MARK_SRC = sitePath('/brand/logo-light.png');

const CONVERGE = 2200;
const FLARE = 1100;
const DISPERSE = 850;
/** Hard ceiling so low-end machines don't try to draw a six-figure particle count. */
const MAX_PARTICLES = 30000;

type Particle = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  /** Outward unit vector used by the disperse phase. */
  ex: number;
  ey: number;
  delay: number;
  speed: number;
  bright: number;
};

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function easeInQuad(t: number): number {
  return t * t;
}

export function LogoPreloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reducedMotion || sessionStorage.getItem(SEEN_KEY)) {
      setMounted(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMounted(false);
      return;
    }

    document.documentElement.style.overflow = 'hidden';

    let raf = 0;
    let cancelled = false;
    let particles: Particle[] = [];
    let startedAt = 0;
    let w = 0;
    let h = 0;
    let minX = 0;
    let maxX = 0;
    let cell = 1.7;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const finish = () => {
      if (cancelled) return;
      sessionStorage.setItem(SEEN_KEY, '1');
      document.documentElement.style.overflow = '';
      setMounted(false);
    };

    const draw = (now: number) => {
      if (cancelled) return;
      const t = now - startedAt;

      const converge = Math.min(t / CONVERGE, 1);
      const flare = Math.min(Math.max((t - CONVERGE) / FLARE, 0), 1);
      const disperse = Math.min(Math.max((t - CONVERGE - FLARE) / DISPERSE, 0), 1);

      ctx.clearRect(0, 0, w, h);

      // Specular line travels the width of the lockup during the flare.
      const sweepX = minX - 160 + (maxX - minX + 320) * flare;
      const dispEase = easeInQuad(disperse);

      for (const p of particles) {
        const local = Math.min(Math.max((converge - p.delay) / (1 - p.delay), 0), 1);
        const e = easeOutQuint(local);
        let x = p.sx + (p.tx - p.sx) * e;
        let y = p.sy + (p.ty - p.sy) * e;

        let alpha = Math.min(local * 2, 1) * p.bright;
        let s = cell;

        if (flare > 0) {
          // Bloom: everything lifts, and the sweep line flares locally.
          const spec = Math.max(0, 1 - Math.abs(x - sweepX) / 150);
          const bloom = Math.sin(flare * Math.PI) * 0.35;
          alpha = Math.min(1, alpha + bloom + spec * 0.85);
          s = cell * (1 + spec * 1.1 + bloom * 0.5);
        }

        if (disperse > 0) {
          // Accelerate outward and fade.
          const travel = dispEase * p.speed * Math.max(w, h) * 0.9;
          x += p.ex * travel;
          y += p.ey * travel;
          alpha *= 1 - disperse;
          s = cell * (1 + dispEase * 1.6);
        }

        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;

      if (barRef.current) barRef.current.style.transform = `scaleX(${converge})`;
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.round(converge * 100)).padStart(3, '0');
      }

      // Start lifting the curtain as the particles blow out, not after.
      if (disperse > 0 && !cancelled) setLeaving(true);

      if (t < CONVERGE + FLARE + DISPERSE) raf = requestAnimationFrame(draw);
      else finish();
    };

    const img = new Image();
    // `decode()` hangs in Chromium for images never attached to the document.
    img.onerror = () => {
      document.documentElement.style.overflow = '';
      setMounted(false);
    };
    img.onload = () => {
      if (cancelled) return;
      size();

      const targetW = Math.min(w * 0.64, 900);
      // Sample at roughly the drawn size so one source pixel maps to one
      // particle and the tagline stays legible.
      const sampleW = Math.round(Math.min(targetW, 900));
      const sampleH = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * sampleW));

      const off = document.createElement('canvas');
      off.width = sampleW;
      off.height = sampleH;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, sampleW, sampleH);
      const { data } = octx.getImageData(0, 0, sampleW, sampleH);

      const hits: number[] = [];
      for (let i = 0; i < sampleW * sampleH; i += 1) {
        if (data[i * 4 + 3] > 60) hits.push(i);
      }
      if (!hits.length) {
        document.documentElement.style.overflow = '';
        setMounted(false);
        return;
      }

      // Even stride keeps coverage uniform when the cap is hit; random
      // selection would reintroduce the gaps this is meant to avoid.
      const stride = Math.max(1, Math.ceil(hits.length / MAX_PARTICLES));
      const scale = targetW / sampleW;
      cell = Math.max(1.25, scale * 1.45);

      const cx = w / 2;
      const cy = h / 2;
      minX = cx - (sampleW / 2) * scale;
      maxX = cx + (sampleW / 2) * scale;

      const built: Particle[] = [];
      for (let i = 0; i < hits.length; i += stride) {
        const px = hits[i];
        const col = px % sampleW;
        const row = (px / sampleW) | 0;
        const tx = cx + (col - sampleW / 2) * scale;
        const ty = cy + (row - sampleH / 2) * scale;

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(w, h) * (0.6 + Math.random() * 0.55);
        const outAngle = Math.atan2(ty - cy, tx - cx) + (Math.random() - 0.5) * 0.5;
        const alphaByte = data[px * 4 + 3] / 255;

        built.push({
          tx,
          ty,
          sx: cx + Math.cos(angle) * radius,
          sy: cy + Math.sin(angle) * radius,
          ex: Math.cos(outAngle),
          ey: Math.sin(outAngle),
          // Wider spread of delays reads as assembly rather than a single swipe.
          delay: Math.random() * 0.5,
          speed: 0.35 + Math.random() * 0.8,
          bright: 0.55 + alphaByte * 0.45,
        });
      }
      particles = built;

      ctx.fillStyle = '#f2f5fa';
      startedAt = performance.now();
      raf = requestAnimationFrame(draw);
    };
    img.src = MARK_SRC;

    const onResize = () => {
      size();
      ctx.fillStyle = '#f2f5fa';
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.documentElement.style.overflow = '';
    };
  }, [reducedMotion]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-label={`${company.name} — loading`}
      className={[
        'fixed inset-0 z-100 overflow-hidden',
        // Night navy, lit from above and falling off to near-black at the base.
        'bg-[linear-gradient(180deg,#22375c_0%,#172a4a_22%,#0f1e38_52%,#081227_78%,#050b18_100%)]',
        'transition-[opacity,transform,filter] duration-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        leaving ? 'pointer-events-none scale-[1.12] opacity-0 blur-[6px]' : 'opacity-100',
      ].join(' ')}
    >
      {/* Aggregate grain, so the surface reads as concrete rather than a gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-size:180px_180px]"
        style={{ backgroundImage: `url("${sitePath('/images/grain.svg')}")` }}
      />
      {/* Vignette to keep the eye on the lockup. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_45%,transparent_35%,rgba(4,8,18,0.6)_100%)]"
      />

      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* Progress rule, set to the lockup's own width. */}
      <div
        className={[
          'absolute left-1/2 top-1/2 w-[min(64vw,900px)] -translate-x-1/2 translate-y-[7.5rem]',
          'transition-opacity duration-500',
          leaving ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <div className="relative h-px w-full bg-paper/15">
          <span
            ref={barRef}
            className="absolute inset-y-0 left-0 block w-full origin-left scale-x-0 bg-paper"
          />
        </div>
      </div>

      <div
        className={[
          'absolute inset-x-0 bottom-12 flex justify-center',
          'transition-opacity duration-500',
          leaving ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <span className="font-mono text-[0.7rem] tracking-[0.3em] text-paper/80 tabular-nums">
          <span ref={pctRef}>000</span>
          <span className="text-paper/35">%</span>
        </span>
      </div>
    </div>
  );
}
