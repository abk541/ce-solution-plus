import Image from 'next/image';

import { cn } from '@/lib/cn';
import { sitePath } from '@/lib/site-path';

type LogoProps = {
  /** `light` = the off-white artwork, for dark surfaces. */
  tone?: 'light' | 'dark';
  /** `compact` drops the baked-in tagline, which is illegible below ~40px tall. */
  variant?: 'full' | 'compact';
  className?: string;
  priority?: boolean;
};

// Intrinsic artwork ratios, measured from public/brand (2x exports of logo.avif).
const LOCKUP = { full: { width: 1536, height: 304 }, compact: { width: 1590, height: 304 } };
const MARK = { width: 340, height: 304 };

/** Horizontal lockup: CE monogram + "SOLUTION PLUS". */
export function Logo({
  tone = 'light',
  variant = 'compact',
  className,
  priority = false,
}: LogoProps) {
  const size = LOCKUP[variant];
  return (
    <Image
      src={sitePath(`/brand/logo${variant === 'compact' ? '-compact' : ''}-${tone}.webp`)}
      alt="CE Solution Plus"
      width={size.width}
      height={size.height}
      priority={priority}
      className={cn('h-auto w-auto select-none', className)}
    />
  );
}

/** Monogram only — used where the full lockup would be illegible. */
export function LogoMark({ tone = 'light', className, priority = false }: Omit<LogoProps, 'variant'>) {
  return (
    <Image
      src={sitePath(`/brand/mark-${tone}.webp`)}
      alt=""
      aria-hidden="true"
      width={MARK.width}
      height={MARK.height}
      priority={priority}
      className={cn('h-auto w-auto select-none', className)}
    />
  );
}
