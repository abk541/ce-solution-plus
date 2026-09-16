'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';
import { markets } from '@/content/site';
import { duration, ease, gsap } from '@/lib/gsap';
import { sitePath } from '@/lib/site-path';
import { useCursorPlate } from '@/hooks/useCursorPlate';
import {
  useFullMotion,
  useIsomorphicLayoutEffect,
  useMotionAllowed,
  usePrefersReducedMotion,
} from '@/hooks/usePrefersReducedMotion';

export function MarketsWeServe() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const progressValueRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const fullMotion = useFullMotion();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || motionAllowed !== true) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-market-card]',
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

      // Desktop only: the section pins and the row scrubs sideways. Below lg the
      // same markup is a native snap-scroll carousel.
      const mm = gsap.matchMedia();
      if (fullMotion === true) mm.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current;
        const stage = stageRef.current;
        if (!track || !stage) return;

        const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth + 64);

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
              const progress = self.progress;
              if (progressBarRef.current) {
                gsap.set(progressBarRef.current, { scaleX: Math.max(progress, 0.02) });
              }
              if (progressValueRef.current) {
                progressValueRef.current.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
              }
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { x: 0 });
        };
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, [fullMotion, motionAllowed, reducedMotion]);

  return (
    <section ref={rootRef} id="markets" className="relative z-10 overflow-hidden">
      <div
        ref={stageRef}
        className="relative flex flex-col justify-center py-20 md:py-28 lg:h-screen lg:py-0"
      >
        <div className="shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionTag index="04">{markets.label}</SectionTag>
              <h2 className="mt-6 display-editorial text-[clamp(1.9rem,3.6vw,3rem)]">
                {markets.headline}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-steel-300">{markets.lede}</p>
          </div>
        </div>

        <div
          role="region"
          aria-label="Markets served"
          className="mt-10 overflow-x-auto pb-4 [scrollbar-width:none] lg:mt-12 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={trackRef}
            className="flex w-max snap-x snap-mandatory gap-px bg-ink-800 px-5 md:px-10 lg:snap-none lg:will-change-transform xl:px-14"
          >
            {markets.items.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>
        </div>

        <div className="shell mt-8 hidden items-center gap-5 lg:flex">
          <span className="label-mono text-[0.6rem] text-steel-400">Scroll</span>
          <span className="relative h-px flex-1 bg-ink-700">
            <span
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 w-full origin-left scale-x-[0.02] bg-accent"
            />
          </span>
          <span ref={progressValueRef} className="label-mono text-[0.6rem] text-steel-400 tabular-nums">
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
      className="group relative aspect-4/5 w-[78vw] shrink-0 snap-start overflow-hidden bg-ink-950 outline-none transition-transform duration-[var(--motion-ui)] active:scale-[0.99] sm:w-[20rem] lg:aspect-auto lg:h-[52vh] lg:w-[41.6vh]"
    >
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
        className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/70 to-ink-950/10"
      />
      {/* Specular sheen tracking the pointer. */}
      <span
        data-plate-sheen
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(45%_35%_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 border border-transparent transition-colors duration-[var(--motion-ui)] group-hover:border-accent/40 group-focus-visible:border-accent/40"
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
          aria-hidden="true"
          className="mt-3 block h-px w-8 origin-left bg-accent transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-[4] group-focus-visible:scale-x-[4]"
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
    </article>
  );
}
