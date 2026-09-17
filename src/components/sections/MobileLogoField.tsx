'use client';

import { useEffect, useRef } from 'react';

import { LogoMark } from '@/components/ui/Logo';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/cn';
import { sitePath } from '@/lib/site-path';

const MARK_SRC = sitePath('/brand/mark-clean.webp');
const DOT_COUNT = 440;
const ASSEMBLE_MS = 820;
const BURST_MS = 620;

type Dot = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  size: number;
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

/**
 * A phone-sized counterpart to the desktop Three.js mark. It assembles once,
 * stops completely when idle, and wakes for one short tap response. The real
 * image remains underneath, so the brand is crisp before JS and under reduced
 * motion instead of depending on hundreds of dots to stay legible.
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

    const sample = document.createElement('canvas');
    sample.width = 136;
    sample.height = 122;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });

    const draw = (now: number) => {
      if (disposed || !dots.length) return;
      if (now - lastFrame < 1000 / 30) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const assembly = assembled ? 1 : clamp01((now - assemblyStartedAt) / ASSEMBLE_MS);
      const eased = easeOutExpo(assembly);
      const burst = burstStartedAt < 0 ? 1 : clamp01((now - burstStartedAt) / BURST_MS);
      const ringRadius = burst * Math.max(width, height) * 0.72;
      const mineral = new Path2D();
      const signal = new Path2D();

      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        let x = dot.sx + (dot.tx - dot.sx) * eased;
        let y = dot.sy + (dot.ty - dot.sy) * eased;

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
        (dot.accent ? signal : mineral).rect(x, y, size, size);
      }

      context.globalAlpha = 0.08 + eased * 0.2;
      context.fillStyle = '#F2F3EF';
      context.fill(mineral);
      context.globalAlpha = 0.22 + eased * 0.3;
      context.fillStyle = '#FF5C3D';
      context.fill(signal);
      context.globalAlpha = 1;

      if (assembly < 1 || burst < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        assembled = true;
        burstStartedAt = -1;
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
        };
      });

      cancelAnimationFrame(raf);
      assemblyStartedAt = performance.now();
      assembled = false;
      raf = requestAnimationFrame(draw);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!assembled || !dots.length) return;
      const rect = host.getBoundingClientRect();
      burstX = event.clientX - rect.left;
      burstY = event.clientY - rect.top;
      burstStartedAt = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    image.onload = build;
    image.src = MARK_SRC;
    const observer = new ResizeObserver(build);
    observer.observe(host);
    host.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
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
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />
    </div>
  );
}
