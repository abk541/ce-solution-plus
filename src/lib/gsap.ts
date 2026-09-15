import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Critically-damped spring, normalised so f(0)=0 and f(1)=1.
 * `damping` under 1 leaves a single small overshoot — that overshoot is what
 * separates "physical" from "eased", so keep it subtle (0.62–0.78).
 */
function springEase(damping: number, frequency: number) {
  const w = frequency * Math.PI * 2;
  const z = damping;
  const wd = w * Math.sqrt(Math.max(1 - z * z, 0.0001));
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const decay = Math.exp(-z * w * t);
    return 1 - decay * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  };
}

/** Registered once so components can reference eases by name in timelines. */
const EASES: Record<string, (t: number) => number> = {
  'ce-spring': springEase(0.78, 0.62),
  'ce-spring-soft': springEase(0.92, 0.5),
  'ce-spring-snap': springEase(0.66, 0.85),
  // Long, fully-damped travel. No overshoot at all — used for the big section
  // reveals where a bounce would read as cheap.
  'ce-glide': springEase(1, 0.34),
};

if (typeof window !== 'undefined') {
  for (const [name, fn] of Object.entries(EASES)) {
    gsap.registerEase(name, fn);
  }
  // Marketing page: never restore scroll position mid-timeline.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export const ease = {
  spring: 'ce-spring',
  springSoft: 'ce-spring-soft',
  springSnap: 'ce-spring-snap',
  glide: 'ce-glide',
  out: 'power3.out',
  expo: 'expo.out',
} as const;

export { gsap, ScrollTrigger };
