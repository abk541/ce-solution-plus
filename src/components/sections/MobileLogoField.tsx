'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';

import { LogoMark } from '@/components/ui/Logo';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/cn';
import { sitePath } from '@/lib/site-path';

const MARK_SRC = sitePath('/brand/mark-clean.webp');
const DOT_COUNT = 440;
const ASSEMBLE_MS = 820;
const BURST_MS = 620;
const FRAME_MS = 1000 / 30;
const SIGNAL_PASS_MS = 4600;

type Dot = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  size: number;
  accent: boolean;
  phase: number;
  drift: number;
  tempo: number;
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

/**
 * A phone-sized counterpart to the desktop Three.js mark. The real image stays
 * beneath the canvas for a razor-sharp silhouette while a low-amplitude field
 * keeps the mark visibly powered. Work pauses whenever the hero leaves the
 * viewport or the document is hidden.
 */
export function MobileLogoField({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || reducedMotion) return;
    if (
      window.matchMedia(
        '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
      ).matches
    ) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let disposed = false;
    let assembled = false;
    let burstStartedAt = -1;
    let burstX = 0;
    let burstY = 0;
    let lastFrame = 0;
    let assemblyStartedAt = performance.now();
    let fieldStartedAt = assemblyStartedAt;
    let activeUntil = fieldStartedAt + ASSEMBLE_MS + SIGNAL_PASS_MS;
    let fieldVisible = true;
    let documentVisible = !document.hidden;
    let pointerActive = false;
    let pointerX = 0;
    let pointerY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;

    const sample = document.createElement('canvas');
    sample.width = 136;
    sample.height = 122;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });

    const draw = (now: number) => {
      raf = 0;
      if (disposed || !dots.length || !fieldVisible || !documentVisible) return;
      if (now - lastFrame < FRAME_MS) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const assembly = assembled ? 1 : clamp01((now - assemblyStartedAt) / ASSEMBLE_MS);
      const eased = easeOutExpo(assembly);
      const burst = burstStartedAt < 0 ? 1 : clamp01((now - burstStartedAt) / BURST_MS);
      const ringRadius = burst * Math.max(width, height) * 0.72;
      const signalPass = ((now - fieldStartedAt) % SIGNAL_PASS_MS) / SIGNAL_PASS_MS;
      const signalPosition = -0.12 + signalPass * 1.24;
      const mineralLow = new Path2D();
      const mineralHigh = new Path2D();
      const signal = new Path2D();
      const energized = new Path2D();

      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        let x = dot.sx + (dot.tx - dot.sx) * eased;
        let y = dot.sy + (dot.ty - dot.sy) * eased;

        if (assembly >= 1) {
          const t = now * 0.001 * dot.tempo + dot.phase;
          x += Math.cos(t) * dot.drift;
          y += Math.sin(t * 0.87) * dot.drift;

          if (pointerActive) {
            const pointerDx = pointerX - x;
            const pointerDy = pointerY - y;
            const pointerDistance = Math.hypot(pointerDx, pointerDy) || 1;
            const pull = Math.max(0, 1 - pointerDistance / 92) * 4.8;
            x += (pointerDx / pointerDistance) * pull;
            y += (pointerDy / pointerDistance) * pull;
          }
        }

        if (burst < 1) {
          const dx = dot.tx - burstX;
          const dy = dot.ty - burstY;
          const distance = Math.hypot(dx, dy) || 1;
          const ring = Math.max(0, 1 - Math.abs(distance - ringRadius) / 28);
          const kick = ring * (1 - burst) * 18;
          x += (dx / distance) * kick;
          y += (dy / distance) * kick;
        }

        const size = dot.size * (0.65 + eased * 0.35);
        const contourPosition = (dot.tx / Math.max(width, 1)) * 0.58 + (dot.ty / Math.max(height, 1)) * 0.42;
        const passEnergy = Math.max(0, 1 - Math.abs(contourPosition - signalPosition) / 0.065);
        const shimmer = (Math.sin(now * 0.0022 * dot.tempo + dot.phase) + 1) * 0.5;

        if (passEnergy > 0.2) energized.rect(x, y, size * (1 + passEnergy * 0.36), size * (1 + passEnergy * 0.36));
        else if (dot.accent) signal.rect(x, y, size, size);
        else if (shimmer > 0.58) mineralHigh.rect(x, y, size, size);
        else mineralLow.rect(x, y, size, size);
      }

      context.globalAlpha = 0.12 + eased * 0.13;
      context.fillStyle = '#F2F3EF';
      context.fill(mineralLow);
      context.globalAlpha = 0.2 + eased * 0.2;
      context.fill(mineralHigh);
      context.globalAlpha = 0.35 + eased * 0.28;
      context.fillStyle = '#FF5C3D';
      context.fill(signal);
      context.globalAlpha = 0.72 * eased;
      context.fillStyle = '#F2F3EF';
      context.fill(energized);
      context.globalAlpha = 1;

      if (assembly >= 1) {
        assembled = true;
        if (burst >= 1) burstStartedAt = -1;
      }
      const keepAnimating =
        assembly < 1 || burst < 1 || pointerActive || now < activeUntil;
      if (keepAnimating) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      const now = performance.now();
      const shouldAnimate = !assembled || burstStartedAt >= 0 || pointerActive || now < activeUntil;
      if (!disposed && fieldVisible && documentVisible && dots.length && !raf && shouldAnimate) {
        raf = requestAnimationFrame(draw);
      }
    };

    const build = () => {
      if (disposed || !sampleContext || !image.naturalWidth) return;
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      sampleContext.clearRect(0, 0, sample.width, sample.height);
      sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
      const hits: number[] = [];
      for (let index = 0; index < sample.width * sample.height; index += 1) {
        if (pixels[index * 4 + 3] > 110) hits.push(index);
      }
      if (!hits.length) return;

      const random = seededRandom(0xce501);
      const ratio = image.naturalWidth / image.naturalHeight;
      const targetWidth = Math.min(width * 0.8, height * 0.82 * ratio);
      const targetHeight = targetWidth / ratio;
      const centerX = width * 0.55;
      const centerY = height * 0.49;

      dots = Array.from({ length: DOT_COUNT }, () => {
        const hit = hits[Math.floor(random() * hits.length)];
        const px = hit % sample.width;
        const py = Math.floor(hit / sample.width);
        const tx = centerX + (px / sample.width - 0.5) * targetWidth;
        const ty = centerY + (py / sample.height - 0.5) * targetHeight;
        const angle = random() * Math.PI * 2;
        const radius = 24 + random() * Math.max(width, height) * 0.36;
        return {
          tx,
          ty,
          sx: tx + Math.cos(angle) * radius,
          sy: ty + Math.sin(angle) * radius,
          size: 0.65 + random() * 1.05,
          accent: random() > 0.945,
          phase: random() * Math.PI * 2,
          drift: 0.45 + random() * 0.95,
          tempo: 0.72 + random() * 0.62,
        };
      });

      cancelAnimationFrame(raf);
      raf = 0;
      assemblyStartedAt = performance.now();
      fieldStartedAt = assemblyStartedAt;
      activeUntil = fieldStartedAt + ASSEMBLE_MS + SIGNAL_PASS_MS;
      assembled = false;
      start();
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!assembled || !dots.length) return;
      updatePointer(event);
      pointerActive = true;
      pointerStartX = pointerX;
      pointerStartY = pointerY;
      activeUntil = performance.now() + 900;
      start();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerActive) updatePointer(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerActive) return;
      updatePointer(event);
      const movement = Math.hypot(pointerX - pointerStartX, pointerY - pointerStartY);
      if (movement < 12) {
        burstX = pointerX;
        burstY = pointerY;
        burstStartedAt = performance.now();
        activeUntil = burstStartedAt + BURST_MS;
      }
      pointerActive = false;
    };
    const cancelPointer = () => {
      pointerActive = false;
    };
    const onVisibilityChange = () => {
      documentVisible = !document.hidden;
      if (!documentVisible) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastFrame = performance.now();
        start();
      }
    };

    image.onload = build;
    image.src = MARK_SRC;
    const observer = new ResizeObserver(build);
    observer.observe(host);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        fieldVisible = Boolean(entry?.isIntersecting);
        if (!fieldVisible) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else {
          lastFrame = performance.now();
          start();
        }
      },
      { rootMargin: '120px 0px' },
    );
    visibilityObserver.observe(host);
    host.addEventListener('pointerdown', onPointerDown, { passive: true });
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerup', onPointerUp, { passive: true });
    host.addEventListener('pointercancel', cancelPointer, { passive: true });
    host.addEventListener('pointerleave', cancelPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', cancelPointer);
      host.removeEventListener('pointerleave', cancelPointer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn('relative touch-pan-y select-none', className)}
    >
      <LogoMark
        tone="light"
        className="pointer-events-none absolute left-[55%] top-1/2 w-[72%] -translate-x-1/2 -translate-y-1/2 opacity-90 motion-reduce:opacity-100"
      />
      <span
        className="pointer-events-none absolute left-[55%] top-1/2 aspect-[340/304] w-[72%] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={
          {
            WebkitMaskImage: `url("${MARK_SRC}")`,
            maskImage: `url("${MARK_SRC}")`,
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          } as CSSProperties
        }
      >
        <span className="mobile-logo-energy-pass absolute -bottom-1/4 -top-1/4 -left-1/3 w-[22%] rotate-12 bg-linear-to-r from-transparent via-power-bright/80 to-transparent" />
      </span>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />
    </div>
  );
}
