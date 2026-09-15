import { cn } from '@/lib/cn';

/**
 * Registration marks at a panel's corners. Purely decorative — reads as a
 * drawing callout rather than a card border.
 */
export function CornerTicks({
  className,
  size = 10,
  tone = 'accent',
}: {
  className?: string;
  size?: number;
  tone?: 'accent' | 'steel';
}) {
  const color = tone === 'accent' ? 'border-accent/70' : 'border-steel-400/50';
  const box = { width: size, height: size };

  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      <span className={cn('absolute left-0 top-0 border-l border-t', color)} style={box} />
      <span className={cn('absolute right-0 top-0 border-r border-t', color)} style={box} />
      <span className={cn('absolute bottom-0 left-0 border-b border-l', color)} style={box} />
      <span className={cn('absolute bottom-0 right-0 border-b border-r', color)} style={box} />
    </span>
  );
}
