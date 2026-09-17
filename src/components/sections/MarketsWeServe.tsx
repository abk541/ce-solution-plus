'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { markets } from '@/content/site';
import { cn } from '@/lib/cn';
import { duration, ease, gsap } from '@/lib/gsap';
import { sitePath } from '@/lib/site-path';
import { useCursorPlate } from '@/hooks/useCursorPlate';
import {
  useCompactMotion,
  useFullMotion,
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function MarketsWeServe() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const progressValueRef = useRef<HTMLSpanElement>(null);
  const mobileProgressBarRef = useRef<HTMLSpanElement>(null);
  const mobileProgressValueRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const compactMotion = useCompactMotion();
  const fullMotion = useFullMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || motionAllowed !== true) return;
    const compactFallback = compactMotion === true && fullMotion !== true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-market-surface]',
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: duration.reveal,
          stagger: duration.stagger,
          ease: ease.spring,
          scrollTrigger: { trigger: root, start: 'top 70%', once: true },
        },
      );

      // Full choreography is input-agnostic: native vertical scrolling drives
      // the same pinned horizontal sequence on touch and fine-pointer devices.
      // Touch is never routed through a synthetic scroller.
      if (fullMotion === true) {
        const track = trackRef.current;
        const stage = stageRef.current;
        if (!track || !stage) return;
        const cards = Array.from(
          track.querySelectorAll<HTMLElement>('[data-market-card]'),
        );

        const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth + 64);
        let trackBaseLeft = 0;
        let focusX = stage.clientWidth / 2;
        let falloff = Math.max(stage.clientWidth * 0.52, 1);
        let cardCenters = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
        let lastPercent = -1;

        const measureGeometry = () => {
          const currentX = Number(gsap.getProperty(track, 'x')) || 0;
          const trackRect = track.getBoundingClientRect();
          const stageRect = stage.getBoundingClientRect();
          trackBaseLeft = trackRect.left - currentX;
          focusX = stageRect.left + stageRect.width / 2;
          falloff = Math.max(stageRect.width * 0.52, 1);
          cardCenters = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
        };

        const updateCardDepth = () => {
          const currentX = Number(gsap.getProperty(track, 'x')) || 0;
          const states = cards.map((card, index) => {
            const center = trackBaseLeft + currentX + cardCenters[index];
            const offset = gsap.utils.clamp(
              -1,
              1,
              (center - focusX) / falloff,
            );
            const weight = 1 - Math.abs(offset);
            return { card, offset, weight };
          });

          // The rail owns horizontal travel; cards only receive local depth
          // and focus transforms so pointer-driven artwork remains independent.
          states.forEach(({ card, offset, weight }) => {
            gsap.set(card, {
              z: -44 * (1 - weight),
              rotationY: -offset * 4.2,
              scale: 0.97 + weight * 0.03,
              opacity: 1,
              transformOrigin: '50% 50%',
              force3D: true,
              willChange: 'transform, opacity',
            });
          });
        };

        const updateProgress = (progress: number) => {
          const scale = Math.max(progress, 0.02);
          if (progressBarRef.current) {
            gsap.set(progressBarRef.current, { scaleX: scale });
          }
          if (mobileProgressBarRef.current) {
            gsap.set(mobileProgressBarRef.current, { scaleX: scale });
          }
          const percent = Math.round(progress * 100);
          if (percent === lastPercent) return;
          lastPercent = percent;
          const label = `${String(percent).padStart(3, '0')}%`;
          if (progressValueRef.current) progressValueRef.current.textContent = label;
          if (mobileProgressValueRef.current) mobileProgressValueRef.current.textContent = label;
        };

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.75,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              updateCardDepth();
              updateProgress(self.progress);
            },
            onRefresh: (self) => {
              measureGeometry();
              updateCardDepth();
              updateProgress(self.progress);
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: 'transform' });
          gsap.set(cards, {
            clearProps: 'transform,opacity,transformOrigin,willChange',
          });
          if (progressBarRef.current) {
            gsap.set(progressBarRef.current, { clearProps: 'transform' });
          }
          if (progressValueRef.current) {
            progressValueRef.current.textContent = '000%';
          }
          if (mobileProgressBarRef.current) {
            gsap.set(mobileProgressBarRef.current, { clearProps: 'transform' });
          }
          if (mobileProgressValueRef.current) {
            mobileProgressValueRef.current.textContent = '000%';
          }
        };
      }
    }, root);

    const rail = railRef.current;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-market-card]'));
    let mobileFrame = 0;
    let settleTimer = 0;
    let lastMobilePercent = -1;
    const updateMobileRail = () => {
      mobileFrame = 0;
      if (!rail || !compactFallback) return;

      const max = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      const progress = max > 0 ? rail.scrollLeft / max : 0;
      const railRect = rail.getBoundingClientRect();
      const focusX = railRect.left + railRect.width / 2;
      const falloff = Math.max(railRect.width * 0.72, 1);
      const states = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const signedOffset = Math.max(
          -1,
          Math.min(1, (rect.left + rect.width / 2 - focusX) / falloff),
        );
        const weight = 1 - Math.abs(signedOffset);
        return { card, signedOffset, weight };
      });

      if (mobileProgressBarRef.current) {
        mobileProgressBarRef.current.style.transform = `scaleX(${Math.max(progress, 0.02)})`;
      }
      const percent = Math.round(progress * 100);
      if (mobileProgressValueRef.current && percent !== lastMobilePercent) {
        lastMobilePercent = percent;
        mobileProgressValueRef.current.textContent = `${String(percent).padStart(3, '0')}%`;
      }
      states.forEach(({ card, signedOffset, weight }) => {
        card.style.setProperty('--market-scale', String(0.96 + weight * 0.04));
        card.style.opacity = String(0.78 + weight * 0.22);
        card.style.setProperty('--market-art-x', `${signedOffset * -8}px`);
        card.style.setProperty('--market-art-scale', String(1.015 + weight * 0.02));
        card.style.setProperty('--market-rule', String(0.75 + weight * 3.25));
        card.toggleAttribute('data-current', weight > 0.72);
      });
    };
    const onMobileRail = () => {
      if (rail && compactFallback) {
        rail.setAttribute('data-moving', 'true');
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          rail.removeAttribute('data-moving');
          if (!mobileFrame) mobileFrame = window.requestAnimationFrame(updateMobileRail);
        }, 90);
      }
      if (!mobileFrame) mobileFrame = window.requestAnimationFrame(updateMobileRail);
    };
    if (compactFallback) {
      rail?.addEventListener('scroll', onMobileRail, { passive: true });
      window.addEventListener('resize', onMobileRail, { passive: true });
      mobileFrame = window.requestAnimationFrame(updateMobileRail);
    }

    return () => {
      rail?.removeEventListener('scroll', onMobileRail);
      window.removeEventListener('resize', onMobileRail);
      window.cancelAnimationFrame(mobileFrame);
      window.clearTimeout(settleTimer);
      rail?.removeAttribute('data-moving');
      cards.forEach((card) => {
        card.style.removeProperty('--market-scale');
        card.style.removeProperty('opacity');
        card.style.removeProperty('--market-art-x');
        card.style.removeProperty('--market-art-scale');
        card.style.removeProperty('--market-rule');
        card.removeAttribute('data-current');
      });
      mobileProgressBarRef.current?.style.removeProperty('transform');
      ctx.revert();
    };
  }, [compactMotion, fullMotion, motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} id="markets" className="relative z-10 overflow-hidden bg-surface-intermediate text-foreground-secondary">
      <div
        ref={stageRef}
        className="relative flex h-[100svh] min-h-[34rem] flex-col justify-center py-14 [@media(max-height:500px)]:min-h-0 [@media(max-height:500px)]:py-8 md:py-20 lg:h-screen lg:min-h-0 lg:py-0"
      >
        <div className="shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionTag index="04">{markets.label}</SectionTag>
              <h2 className="mt-6 display-editorial text-[clamp(1.9rem,3.6vw,3rem)] text-foreground-primary">
                {markets.headline}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-foreground-secondary">{markets.lede}</p>
          </div>
        </div>

        <div
          ref={railRef}
          data-market-rail
          role="region"
          aria-label="Markets served"
          className={cn(
            'mt-8 [scrollbar-width:none] lg:mt-12 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden',
            fullMotion === true ? 'overflow-visible pb-0' : 'overflow-x-auto pb-4',
          )}
        >
          <div
            ref={trackRef}
            className={cn(
              'flex w-max gap-px bg-border-command/45 px-5 [perspective:1400px] [transform-style:preserve-3d] will-change-transform md:px-10 xl:px-14',
              fullMotion === true ? 'snap-none' : 'snap-x snap-mandatory',
            )}
          >
            {markets.items.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>
        </div>

        <div className="shell mt-5 flex items-center gap-4 lg:hidden" aria-hidden="true">
          <span className="label-mono text-[0.56rem] text-foreground-secondary">
            {fullMotion === true ? 'Scroll' : 'Swipe'}
          </span>
          <span className="relative h-px flex-1 overflow-hidden bg-border-command/45">
            <span
              ref={mobileProgressBarRef}
              className="absolute inset-0 origin-left scale-x-[0.02] bg-power"
            />
          </span>
          <span
            ref={mobileProgressValueRef}
            className="min-w-[3.2rem] text-right label-mono text-[0.56rem] text-foreground-secondary tabular-nums"
          >
            000%
          </span>
        </div>

        <div className="shell mt-8 hidden items-center gap-5 lg:flex">
          <span className="label-mono text-[0.6rem] text-foreground-secondary">Scroll</span>
          <span className="relative h-px flex-1 bg-border-command/45">
            <span
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 w-full origin-left scale-x-[0.02] bg-power"
            />
          </span>
          <span ref={progressValueRef} className="label-mono text-[0.6rem] text-foreground-secondary tabular-nums">
            000%
          </span>
        </div>
      </div>
    </section>
  );
}

function MarketCard({
  market,
  index,
}: {
  market: (typeof markets.items)[number];
  index: number;
}) {
  const ref = useCursorPlate<HTMLElement>();

  return (
    <article
      ref={ref}
      data-market-card
      tabIndex={0}
      className="group relative h-[min(43svh,97.5vw)] w-[78vw] shrink-0 snap-start overflow-hidden bg-ink-950 outline-none [backface-visibility:hidden] transition-transform duration-[var(--motion-ui)] active:scale-[0.99] sm:h-[min(48svh,25rem)] sm:w-[20rem] lg:aspect-auto lg:h-[52vh] lg:w-[41.6vh] lg:transition-none"
    >
      <div data-market-surface className="relative h-full w-full">
        {/* Slightly oversized so the parallax shift never exposes an edge. */}
        <span data-plate-art className="absolute -inset-[4%] block">
          {/* PLACEHOLDER plate — swap for client photography of this market. */}
          <Image
            src={sitePath(`/images/${market.imageSeed}.svg`)}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1024px) 78vw, 42vh"
            loading="lazy"
            className="object-cover transition-transform duration-[var(--motion-feature)] ease-[var(--ease-spring)] group-hover:scale-105 group-focus-visible:scale-105"
          />
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/48 to-ink-950/5"
        />
        {/* Specular sheen tracking the pointer. */}
        <span
          data-plate-sheen
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(45%_35%_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_70%)]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 border border-transparent transition-colors duration-[var(--motion-ui)] group-hover:border-power/50 group-focus-visible:border-accent/55"
        />

        <span className="absolute left-5 top-5 label-mono text-[0.58rem] text-steel-300 tabular-nums">
          {String(index + 1).padStart(2, '0')}
          <span className="text-steel-400">/{String(markets.items.length).padStart(2, '0')}</span>
        </span>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="text-lg font-bold leading-tight tracking-tight text-paper xl:text-xl">
            {market.title}
          </h3>
          <span
            data-market-rule
            aria-hidden="true"
            className="mt-3 block h-[3px] w-8 origin-left bg-power transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-[4] group-focus-visible:scale-x-[4]"
          />
          <div data-hover-details className="grid grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="pt-4 text-[0.85rem] leading-relaxed text-steel-200">
                {market.description}
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${market.title} tags`}>
                {market.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-steel-400/35 bg-ink-950/55 px-2 py-1.5 label-mono text-[0.48rem] leading-none text-steel-200"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
