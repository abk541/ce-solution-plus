'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { ScrollTrigger } from '@/lib/gsap';
import {
  useCompactMotion,
  useFullMotion,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

/**
 * Resolves text out of noise when it scrolls into view — characters settle
 * left-to-right rather than all at once, so it reads as a decode rather than a
 * shuffle. Screen readers always get the final string; the animated layer is
 * hidden from the accessibility tree.
 */

const GLYPHS = '#%&/\\<>[]{}=+*^~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function ScrambleText({
  text,
  className,
  speed = 1,
}: {
  text: string;
  className?: string;
  /** Multiplier on the decode duration. */
  speed?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const compactMotion = useCompactMotion();
  const fullMotion = useFullMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion || motionAllowed !== true) return;

    const chars = [...text];
    // Each character gets a settle point; later characters resolve later.
    const settleAt = chars.map((_, i) => (i / Math.max(chars.length - 1, 1)) * 0.62 + Math.random() * 0.3);
    const total = 560 * speed;
    const compactFallback = compactMotion === true && fullMotion !== true;
    let raf = 0;
    let interval = 0;
    let startedAt = 0;

    const render = (now: number) => {
      const p = Math.min((now - startedAt) / total, 1);
      let out = '';
      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i];
        if (ch === ' ') {
          out += ' ';
        } else if (p >= settleAt[i]) {
          out += ch;
        } else {
          out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
      }
      node.textContent = out;
      if (p >= 1) node.textContent = text;
      return p >= 1;
    };

    const frame = (now: number) => {
      if (!render(now)) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      startedAt = performance.now();
      if (compactFallback) {
        render(startedAt);
        interval = window.setInterval(() => {
          if (render(performance.now())) window.clearInterval(interval);
        }, 90);
      } else {
        raf = requestAnimationFrame(frame);
      }
    };

    let observer: IntersectionObserver | null = null;
    let trigger: ScrollTrigger | null = null;
    if (fullMotion !== true) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer?.disconnect();
          start();
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
      );
      observer.observe(node);
    } else {
      trigger = ScrollTrigger.create({
        trigger: node,
        start: 'top 88%',
        once: true,
        onEnter: start,
      });
    }

    return () => {
      trigger?.kill();
      observer?.disconnect();
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      node.textContent = text;
    };
  }, [compactMotion, fullMotion, text, speed, motionAllowed, reducedMotion]);

  return (
    <span className={cn('inline-block', className)}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" className="inline-block tabular-nums">
        {text}
      </span>
    </span>
  );
}
