'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

import { cn } from '@/lib/cn';
import { ScrollTrigger, gsap } from '@/lib/gsap';

/**
 * Mission-readiness gimbal.
 *
 * Six partial aerospace rings map to the six service lines. They assemble
 * around a faceted command core, make small stabilization corrections, and
 * align face-on as the hero hands off to About. The object is procedural so it
 * adds no model or texture request and stays comfortably below the agreed
 * geometry budget.
 */

const SERVICES = [
  'Staffing',
  'Facilities',
  'Training',
  'ProfessionalServices',
  'Construction',
  'Transportation',
] as const;

const RING_SPECS = [
  { radius: 2.2, tube: 0.052, x: 1.22, y: 0.12, z: -0.3, phase: 0.1 },
  { radius: 1.98, tube: 0.048, x: 0.38, y: 1.08, z: 0.22, phase: 1.1 },
  { radius: 1.76, tube: 0.044, x: 1.02, y: 0.7, z: 0.68, phase: 2.2 },
  { radius: 1.54, tube: 0.04, x: 0.18, y: 0.92, z: -0.72, phase: 3.2 },
  { radius: 1.32, tube: 0.036, x: 0.82, y: -0.76, z: 0.14, phase: 4.15 },
  { radius: 1.1, tube: 0.032, x: 1.34, y: 0.48, z: -1.02, phase: 5.25 },
] as const;

const RING_COLORS = ['#BFD0DC', '#1F5078', '#7394AC', '#355E93', '#BFD0DC', '#1F5078'];

type HeroMissionGimbalProps = {
  className?: string;
  onReady?: () => void;
  onFailure?: () => void;
};

export function HeroMissionGimbal({
  className,
  onReady,
  onFailure,
}: HeroMissionGimbalProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      onFailure?.();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0, 7.2);

    // Separate transform owners keep pointer, scroll, and interaction motion
    // from competing over the same rotation or scale.
    const anchorGroup = new Group();
    anchorGroup.name = 'CE_MissionReadinessGimbal';
    const scrollRig = new Group();
    scrollRig.name = 'CE_ScrollHandoff';
    const tiltRig = new Group();
    tiltRig.name = 'CE_PointerStabilizer';
    const pulseRig = new Group();
    pulseRig.name = 'CE_ReadinessPulse';
    anchorGroup.add(scrollRig);
    scrollRig.add(tiltRig);
    tiltRig.add(pulseRig);
    scene.add(anchorGroup);

    const geometries = new Set<TorusGeometry | BoxGeometry | IcosahedronGeometry | OctahedronGeometry | EdgesGeometry>();
    const materials = new Set<MeshStandardMaterial | LineBasicMaterial>();

    const ringMaterials = RING_COLORS.map((color, index) => {
      const material = new MeshStandardMaterial({
        color: new Color(color),
        metalness: index % 2 === 0 ? 0.76 : 0.64,
        roughness: index % 2 === 0 ? 0.28 : 0.36,
        transparent: true,
        opacity: 0,
      });
      materials.add(material);
      return material;
    });

    const rings = RING_SPECS.map((spec, index) => {
      // A deliberate opening keeps each ring visibly mechanical instead of a
      // generic glowing orbit. The openings settle into indexed positions.
      const geometry = new TorusGeometry(spec.radius, spec.tube, 8, 72, Math.PI * 1.72);
      geometries.add(geometry);
      const mesh = new Mesh(geometry, ringMaterials[index]);
      mesh.name = `CE_Ring_${String(index + 1).padStart(2, '0')}_${SERVICES[index]}`;

      const group = new Group();
      group.name = `${mesh.name}_Assembly`;
      group.add(mesh);
      pulseRig.add(group);

      return {
        group,
        base: { x: spec.x, y: spec.y, z: spec.z },
        intro: {
          x: (index % 2 === 0 ? 1 : -1) * (0.34 + index * 0.025),
          y: (index % 3 === 0 ? -1 : 1) * (0.26 + index * 0.018),
          z: (index - 2.5) * 0.13,
          rx: (index % 2 === 0 ? 1 : -1) * 0.46,
          ry: (index % 3 === 0 ? -1 : 1) * 0.36,
        },
        phase: spec.phase,
      };
    });

    // Six restrained vermilion locks: one for each service line. A single
    // InstancedMesh keeps all six markers to one draw call.
    const lockGeometry = new BoxGeometry(0.075, 0.18, 0.065);
    geometries.add(lockGeometry);
    const lockMaterial = new MeshStandardMaterial({
      color: new Color('#FF5C3D'),
      emissive: new Color('#4A120A'),
      emissiveIntensity: 0.32,
      metalness: 0.42,
      roughness: 0.34,
      transparent: true,
      opacity: 0,
    });
    materials.add(lockMaterial);
    const locks = new InstancedMesh(lockGeometry, lockMaterial, SERVICES.length);
    locks.name = 'CE_ServiceLineLocks_06';
    const lockMatrix = new Matrix4();
    const lockRadius = 0.83;
    SERVICES.forEach((_, index) => {
      const angle = (index / SERVICES.length) * Math.PI * 2 + Math.PI / 6;
      lockMatrix.makeRotationZ(angle);
      lockMatrix.setPosition(Math.cos(angle) * lockRadius, Math.sin(angle) * lockRadius, 0.14);
      locks.setMatrixAt(index, lockMatrix);
    });
    locks.instanceMatrix.needsUpdate = true;
    pulseRig.add(locks);

    const coreMaterial = new MeshStandardMaterial({
      color: new Color('#1F5078'),
      emissive: new Color('#10283E'),
      emissiveIntensity: 0.38,
      flatShading: true,
      metalness: 0.68,
      roughness: 0.3,
      transparent: true,
      opacity: 0,
    });
    materials.add(coreMaterial);
    const coreGeometry = new IcosahedronGeometry(0.55, 1);
    geometries.add(coreGeometry);
    const core = new Mesh(coreGeometry, coreMaterial);
    core.name = 'CE_FacetedCommandCore';
    pulseRig.add(core);

    const innerMaterial = new MeshStandardMaterial({
      color: new Color('#BFD0DC'),
      emissive: new Color('#163B5C'),
      emissiveIntensity: 0.5,
      flatShading: true,
      metalness: 0.5,
      roughness: 0.24,
      transparent: true,
      opacity: 0,
    });
    materials.add(innerMaterial);
    const innerGeometry = new OctahedronGeometry(0.3, 0);
    geometries.add(innerGeometry);
    const innerCore = new Mesh(innerGeometry, innerMaterial);
    innerCore.name = 'CE_ReadinessCore';
    innerCore.rotation.set(0.28, 0.38, 0.08);
    pulseRig.add(innerCore);

    const edgeGeometry = new EdgesGeometry(coreGeometry, 18);
    geometries.add(edgeGeometry);
    const edgeMaterial = new LineBasicMaterial({
      color: new Color('#F2F3EF'),
      transparent: true,
      opacity: 0,
    });
    materials.add(edgeMaterial);
    const coreEdges = new LineSegments(edgeGeometry, edgeMaterial);
    coreEdges.name = 'CE_CoreMachinedEdges';
    pulseRig.add(coreEdges);

    const hemisphere = new HemisphereLight(0xbfd0dc, 0x10283e, 1.4);
    const key = new DirectionalLight(0xf2f3ef, 2.7);
    key.position.set(3.8, 4.4, 5.2);
    scene.add(hemisphere, key);

    const state = { assembly: 0, scroll: 0, pulse: 0 };
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let width = 1;
    let height = 1;

    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.65);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (width >= 1280) {
        anchorGroup.position.set(2.72, 0.32, 0);
        anchorGroup.scale.setScalar(1);
      } else {
        anchorGroup.position.set(2.05, 0.38, 0);
        anchorGroup.scale.setScalar(0.86);
      }
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const hero = host.closest('section');
    const interactivePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const isInsideObjectZone = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      return (
        event.clientX >= rect.left + rect.width * 0.42 &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (!isInsideObjectZone(event)) {
        pointer.tx = 0;
        pointer.ty = 0;
        return;
      }
      pointer.tx = MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.72) * 2.4, -1, 1);
      pointer.ty = MathUtils.clamp(((event.clientY - rect.top) / rect.height - 0.48) * 2, -1, 1);
    };

    let pulseTimeline: gsap.core.Timeline | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (!isInsideObjectZone(event) || state.scroll > 0.15) return;
      pulseTimeline?.kill();
      state.pulse = 0;
      pulseTimeline = gsap
        .timeline()
        .to(state, { pulse: 1, duration: 0.18, ease: 'power2.out' })
        .to(state, { pulse: 0, duration: 0.52, ease: 'power3.out' });
    };

    if (interactivePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
    }

    let firstFrame = true;
    let elapsed = 0;
    let last = performance.now();

    const applyFrame = (delta: number) => {
      elapsed += delta;
      pointer.x += (pointer.tx - pointer.x) * 0.085;
      pointer.y += (pointer.ty - pointer.y) * 0.085;

      const assembly = state.assembly;
      const handoff = state.scroll;
      const settleStrength = assembly * (1 - handoff);
      const fade = 1 - MathUtils.clamp((handoff - 0.42) / 0.58, 0, 1) * 0.92;

      tiltRig.rotation.x += (-pointer.y * MathUtils.degToRad(3.5) - tiltRig.rotation.x) * 0.075;
      tiltRig.rotation.y += (pointer.x * MathUtils.degToRad(4) - tiltRig.rotation.y) * 0.075;

      scrollRig.position.y = handoff * -0.12;
      scrollRig.position.z = handoff * 0.9;
      scrollRig.rotation.z = handoff * MathUtils.degToRad(8);
      const scrollScale = 1 + handoff * 0.13;
      scrollRig.scale.setScalar(scrollScale);

      pulseRig.scale.setScalar(0.78 + assembly * 0.22 + state.pulse * 0.022);
      pulseRig.rotation.z = state.pulse * MathUtils.degToRad(1.8);

      rings.forEach((ring, index) => {
        const idle = Math.sin(elapsed * 0.38 + ring.phase) * MathUtils.degToRad(1.15) * settleStrength;
        const counterIdle = Math.cos(elapsed * 0.31 + ring.phase) * MathUtils.degToRad(0.8) * settleStrength;

        ring.group.position.set(
          ring.intro.x * (1 - assembly),
          ring.intro.y * (1 - assembly),
          ring.intro.z * (1 - assembly) + (index - 2.5) * 0.055 * handoff,
        );

        const assembledX = ring.base.x + ring.intro.rx * (1 - assembly) + idle;
        const assembledY = ring.base.y + ring.intro.ry * (1 - assembly) + counterIdle;
        const assembledZ = ring.base.z + idle * 0.7;
        ring.group.rotation.set(
          MathUtils.lerp(assembledX, 0.04 * (index - 2.5), handoff),
          MathUtils.lerp(assembledY, 0, handoff),
          MathUtils.lerp(assembledZ, (index - 2.5) * 0.055, handoff),
        );
      });

      ringMaterials.forEach((material) => {
        material.opacity = 0.92 * assembly * fade;
      });
      lockMaterial.opacity = assembly * fade;
      lockMaterial.emissiveIntensity = 0.28 + state.pulse * 1.2;
      coreMaterial.opacity = 0.96 * assembly * fade;
      coreMaterial.emissiveIntensity = 0.3 + assembly * 0.16 + state.pulse * 0.32;
      innerMaterial.opacity = 0.82 * assembly * fade;
      innerMaterial.emissiveIntensity = 0.42 + state.pulse * 0.5;
      edgeMaterial.opacity = 0.34 * assembly * fade;

      core.rotation.x = elapsed * 0.035 * settleStrength + handoff * 0.18;
      core.rotation.y = elapsed * -0.045 * settleStrength + handoff * -0.24;
      innerCore.rotation.y = 0.38 - elapsed * 0.08 * settleStrength;

      renderer.render(scene, camera);
      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }
    };

    let raf = 0;
    let running = false;
    let inView = true;

    const frame = (now: number) => {
      if (!running) return;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      applyFrame(delta);
      raf = window.requestAnimationFrame(frame);
    };

    const syncLoop = () => {
      const shouldRun = inView && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        window.cancelAnimationFrame(raf);
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncLoop();
    });
    intersectionObserver.observe(host);
    document.addEventListener('visibilitychange', syncLoop);

    const intro = gsap.to(state, {
      assembly: 1,
      duration: 1.55,
      ease: 'power3.out',
      delay: 0.08,
    });

    const trigger = ScrollTrigger.create({
      trigger: hero ?? host,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.55,
      onUpdate: (self) => {
        state.scroll = self.progress;
      },
    });

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      onFailure?.();
      inView = false;
      syncLoop();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // Paint immediately so the poster can crossfade only after a real frame.
    applyFrame(0);
    syncLoop();

    return () => {
      intro.kill();
      trigger.kill();
      pulseTimeline?.kill();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', syncLoop);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      running = false;
      window.cancelAnimationFrame(raf);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.domElement.remove();
      renderer.dispose();
    };
  }, [onFailure, onReady]);

  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <div ref={hostRef} className="h-full w-full" />
      {failed ? (
        <div className="absolute inset-0 [background:radial-gradient(circle_at_74%_42%,color-mix(in_srgb,var(--color-surface-strong)_26%,transparent),transparent_34%)]" />
      ) : null}
    </div>
  );
}
