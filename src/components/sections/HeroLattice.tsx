'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const SPACING = 26;
const DOT = 1.4;
/** Angular half-width of the sweep's ignition band, in radians. */
const SWEEP_SIGMA = 0.3;
const SWEEP_SPEED = 0.26; // rad/s — deliberately slow; this is instrumentation.
const DECAY = 1.9; // energy lost per second
const POINTER_RADIUS = 170;

type Dot = { x: number; y: number; a: number; d: number; e: number; ox: number; oy: number };

/**
 * Hero substrate: a phased-array lattice.
 *
 * A fixed dot grid is swept by a rotating bearing line; dots inside the sweep's
 * leading edge ignite and decay back to steel. The pointer displaces and
 * brightens nearby nodes. Everything is one accent colour on neutrals — no
 * bloom, no particles, no colour cycling.
 *
 * Reduced motion renders a single static frame and never starts a RAF loop.
 */
export function HeroLattice({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let dots: Dot[] = [];
    let originX = 0;
    let originY = 0;
    let maxRadius = 1;

    const pointer = { x: -9999, y: -9999, active: false };
    let scrollFade = 1;
    let sweep = -Math.PI * 0.35;
    let raf = 0;
    let last = 0;
    let visible = true;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Bearing origin sits off the lower-left edge so the sweep enters frame
      // diagonally rather than pinwheeling around the centre.
      originX = width * 0.14;
      originY = height * 1.02;
      maxRadius = Math.hypot(width - originX, originY) || 1;

      const cols = Math.ceil(width / SPACING) + 2;
      const rows = Math.ceil(height / SPACING) + 2;
      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING - SPACING;
          const y = r * SPACING - SPACING;
          const dx = x - originX;
          const dy = y - originY;
          dots.push({
            x,
            y,
            a: Math.atan2(dy, dx),
            d: Math.hypot(dx, dy) / maxRadius,
            e: 0,
            ox: 0,
            oy: 0,
          });
        }
      }
    };

    const drawReticle = (alpha: number) => {
      ctx.save();
      ctx.strokeStyle = `rgba(141, 175, 192, ${0.26 * alpha})`;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(originX, originY, (maxRadius / 5) * i, Math.PI * 1.08, Math.PI * 1.98);
        ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const angle = Math.PI * 1.08 + (Math.PI * 0.9 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + Math.cos(angle) * maxRadius, originY + Math.sin(angle) * maxRadius);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawDots = (alpha: number) => {
      for (const dot of dots) {
        const falloff = 1 - Math.min(dot.d, 1) * 0.55;
        const base = 0.44 * falloff;
        const energy = Math.min(dot.e, 1);
        const px = dot.x + dot.ox;
        const py = dot.y + dot.oy;

        if (energy > 0.02) {
          const size = DOT + energy * 1.7;
          ctx.fillStyle = `rgba(141, 175, 192, ${Math.min(0.95, energy * 0.95) * alpha})`;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
        } else {
          ctx.fillStyle = `rgba(197, 210, 215, ${base * alpha})`;
          ctx.fillRect(px - DOT / 2, py - DOT / 2, DOT, DOT);
        }
      }
    };

    const drawSweep = (alpha: number) => {
      const grad = ctx.createLinearGradient(
        originX,
        originY,
        originX + Math.cos(sweep) * maxRadius,
        originY + Math.sin(sweep) * maxRadius,
      );
      grad.addColorStop(0, 'rgba(141, 175, 192, 0)');
      grad.addColorStop(0.35, `rgba(141, 175, 192, ${0.42 * alpha})`);
      grad.addColorStop(1, 'rgba(141, 175, 192, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + Math.cos(sweep) * maxRadius, originY + Math.sin(sweep) * maxRadius);
      ctx.stroke();
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, width, height);
      drawReticle(1);
      drawDots(1);
    };

    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;

      const dt = Math.min((time - last) / 1000 || 0, 0.05);
      last = time;
      sweep += SWEEP_SPEED * dt;
      // Keep the bearing inside the visible quadrant; wrap rather than spin.
      if (sweep > Math.PI * -0.02) sweep = -Math.PI * 0.92;

      ctx.clearRect(0, 0, width, height);
      const alpha = scrollFade;
      if (alpha <= 0.01) return;

      drawReticle(alpha);

      for (const dot of dots) {
        let delta = dot.a - sweep;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        if (Math.abs(delta) < SWEEP_SIGMA * 2.5) {
          const ignite = Math.exp(-(delta * delta) / (2 * SWEEP_SIGMA * SWEEP_SIGMA));
          dot.e = Math.max(dot.e, ignite * (1 - Math.min(dot.d, 1) * 0.45));
        }
        dot.e = Math.max(0, dot.e - DECAY * dt * (0.4 + dot.e));

        if (pointer.active) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_RADIUS) {
            const force = (1 - dist / POINTER_RADIUS) ** 2;
            const push = force * 9;
            dot.ox += ((dx / (dist || 1)) * push - dot.ox) * 0.16;
            dot.oy += ((dy / (dist || 1)) * push - dot.oy) * 0.16;
            dot.e = Math.max(dot.e, force * 0.55);
          } else {
            dot.ox *= 0.86;
            dot.oy *= 0.86;
          }
        } else {
          dot.ox *= 0.86;
          dot.oy *= 0.86;
        }
      }

      drawDots(alpha);
      drawSweep(alpha);
    };

    build();

    const resizeObserver = new ResizeObserver(() => {
      build();
      if (reducedMotion) renderStatic();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    if (reducedMotion) {
      renderStatic();
      return () => {
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
      };
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x > -80 && pointer.x < width + 80 && pointer.y > -80 && pointer.y < height + 80;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      // Fraction of the canvas still below the viewport top.
      scrollFade = Math.max(0, Math.min(1, rect.bottom / (rect.height || 1)));
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      // Canvas is decorative; the hero reads fine without it.
      role="presentation"
    />
  );
}
