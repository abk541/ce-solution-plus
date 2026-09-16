import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';
import { sitePath } from '@/lib/site-path';

type LogoProps = {
  /** `light` = the off-white artwork, for dark surfaces. */
  tone?: 'light' | 'dark';
  /** `compact` drops the baked-in tagline, which is illegible below ~40px tall. */
  variant?: 'full' | 'compact';
  className?: string;
};

// Intrinsic artwork ratios, measured from public/brand (2x exports of logo.avif).
const LOCKUP = { full: { width: 1536, height: 304 }, compact: { width: 1590, height: 304 } };
const MARK = { width: 340, height: 304 };

/** Horizontal lockup: CE monogram + "SOLUTION PLUS". */
export function Logo({
  tone = 'light',
  variant = 'compact',
  className,
}: LogoProps) {
  const size = LOCKUP[variant];
  const source = sitePath(
    variant === 'compact' && tone === 'light'
      ? '/brand/logo-compact-clean.webp'
      : `/brand/logo${variant === 'compact' ? '-compact' : ''}-${tone}.webp`,
  );
  const maskStyle = {
    aspectRatio: `${size.width} / ${size.height}`,
    WebkitMaskImage: `url("${source}")`,
    maskImage: `url("${source}")`,
  } as CSSProperties;

  // CSS masks preserve the source alpha while filling it with the site's exact
  // paper/ink token. That removes the warm-white mismatch in the raster export.
  return (
    <span
      role="img"
      aria-label="CE Solution Plus"
      style={maskStyle}
      className={cn(
        'inline-block h-auto w-auto shrink-0 select-none [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]',
        tone === 'light' ? 'bg-paper' : 'bg-ink-950',
        className,
      )}
    />
  );
}

/** Monogram only — used where the full lockup would be illegible. */
export function LogoMark({ tone = 'light', className }: Omit<LogoProps, 'variant'>) {
  const source = sitePath(tone === 'light' ? '/brand/mark-clean.webp' : '/brand/mark-dark.webp');
  const maskStyle = {
    aspectRatio: `${MARK.width} / ${MARK.height}`,
    WebkitMaskImage: `url("${source}")`,
    maskImage: `url("${source}")`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      style={maskStyle}
      className={cn(
        'inline-block h-auto w-auto shrink-0 select-none [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]',
        tone === 'light' ? 'bg-paper' : 'bg-ink-950',
        className,
      )}
    />
  );
}
