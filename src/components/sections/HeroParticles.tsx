'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { ScrollTrigger, gsap } from '@/lib/gsap';
import { sitePath } from '@/lib/site-path';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Hero field — the CE monogram rendered as a live constellation.
 *
 * Positions are sampled from the alpha channel of the real logo mark at
 * runtime, so replacing /brand/mark-light.png reshapes the constellation.
 *
 * The monogram is the resting state, not a waypoint: the field assembles into
 * it on load and stays there. It reacts rather than morphs —
 *   hover  particles are pushed out of the cursor's way and spring back
 *   click  a shockwave ring travels outward through the field
 *   scroll the constellation loosens and fades as the hero leaves
 */

const COUNT = 9000;
const MARK_SRC = sitePath('/brand/mark-clean.webp');

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uRelease;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2  uPointer;
  uniform float uPush;
  uniform vec2  uBurstAt;
  uniform float uBurst;

  attribute vec3  aScatter;
  attribute float aRand;
  attribute float aSize;

  varying float vRand;
  varying float vSize;
  varying float vBlur;

  void main() {
    // Resting pose is the glyph; uRelease loosens it back toward the cloud.
    vec3 formed = mix(position, aScatter, uRelease);
    vec3 pos = mix(aScatter, formed, uAssemble);

    // Drift stays small while formed so the glyph edge doesn't crawl.
    float loose = max(uRelease, 1.0 - uAssemble);
    float t = uTime * 0.16 + aRand * 6.2831853;
    float amp = 0.004 + loose * 0.09;
    pos.x += sin(t) * amp * (0.5 + aRand);
    pos.y += cos(t * 1.13) * amp * (0.5 + aRand);
    pos.z += sin(t * 0.77) * amp;

    // Cursor repulsion: a small, local parting. The radius has to stay well
    // under the glyph height or hovering dismantles the monogram.
    vec2 away = pos.xy - uPointer;
    float d = length(away);
    float influence = smoothstep(0.5, 0.0, d) * uPush;
    pos.xy += normalize(away + vec2(0.0001)) * influence * (0.14 + aRand * 0.10);

    // Click shockwave: an expanding ring nudges whatever it passes through.
    vec2 fromBurst = pos.xy - uBurstAt;
    float bd = length(fromBurst);
    float ringRadius = uBurst * 3.0;
    float ring = smoothstep(0.4, 0.0, abs(bd - ringRadius));
    pos.xy += normalize(fromBurst + vec2(0.0001)) * ring * 0.26 * (1.0 - uBurst);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = max(-mv.z, 0.001);
    gl_PointSize = uSize * uPixelRatio * aSize * (1.0 / dist);

    // Depth of field: off-focus points render softer and dimmer.
    vBlur = clamp(abs(dist - 6.1) / 2.6, 0.0, 1.0);
    vRand = aRand;
    vSize = aSize;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorCore;
  uniform vec3  uColorEdge;
  uniform float uOpacity;

  varying float vRand;
  varying float vSize;
  varying float vBlur;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float f = smoothstep(0.5, 0.0, d);
    // A tight core and restrained halo keep the field crisp and instrument-like.
    float core = pow(f, mix(7.0, 1.6, vBlur));
    float halo = pow(f, 1.8) * mix(0.12, 0.24, vBlur);
    float alpha = min(core + halo, 1.0);

    // Larger points lift toward the primary tone; small ones keep the softer
    // secondary tint so additive blending never turns into a neon cyan bloom.
    vec3 col = mix(uColorEdge, uColorCore, smoothstep(0.9, 3.0, vSize));
    col += core * 0.12;

    float brightness = mix(0.45, 1.0, smoothstep(0.0, 2.5, vSize)) * (1.0 - vBlur * 0.35);
    gl_FragColor = vec4(col, alpha * uOpacity * brightness);
  }
`;

/** Approximately normal, mean 0, sd ~1. Cheaper than Box-Muller and adequate. */
function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 1.1547;
}

/** Reads the mark's alpha channel and returns `count` world-space samples. */
function sampleMark(src: string, count: number, height: number): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // `decode()` is the obvious API here but hangs indefinitely in Chromium for
    // images that are never attached to the document, so use load events.
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.onload = () => {
      try {
        const w = 260;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('2D context unavailable');
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        const hits: number[] = [];
        for (let i = 0; i < w * h; i += 1) {
          if (data[i * 4 + 3] > 110) hits.push(i);
        }
        if (!hits.length) throw new Error('Mark produced no opaque pixels');

        const scale = height / h;
        const out = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const px = hits[(Math.random() * hits.length) | 0];
          // Jitter within the source pixel so the glyph edge stays soft.
          const x = (px % w) + Math.random();
          const y = ((px / w) | 0) + Math.random();
          out[i * 3] = (x - w / 2) * scale;
          out[i * 3 + 1] = -(y - h / 2) * scale;
          out[i * 3 + 2] = gaussian() * 0.04;
        }
        resolve(out);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Sampling failed'));
      }
    };
    img.src = src;
  });
}

function buildScatter(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.65 + Math.random() * 0.75);
    out[i * 3] = Math.sin(phi) * Math.cos(theta) * r * 1.6;
    out[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    out[i * 3 + 2] = Math.cos(phi) * r * 0.8 - 1.5;
  }
  return out;
}

export function HeroParticles({
  className,
  compact = false,
  onReady,
}: {
  className?: string;
  compact?: boolean;
  onReady?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [mark, setMark] = useState<Float32Array | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    sampleMark(MARK_SRC, COUNT, 2.9)
      .then((data) => {
        if (live) setMark(data);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (failed) onReady?.();
  }, [failed, onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !mark) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const rand = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      rand[i] = Math.random();
      // Power law: mostly fine points, a scarce few large defocused orbs.
      size[i] = 0.3 + Math.pow(Math.random(), 3.9) * 3.2;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(mark, 3));
    geometry.setAttribute('aScatter', new BufferAttribute(buildScatter(COUNT, 5.2), 3));
    geometry.setAttribute('aRand', new BufferAttribute(rand, 1));
    geometry.setAttribute('aSize', new BufferAttribute(size, 1));
    geometry.setDrawRange(0, compact ? 4800 : COUNT);

    const material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAssemble: { value: reducedMotion ? 1 : 0 },
        uRelease: { value: 0 },
        uSize: { value: 26 },
        uPixelRatio: { value: 1 },
        uPointer: { value: new Vector2(999, 999) },
        uPush: { value: 0 },
        uBurstAt: { value: new Vector2(0, 0) },
        uBurst: { value: 1 },
        uOpacity: { value: reducedMotion ? 0.95 : 0 },
        // Mineral and steel keep the constellation crisp. Vermilion remains
        // reserved for structural rails so the field never reads as neon.
        uColorEdge: { value: new Color('#BFD0DC') },
        uColorCore: { value: new Color('#F2F3EF') },
      },
    });

    const points = new Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    // World units visible at the z=0 plane, used to map pointer -> field space.
    let halfH = 1;
    let halfW = 1;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = compact ? 4.55 : w < 768 ? 8.6 : 6.2;
      camera.updateProjectionMatrix();

      // Keyed off the window so it matches the `lg:` breakpoint the layout uses.
      const wide = window.innerWidth >= 1024;
      points.scale.setScalar(compact ? 0.96 : wide ? 1.25 : 1);
      points.position.x = compact ? 0.08 : wide ? 3.3 : 0;
      points.position.y = compact ? 0.05 : wide ? -0.15 : 0.1;

      halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      halfW = halfH * camera.aspect;

      material.uniforms.uPixelRatio.value = dpr;
      material.uniforms.uSize.value = compact ? 11 : w < 768 ? 20 : 26;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /** Screen point -> field-local world coordinates. */
    const toField = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      return [nx * halfW - points.position.x, ny * halfH - points.position.y] as const;
    };

    const pointer = { x: 999, y: 999, tx: 999, ty: 999 };
    let burstTween: gsap.core.Tween | null = null;
    let pushTween: gsap.core.Tween | null = null;
    let touchPointerId: number | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartedAt = 0;
    let touchMoved = false;

    const interactivePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const isInsideHost = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    };

    const updatePointer = (event: PointerEvent, snap = false) => {
      const [x, y] = toField(event.clientX, event.clientY);
      pointer.tx = x;
      pointer.ty = y;
      if (snap) {
        pointer.x = x;
        pointer.y = y;
      }
    };

    const setPush = (value: number, tweenDuration: number) => {
      pushTween?.kill();
      pushTween = gsap.to(material.uniforms.uPush, {
        value,
        duration: tweenDuration,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    const fireBurst = (event: PointerEvent) => {
      const [x, y] = toField(event.clientX, event.clientY);
      material.uniforms.uBurstAt.value.set(x, y);
      burstTween?.kill();
      material.uniforms.uBurst.value = 0;
      burstTween = gsap.to(material.uniforms.uBurst, {
        value: 1,
        duration: 1.15,
        ease: 'power2.out',
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (interactivePointer) {
        updatePointer(event);
        setPush(1, 0.5);
        return;
      }

      if (touchPointerId !== event.pointerId) return;
      updatePointer(event);
      if (Math.hypot(event.clientX - touchStartX, event.clientY - touchStartY) > 12) {
        touchMoved = true;
      }
    };

    const onPointerLeave = () => {
      setPush(0, 0.7);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      if (interactivePointer) {
        fireBurst(event);
        return;
      }
      if (!isInsideHost(event.clientX, event.clientY)) return;

      touchPointerId = event.pointerId;
      touchStartX = event.clientX;
      touchStartY = event.clientY;
      touchStartedAt = performance.now();
      touchMoved = false;
      updatePointer(event, true);
      setPush(1, 0.18);
    };

    const finishTouch = (event: PointerEvent, cancelled: boolean) => {
      if (touchPointerId !== event.pointerId) return;
      const travel = Math.hypot(event.clientX - touchStartX, event.clientY - touchStartY);
      const elapsed = performance.now() - touchStartedAt;
      const confirmedTap =
        !cancelled &&
        !touchMoved &&
        travel <= 12 &&
        elapsed <= 650 &&
        isInsideHost(event.clientX, event.clientY);

      if (confirmedTap) fireBurst(event);
      touchPointerId = null;
      touchMoved = false;
      setPush(0, 0.55);
    };

    const onPointerUp = (event: PointerEvent) => finishTouch(event, false);
    const onPointerCancel = (event: PointerEvent) => finishTouch(event, true);

    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      if (interactivePointer) {
        document.addEventListener('pointerleave', onPointerLeave);
      } else {
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerCancel, { passive: true });
      }
    }

    let visible = true;
    let documentVisible = !document.hidden;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const renderOnce = () => renderer.render(scene, camera);

    const tick = () => {
      raf = 0;
      if (!visible || !documentVisible) return;
      const now = performance.now();
      elapsed += Math.min((now - last) / 1000, 0.05);
      last = now;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uPointer.value.set(pointer.x, pointer.y);
      renderOnce();
      raf = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const startLoop = () => {
      if (reducedMotion || raf || !visible || !documentVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) startLoop();
        else stopLoop();
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(host);

    const onVisibilityChange = () => {
      documentVisible = !document.hidden;
      if (documentVisible) startLoop();
      else stopLoop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let intro: gsap.core.Timeline | null = null;
    let trigger: ScrollTrigger | null = null;

    if (reducedMotion) {
      // Static frame at the assembled monogram; no loop, no scroll binding.
      renderOnce();
      onReady?.();
    } else {
      startLoop();

      intro = gsap
        .timeline()
        .to(material.uniforms.uOpacity, { value: 0.95, duration: 1.4, ease: 'power2.out' }, 0)
        .to(material.uniforms.uAssemble, { value: 1, duration: 2.8, ease: 'ce-spring-soft' }, 0.15);

      renderOnce();
      onReady?.();

      // Leaving the hero loosens the constellation and fades it out.
      trigger = ScrollTrigger.create({
        trigger: host.closest('section') ?? host,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => {
          material.uniforms.uRelease.value = self.progress * 0.85;
          material.uniforms.uOpacity.value = 0.95 * (1 - self.progress * 0.9);
        },
      });
    }

    return () => {
      intro?.kill();
      trigger?.kill();
      burstTween?.kill();
      pushTween?.kill();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      document.removeEventListener('pointerleave', onPointerLeave);
      stopLoop();
      geometry.dispose();
      material.dispose();
      renderer.domElement.remove();
      renderer.dispose();
    };
  }, [compact, mark, onReady, reducedMotion]);

  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <div ref={hostRef} className="h-full w-full" />
      {/* Fallback for no-WebGL / decode failure: a static glow. */}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-[44vmin] w-[44vmin] [background:radial-gradient(closest-side,color-mix(in_srgb,var(--color-surface-strong)_28%,transparent),transparent_72%)]" />
          <LogoMark
            tone="light"
            className={cn(
              'relative opacity-80',
              compact ? 'w-[72%]' : 'ml-auto mr-[12%] w-[min(34vw,30rem)]',
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
