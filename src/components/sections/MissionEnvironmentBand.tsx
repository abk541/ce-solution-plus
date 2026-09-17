'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import { SectionTag } from '@/components/ui/SectionTag';

const missionEnvironments = [
  { label: 'Federal missions', icon: 'federal' },
  { label: 'Maritime operations', icon: 'maritime' },
  { label: 'Air operations', icon: 'air' },
  { label: 'Land operations', icon: 'land' },
  { label: 'Intelligence support', icon: 'intelligence' },
  { label: 'Cyber missions', icon: 'cyber' },
  { label: 'Federal facilities', icon: 'facilities' },
  { label: 'Logistics & readiness', icon: 'logistics' },
] as const;

type MissionIconName = (typeof missionEnvironments)[number]['icon'];

export function MissionEnvironmentBand() {
  const rootRef = useRef<HTMLElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const motionPaused = isPaused || !isVisible;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let intersecting = true;
    const sync = () => setIsVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = Boolean(entry?.isIntersecting);
        sync();
      },
      { rootMargin: '160px 0px' },
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="mission-environments"
      aria-labelledby="mission-environments-title"
      className="relative z-10 overflow-hidden border-y border-power/50 bg-surface-canvas text-foreground-primary"
    >
      <div className="shell py-14 md:py-18 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <SectionTag>
              Mission environments
            </SectionTag>
            <h2
              id="mission-environments-title"
              className="mt-6 display-editorial text-[clamp(2rem,4.2vw,3.5rem)] text-foreground-primary"
            >
              Built for federal mission environments.
            </h2>
            <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-foreground-secondary">
              Capabilities designed for defense and federal programs.
            </p>
          </div>

          <button
            type="button"
            className="mission-band-control inline-flex min-h-11 w-fit items-center justify-center gap-3 justify-self-start border border-border-command/70 bg-surface-panel px-4 py-2.5 label-mono text-[0.62rem] text-foreground-primary transition-colors hover:border-power hover:bg-surface-intermediate focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground-primary lg:justify-self-end lg:self-end"
            aria-controls="mission-environments-track"
            aria-label={isPaused ? 'Resume mission environment band' : 'Pause mission environment band'}
            aria-pressed={isPaused}
            onClick={() => setIsPaused((paused) => !paused)}
          >
            <MotionControlIcon isPaused={isPaused} />
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      <div
        className={`mission-belt relative border-y border-border-command/55 bg-surface-intermediate${isPaused ? ' is-paused' : ''}`}
        data-paused={motionPaused ? 'true' : 'false'}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-surface-intermediate to-transparent md:w-24"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-surface-intermediate to-transparent md:w-24"
        />

        <div
          id="mission-environments-track"
          className="mission-track flex w-max motion-reduce:transform-none"
          data-paused={motionPaused ? 'true' : 'false'}
        >
          <MissionSet />
          <MissionSet duplicate />
        </div>
      </div>

      <div className="shell py-5 md:py-6">
        <p className="max-w-3xl text-xs leading-relaxed text-foreground-muted">
          Representative mission environments — not a customer list or government endorsement.
        </p>
      </div>
    </section>
  );
}

function MissionSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul
      className="mission-set flex shrink-0 items-stretch"
      data-duplicate={duplicate ? 'true' : undefined}
      aria-label={duplicate ? undefined : 'Representative mission environments'}
      aria-hidden={duplicate || undefined}
    >
      {missionEnvironments.map((mission, index) => (
        <li
          key={mission.icon}
          className="mission-mark flex min-w-[17rem] shrink-0 items-center gap-5 border-r border-border-command/55 px-7 py-9 text-foreground-primary sm:min-w-[19rem] sm:px-9 md:py-11"
        >
          <span
            aria-hidden="true"
            className="mission-mark-icon grid size-14 shrink-0 place-items-center border border-border-command/65 bg-surface-canvas text-foreground-primary"
            style={{ '--mission-delay': `${index * 1.05}s` } as CSSProperties}
          >
            <MissionIcon name={mission.icon} />
          </span>
          <span className="flex min-w-0 flex-col gap-1.5">
            <span aria-hidden="true" className="label-mono text-[0.56rem] text-power-bright tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-base font-bold leading-tight tracking-[-0.015em] text-foreground-primary">
              {mission.label}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function MotionControlIcon({ isPaused }: { isPaused: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      {isPaused ? <path d="m5.25 3.5 6 4.5-6 4.5z" /> : <path d="M5.25 3.5v9m5.5-9v9" />}
    </svg>
  );
}

function MissionIcon({ name }: { name: MissionIconName }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.35"
    >
      {name === 'federal' ? (
        <>
          <path d="M16 4.75 25.75 10v12L16 27.25 6.25 22V10z" />
          <circle cx="16" cy="16" r="4.25" />
          <path d="M16 8.25v3.5M16 20.25v3.5M8.25 16h3.5M20.25 16h3.5" />
        </>
      ) : null}

      {name === 'maritime' ? (
        <>
          <path d="M5 17.25h22l-3.4 5.25H9zM10 17.25l1.5-6.5h9l1.5 6.5M14 10.75V7.5h4v3.25" />
          <path d="M4.75 26c1.45 1.05 2.9 1.05 4.35 0s2.9-1.05 4.35 0 2.9 1.05 4.35 0 2.9-1.05 4.35 0 2.9 1.05 4.35 0" />
        </>
      ) : null}

      {name === 'air' ? (
        <>
          <path d="m5 17 9-2.5 3.25-8.25 2 .5-.75 7 7.5-1.25 1 2.25-8.75 4-1 7-2 .5-.75-6.5L6 19z" />
          <path d="M8 25.5h5.5M20 25.5h4" />
        </>
      ) : null}

      {name === 'land' ? (
        <>
          <path d="m4.5 24.5 7.25-9 4.1 4.4 4.5-6.15 7.15 10.75z" />
          <path d="m9.25 18.6 2.5 1.65 4.1-.35 3 1.85 3.95-1.1M16 7.25v7.8M16 7.25h6l-1.5 2.25L22 11.75h-6" />
        </>
      ) : null}

      {name === 'intelligence' ? (
        <>
          <circle cx="16" cy="16" r="2.5" />
          <path d="M7.25 16a8.75 8.75 0 0 1 8.75-8.75M24.75 16A8.75 8.75 0 0 1 16 24.75" />
          <path d="M4.25 16A11.75 11.75 0 0 1 16 4.25M27.75 16A11.75 11.75 0 0 1 16 27.75M16 16l6.25-6.25" />
        </>
      ) : null}

      {name === 'cyber' ? (
        <>
          <path d="M11 6H7.5A1.5 1.5 0 0 0 6 7.5V11m15-5h3.5A1.5 1.5 0 0 1 26 7.5V11M11 26H7.5A1.5 1.5 0 0 1 6 24.5V21m15 5h3.5a1.5 1.5 0 0 0 1.5-1.5V21" />
          <path d="m11 16 3-3m-3 3 3 3m7-6-3 3 3 3M16 10v12" />
          <circle cx="16" cy="7" r="1.5" />
          <circle cx="16" cy="25" r="1.5" />
        </>
      ) : null}

      {name === 'facilities' ? (
        <>
          <path d="M6 26.25h20M8.5 26.25V10.5l7.5-4.75 7.5 4.75v15.75M12 12.5h2.5m3 0H20M12 17h2.5m3 0H20M13.25 26.25v-4.75h5.5v4.75" />
        </>
      ) : null}

      {name === 'logistics' ? (
        <>
          <path d="m16 5.5 8 4.25v9L16 23l-8-4.25v-9zM8 9.75 16 14l8-4.25M16 14v9" />
          <path d="M5.25 22.5v3.75H9M26.75 22.5a11.5 11.5 0 0 1-21.5 3.75M26.75 9.5V5.75H23M5.25 9.5a11.5 11.5 0 0 1 21.5-3.75" />
        </>
      ) : null}
    </svg>
  );
}
